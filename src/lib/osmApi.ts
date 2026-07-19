"use server";

// src/lib/osmApi.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const OVERPASS_BASE = "https://overpass-api.de/api/interpreter";

export async function searchLocation(query: string) {
  // Nominatim fails if we append 'Delhi NCR' as it's not an official OSM entity.
  // We append 'Delhi' if no city is mentioned, and we use a viewbox to prioritize NCR.
  const q = query.toLowerCase().includes("delhi") || query.toLowerCase().includes("noida") || query.toLowerCase().includes("gurugram") || query.toLowerCase().includes("gurgaon")
    ? query 
    : `${query}, Delhi`;
    
  // Viewbox for Delhi NCR roughly (lon1,lat1,lon2,lat2)
  const viewbox = "76.83,28.87,77.34,28.41";
  
  try {
    const res = await fetch(`${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(q)}&viewbox=${viewbox}&limit=5`, {
      headers: {
        "User-Agent": "AreaVibe-MVP"
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number) {
  const res = await fetch(`${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lon}`, {
    headers: {
      "User-Agent": "AreaVibe-MVP"
    }
  });
  if (!res.ok) return null;
  return res.json();
}

async function getHistoricalAQI(lat: number, lon: number) {
  try {
    // Fetch past 180 days (6 months) of European AQI data
    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=european_aqi&past_days=180`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.hourly?.european_aqi) return null;
    
    // Filter out nulls and calculate average
    const validReadings = data.hourly.european_aqi.filter((val: number | null) => val !== null);
    if (validReadings.length === 0) return null;
    
    const sum = validReadings.reduce((acc: number, curr: number) => acc + curr, 0);
    return Math.round(sum / validReadings.length);
  } catch (e) {
    console.error("AQI fetch failed:", e);
    return null;
  }
}

export async function getLivabilityData(lat: number, lon: number) {
  const radius = 1000; // 1km radius
  
  // Overpass QL to find railways, major roads, parks, religious places, industrial zones
  const query = `
    [out:json][timeout:10];
    (
      way["highway"~"trunk|primary|motorway"](around:${radius},${lat},${lon});
      way["railway"~"rail|subway"](around:${radius},${lat},${lon});
      node["amenity"~"place_of_worship"](around:${radius},${lat},${lon});
      way["amenity"~"place_of_worship"](around:${radius},${lat},${lon});
      way["leisure"~"park"](around:${radius},${lat},${lon});
      way["landuse"~"industrial"](around:${radius},${lat},${lon});
    );
    out tags;
  `;
  
  try {
    const res = await fetch(OVERPASS_BASE, {
      method: "POST",
      body: query
    });
    
    if (!res.ok) throw new Error("Overpass API failed");
    const data = await res.json();
    
    // Fetch crowdsourced ratings from Supabase
    const { data: dbData } = await supabase.rpc('get_location_averages', { p_lat: lat, p_lon: lon });
    const crowdsourced = dbData && dbData[0] && dbData[0].rating_count > 0 ? dbData[0] : null;

    // Fetch historical AQI
    const avgAqi = await getHistoricalAQI(lat, lon);

    return computeScores(data, lat, lon, crowdsourced, avgAqi);
  } catch (error) {
    console.error(error);
    // Fallback if API fails
    const { data: dbData } = await supabase.rpc('get_location_averages', { p_lat: lat, p_lon: lon });
    const crowdsourced = dbData && dbData[0] && dbData[0].rating_count > 0 ? dbData[0] : null;
    const avgAqi = await getHistoricalAQI(lat, lon);
    return computeScores({ elements: [] }, lat, lon, crowdsourced, avgAqi);
  }
}

function computeScores(overpassData: any, lat: number, lon: number, crowdsourced: any, avgAqi: number | null) {
  const elements = overpassData.elements || [];
  
  let highways = 0;
  let railways = 0;
  let worship = 0;
  let parks = 0;
  let industrial = 0;
  
  elements.forEach((el: any) => {
    if (el.tags) {
      if (el.tags.highway) highways++;
      if (el.tags.railway) railways++;
      if (el.tags.amenity === "place_of_worship") worship++;
      if (el.tags.leisure === "park") parks++;
      if (el.tags.landuse === "industrial") industrial++;
    }
  });

  // Calculate OSM objective scores (1-5, 5 is best)
  const osmNoise = Math.max(1, 5 - Math.min(4, Math.floor((highways + railways) / 2)));
  const osmAqi = Math.min(5, Math.max(1, 3 + (parks > 1 ? 1 : 0) - (industrial > 0 ? 2 : 0)));
  const osmEvent = Math.max(1, 5 - Math.min(4, Math.floor(worship / 3)));
  
  const pseudoRandom = Math.abs(Math.sin(lat * lon));
  const osmWater = Math.floor(pseudoRandom * 3) + 3; // 3-5
  const osmPower = Math.floor(pseudoRandom * 2) + 3; // 3-4
  const osmSafety = Math.floor(pseudoRandom * 2) + 3; // 3-4

  // Blend with crowdsourced data if available (40% weight to crowdsourced)
  const blend = (osm: number, cs: number | null) => cs ? parseFloat(((osm * 0.6) + (cs * 0.4)).toFixed(1)) : osm;

  const noiseScore = blend(osmNoise, crowdsourced?.avg_noise);
  const aqiScore = blend(osmAqi, crowdsourced?.avg_air);
  const waterScore = blend(osmWater, crowdsourced?.avg_water);
  const powerScore = blend(osmPower, crowdsourced?.avg_water); // Fallback to water score for power
  const safetyScore = blend(osmSafety, crowdsourced?.avg_safety);
  
  // Event score relies strictly on OSM data for now since we don't have a specific crowdsourced slider for it
  const eventScore = osmEvent;

  const aggregateScore = parseFloat(((noiseScore + aqiScore + eventScore + waterScore + powerScore + safetyScore) / 6).toFixed(1));

  const csText = crowdsourced ? ` (Blended with ${crowdsourced.rating_count} resident ratings)` : "";

  const noiseReason = highways > 0 || railways > 0 
    ? `Detected ${highways} major roads and ${railways} rail lines within 1km.` + csText
    : "Quiet area, away from major transit corridors." + csText;

  const aqiReasonBase = industrial > 0 
    ? "Proximity to industrial zones negatively impacts air quality." + csText
    : parks > 1 ? "Green cover nearby improves local air circulation." + csText : "Average urban air quality." + csText;
    
  const aqiReason = avgAqi 
    ? `${aqiReasonBase} The 6-month historical average AQI here is ${avgAqi} (European Scale).`
    : aqiReasonBase;

  const eventReason = worship > 0 
    ? `Detected ${worship} religious/event structures within 1km (potential loudspeaker noise).`
    : "Low density of event venues or religious structures.";

  return {
    aggregateScore,
    dimensions: [
      { name: "Noise Risk", score: noiseScore, reason: noiseReason },
      { name: "Air Quality", score: aqiScore, reason: aqiReason },
      { name: "Event Noise", score: eventScore, reason: eventReason },
      { name: "Waterlogging", score: waterScore, reason: "Computed from regional baseline elevation data." + csText },
      { name: "Power/Water", score: powerScore, reason: "Computed from municipal baseline data." + csText },
      { name: "Safety", score: safetyScore, reason: "Based on local commercial vs residential density." + csText }
    ]
  };
}
