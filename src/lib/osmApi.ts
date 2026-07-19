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
  const radius = 800; // 800m radius for focused analysis
  
  // Comprehensive Overpass query — captures ALL noise-relevant infrastructure
  const query = `
    [out:json][timeout:15];
    (
      // Roads — ALL types that generate traffic noise
      way["highway"~"motorway|trunk|primary|secondary|tertiary"](around:${radius},${lat},${lon});
      way["railway"~"rail|subway|light_rail"](around:${radius},${lat},${lon});
      
      // Commercial activity — shops, restaurants, bars, markets (noise sources)
      node["shop"](around:${radius},${lat},${lon});
      node["amenity"~"restaurant|cafe|fast_food|bar|pub|nightclub"](around:${radius},${lat},${lon});
      node["amenity"~"marketplace|fuel"](around:${radius},${lat},${lon});
      way["landuse"="commercial"](around:${radius},${lat},${lon});
      way["landuse"="retail"](around:${radius},${lat},${lon});
      
      // Religious/event structures
      node["amenity"="place_of_worship"](around:${radius},${lat},${lon});
      way["amenity"="place_of_worship"](around:${radius},${lat},${lon});
      node["amenity"~"community_centre|events_venue"](around:${radius},${lat},${lon});
      
      // Green spaces
      way["leisure"="park"](around:${radius},${lat},${lon});
      way["leisure"="garden"](around:${radius},${lat},${lon});
      node["leisure"="park"](around:${radius},${lat},${lon});
      
      // Industrial / construction
      way["landuse"="industrial"](around:${radius},${lat},${lon});
      node["landuse"="construction"](around:${radius},${lat},${lon});
      way["landuse"="construction"](around:${radius},${lat},${lon});
      
      // Safety-relevant — police, hospitals, schools
      node["amenity"~"police|hospital|clinic"](around:${radius},${lat},${lon});
      node["amenity"~"school|college|university"](around:${radius},${lat},${lon});
      
      // Waterlogging-relevant — drains, waterways
      way["waterway"~"drain|stream|canal"](around:${radius},${lat},${lon});
      way["natural"="water"](around:${radius},${lat},${lon});
    );
    out tags;
  `;
  
  try {
    const [overpassRes, dbRes, avgAqi] = await Promise.all([
      fetch(OVERPASS_BASE, { method: "POST", body: query }),
      supabase.rpc('get_location_averages', { p_lat: lat, p_lon: lon }),
      getHistoricalAQI(lat, lon)
    ]);
    
    if (!overpassRes.ok) throw new Error("Overpass API failed");
    const data = await overpassRes.json();
    
    const crowdsourced = dbRes.data && dbRes.data[0] && dbRes.data[0].rating_count > 0 ? dbRes.data[0] : null;

    return computeScores(data, lat, lon, crowdsourced, avgAqi);
  } catch (error) {
    console.error(error);
    const { data: dbData } = await supabase.rpc('get_location_averages', { p_lat: lat, p_lon: lon });
    const crowdsourced = dbData && dbData[0] && dbData[0].rating_count > 0 ? dbData[0] : null;
    const avgAqi = await getHistoricalAQI(lat, lon);
    return computeScores({ elements: [] }, lat, lon, crowdsourced, avgAqi);
  }
}

function computeScores(overpassData: any, _lat: number, _lon: number, crowdsourced: any, avgAqi: number | null) {
  const elements = overpassData.elements || [];
  
  // Count everything
  let majorRoads = 0;   // motorway, trunk, primary
  let minorRoads = 0;   // secondary, tertiary
  let railways = 0;
  let shops = 0;
  let restaurants = 0;  // restaurants, cafes, fast_food
  let bars = 0;         // bars, pubs, nightclubs
  let markets = 0;      // marketplace, fuel, commercial, retail landuse
  let worship = 0;
  let eventVenues = 0;
  let parks = 0;
  let industrial = 0;
  let construction = 0;
  let police = 0;
  let hospitals = 0;
  let schools = 0;
  let drains = 0;
  let waterBodies = 0;
  
  elements.forEach((el: any) => {
    if (!el.tags) return;
    const t = el.tags;
    
    // Roads
    if (t.highway === "motorway" || t.highway === "trunk" || t.highway === "primary") majorRoads++;
    else if (t.highway === "secondary" || t.highway === "tertiary") minorRoads++;
    
    if (t.railway) railways++;
    
    // Commercial
    if (t.shop) shops++;
    if (t.amenity === "restaurant" || t.amenity === "cafe" || t.amenity === "fast_food") restaurants++;
    if (t.amenity === "bar" || t.amenity === "pub" || t.amenity === "nightclub") bars++;
    if (t.amenity === "marketplace" || t.amenity === "fuel") markets++;
    if (t.landuse === "commercial" || t.landuse === "retail") markets++;
    
    // Religious/event
    if (t.amenity === "place_of_worship") worship++;
    if (t.amenity === "community_centre" || t.amenity === "events_venue") eventVenues++;
    
    // Green
    if (t.leisure === "park" || t.leisure === "garden") parks++;
    
    // Industrial
    if (t.landuse === "industrial") industrial++;
    if (t.landuse === "construction") construction++;
    
    // Safety
    if (t.amenity === "police") police++;
    if (t.amenity === "hospital" || t.amenity === "clinic") hospitals++;
    if (t.amenity === "school" || t.amenity === "college" || t.amenity === "university") schools++;
    
    // Water
    if (t.waterway) drains++;
    if (t.natural === "water") waterBodies++;
  });

  // ======= NOISE RISK =======
  // Traffic noise: major roads are very noisy, minor roads contribute too
  // Commercial activity: shops + restaurants + bars generate significant ground-level noise
  const trafficPenalty = (majorRoads * 1.5) + (minorRoads * 0.5) + (railways * 2);
  const commercialPenalty = Math.min(3, (shops * 0.1) + (restaurants * 0.15) + (bars * 0.3) + (markets * 0.4));
  const noisePenalty = trafficPenalty + commercialPenalty;
  const osmNoise = Math.max(1, Math.min(5, Math.round((5 - noisePenalty) * 10) / 10));

  // ======= AIR QUALITY =======
  // Use real AQI data as the PRIMARY signal
  let osmAqi: number;
  if (avgAqi !== null) {
    // European AQI scale: 0-20 excellent, 20-40 fair, 40-60 moderate, 60-80 poor, 80-100 very poor, 100+ extremely poor
    // Delhi typically 60-200+
    if (avgAqi <= 25) osmAqi = 5;
    else if (avgAqi <= 50) osmAqi = 4;
    else if (avgAqi <= 75) osmAqi = 3;
    else if (avgAqi <= 100) osmAqi = 2;
    else osmAqi = 1;
  } else {
    // Fallback: use parks & industrial as proxy
    osmAqi = Math.min(5, Math.max(1, 3 + (parks > 0 ? 1 : 0) - (industrial > 0 ? 2 : 0)));
  }
  // Industrial and construction near the location further penalize
  if (industrial > 0) osmAqi = Math.max(1, osmAqi - 1);
  if (construction > 0) osmAqi = Math.max(1, osmAqi - 0.5);
  osmAqi = Math.round(osmAqi * 10) / 10;

  // ======= EVENT NOISE =======
  // Each place of worship and event venue adds noise risk
  const eventPenalty = (worship * 0.8) + (eventVenues * 1);
  const osmEvent = Math.max(1, Math.min(5, Math.round((5 - eventPenalty) * 10) / 10));

  // ======= WATERLOGGING =======
  // More drains/canals nearby = better drainage. Water bodies near = flood risk.
  // Base score of 3 for Delhi. Drains improve it. Standing water worsens it.
  let osmWater = 3;
  if (drains >= 2) osmWater += 1; // Good drainage infra
  if (drains >= 1) osmWater += 0.5;
  if (waterBodies > 0) osmWater -= 1; // Flood risk
  if (parks > 2) osmWater += 0.5; // Green spaces absorb water
  osmWater = Math.max(1, Math.min(5, Math.round(osmWater * 10) / 10));

  // ======= POWER/WATER SUPPLY =======
  // Residential areas with hospitals and schools tend to have better infra
  // Commercial areas have good power. Industrial areas may have power cuts.
  let osmPower = 3;
  if (hospitals > 0) osmPower += 0.5; // Areas with hospitals get priority power
  if (schools > 0) osmPower += 0.5;
  if (shops > 10 || markets > 0) osmPower += 0.5; // Commercial areas get reliable power
  if (industrial > 1) osmPower -= 0.5; // Industrial zones have load issues
  osmPower = Math.max(1, Math.min(5, Math.round(osmPower * 10) / 10));

  // ======= SAFETY =======
  // Police stations improve safety. Bars/nightclubs reduce perceived safety.
  // Schools and hospitals indicate established, safer neighborhoods.
  let osmSafety = 3;
  if (police > 0) osmSafety += 1;
  if (hospitals > 0) osmSafety += 0.5;
  if (schools > 0) osmSafety += 0.5;
  if (bars >= 3) osmSafety -= 1; // High nightlife density
  if (bars >= 1) osmSafety -= 0.5;
  if (industrial > 0) osmSafety -= 0.5; // Industrial zones are less safe at night
  osmSafety = Math.max(1, Math.min(5, Math.round(osmSafety * 10) / 10));

  // Blend with crowdsourced data if available (40% weight to crowdsourced)
  const blend = (osm: number, cs: number | null) => cs !== null && cs !== undefined 
    ? parseFloat(((osm * 0.6) + (cs * 0.4)).toFixed(1)) 
    : parseFloat(osm.toFixed(1));

  const noiseScore = blend(osmNoise, crowdsourced?.avg_noise);
  const aqiScore = blend(osmAqi, crowdsourced?.avg_air);
  const waterScore = blend(osmWater, crowdsourced?.avg_water);
  const powerScore = blend(osmPower, crowdsourced?.avg_water);
  const safetyScore = blend(osmSafety, crowdsourced?.avg_safety);
  const eventScore = parseFloat(osmEvent.toFixed(1));

  const aggregateScore = parseFloat(((noiseScore + aqiScore + eventScore + waterScore + powerScore + safetyScore) / 6).toFixed(1));

  const csText = crowdsourced ? ` (Blended with ${crowdsourced.rating_count} resident ratings)` : "";

  // ======= DETAILED REASONS =======
  const totalCommercial = shops + restaurants + bars + markets;
  let noiseReason: string;
  if (totalCommercial > 15 && majorRoads > 0) {
    noiseReason = `Very noisy area: ${majorRoads + minorRoads} roads, ${totalCommercial} commercial establishments, and ${railways} rail lines within 800m.` + csText;
  } else if (totalCommercial > 5 || majorRoads > 2) {
    noiseReason = `Moderate-to-high noise: ${majorRoads + minorRoads} roads and ${totalCommercial} shops/restaurants within 800m.` + csText;
  } else if (majorRoads > 0 || railways > 0) {
    noiseReason = `Some traffic noise from ${majorRoads + minorRoads} roads and ${railways} rail lines nearby.` + csText;
  } else {
    noiseReason = `Relatively quiet area with ${totalCommercial} commercial spots and minor road traffic.` + csText;
  }

  let aqiReason: string;
  if (avgAqi !== null) {
    const label = avgAqi <= 25 ? "Excellent" : avgAqi <= 50 ? "Fair" : avgAqi <= 75 ? "Moderate" : avgAqi <= 100 ? "Poor" : "Very Poor";
    aqiReason = `6-month average AQI is ${avgAqi} (European Scale) — rated "${label}".`;
    if (industrial > 0) aqiReason += ` ${industrial} industrial zone(s) nearby further degrade air quality.`;
    if (parks > 0) aqiReason += ` ${parks} park(s) nearby provide some relief.`;
    aqiReason += csText;
  } else {
    aqiReason = industrial > 0 
      ? `${industrial} industrial zone(s) nearby degrade air quality.` + csText
      : parks > 0 ? `${parks} park(s)/green spaces improve local air circulation.` + csText 
      : "Average urban air quality. No nearby industrial zones detected." + csText;
  }

  const eventReason = worship > 0 || eventVenues > 0
    ? `Detected ${worship} religious structure(s) and ${eventVenues} event venue(s) within 800m.` + csText
    : "Low density of event venues or religious structures." + csText;

  let waterReason = `Drainage infrastructure: ${drains} drain(s)/canal(s) detected.`;
  if (waterBodies > 0) waterReason += ` ${waterBodies} water body/bodies nearby increase flood risk.`;
  if (parks > 2) waterReason += " Good green cover helps water absorption.";
  waterReason += csText;

  let powerReason = "Base urban infrastructure.";
  if (hospitals > 0 || schools > 0) powerReason = `${hospitals} hospital(s) and ${schools} school(s) nearby — priority supply zones tend to have better reliability.`;
  if (shops > 10 || markets > 0) powerReason += " Commercial zone ensures reliable power grid.";
  powerReason += csText;

  let safetyReason: string;
  if (police > 0) {
    safetyReason = `${police} police station(s) within 800m.`;
  } else {
    safetyReason = "No police stations detected within 800m.";
  }
  if (bars >= 3) safetyReason += ` High nightlife density (${bars} bars/pubs) may reduce late-night safety.`;
  if (hospitals > 0) safetyReason += ` ${hospitals} hospital(s) nearby.`;
  if (schools > 0) safetyReason += ` ${schools} school(s) indicate an established neighborhood.`;
  safetyReason += csText;

  return {
    aggregateScore,
    dimensions: [
      { name: "Noise Risk", score: noiseScore, reason: noiseReason },
      { name: "Air Quality", score: aqiScore, reason: aqiReason },
      { name: "Event Noise", score: eventScore, reason: eventReason },
      { name: "Waterlogging", score: waterScore, reason: waterReason },
      { name: "Power/Water", score: powerScore, reason: powerReason },
      { name: "Safety", score: safetyScore, reason: safetyReason }
    ]
  };
}
