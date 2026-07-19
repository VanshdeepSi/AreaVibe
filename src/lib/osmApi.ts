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
  const q = query.toLowerCase().includes("delhi") || query.toLowerCase().includes("noida") || query.toLowerCase().includes("gurugram") || query.toLowerCase().includes("gurgaon")
    ? query 
    : `${query}, Delhi`;
    
  const viewbox = "76.83,28.87,77.34,28.41";
  
  try {
    const res = await fetch(`${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(q)}&viewbox=${viewbox}&limit=5`, {
      headers: { "User-Agent": "AreaVibe-MVP" }
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
    headers: { "User-Agent": "AreaVibe-MVP" }
  });
  if (!res.ok) return null;
  return res.json();
}

async function getHistoricalAQI(lat: number, lon: number) {
  try {
    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=european_aqi&past_days=180`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.hourly?.european_aqi) return null;
    
    const validReadings = data.hourly.european_aqi.filter((val: number | null) => val !== null);
    if (validReadings.length === 0) return null;
    
    const sum = validReadings.reduce((acc: number, curr: number) => acc + curr, 0);
    return Math.round(sum / validReadings.length);
  } catch (e) {
    console.error("AQI fetch failed:", e);
    return null;
  }
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceWeight(distanceM: number): number {
  if (distanceM < 50) return 1.0;
  if (distanceM < 100) return 0.85;
  if (distanceM < 200) return 0.6;
  if (distanceM < 400) return 0.3;
  if (distanceM < 600) return 0.12;
  return 0.05;
}

function importanceMultiplier(tags: any): number {
  let mult = 1.0;
  if (tags.wikidata || tags.wikipedia) mult *= 3.0;
  if (tags.tourism) mult *= 2.0;
  if (tags.brand) mult *= 1.5;
  return mult;
}

function getElementCoords(el: any): [number, number] | null {
  if (el.lat !== undefined && el.lon !== undefined) return [el.lat, el.lon];
  if (el.center?.lat !== undefined && el.center?.lon !== undefined) return [el.center.lat, el.center.lon];
  return null;
}

export async function getLivabilityData(lat: number, lon: number) {
  const radius = 800;

  const query = [
    `[out:json][timeout:25];`,
    `(`,
    `way["highway"~"motorway|trunk|primary|secondary|tertiary"](around:${radius},${lat},${lon});`,
    `way["railway"~"rail|subway|light_rail"](around:${radius},${lat},${lon});`,
    `node["shop"](around:${radius},${lat},${lon});`,
    `node["amenity"~"restaurant|cafe|fast_food|bar|pub|nightclub|marketplace|fuel"](around:${radius},${lat},${lon});`,
    `way["landuse"~"commercial|retail"](around:${radius},${lat},${lon});`,
    `node["amenity"="place_of_worship"](around:${radius},${lat},${lon});`,
    `way["amenity"="place_of_worship"](around:${radius},${lat},${lon});`,
    `node["amenity"~"community_centre|events_venue"](around:${radius},${lat},${lon});`,
    `way["leisure"~"park|garden"](around:${radius},${lat},${lon});`,
    `node["leisure"~"park|garden"](around:${radius},${lat},${lon});`,
    `way["landuse"~"industrial|construction"](around:${radius},${lat},${lon});`,
    `node["amenity"~"police|hospital|clinic"](around:${radius},${lat},${lon});`,
    `node["amenity"~"school|college|university"](around:${radius},${lat},${lon});`,
    `way["waterway"~"drain|stream|canal"](around:${radius},${lat},${lon});`,
    `way["natural"="water"](around:${radius},${lat},${lon});`,
    `);`,
    `out center;`
  ].join("\n");

  try {
    const [overpassRes, dbRes, avgAqi] = await Promise.all([
      fetch(OVERPASS_BASE, {
        method: "POST",
        body: query
      }),
      supabase.rpc('get_location_averages', { p_lat: lat, p_lon: lon }),
      getHistoricalAQI(lat, lon)
    ]);

    if (!overpassRes.ok) throw new Error("Overpass API failed: " + overpassRes.status);
    const data = await overpassRes.json();

    const crowdsourced = dbRes.data && dbRes.data[0] && dbRes.data[0].rating_count > 0 ? dbRes.data[0] : null;
    return computeScores(data, lat, lon, crowdsourced, avgAqi);
  } catch (error) {
    console.error("getLivabilityData error:", error);
    const { data: dbData } = await supabase.rpc('get_location_averages', { p_lat: lat, p_lon: lon });
    const crowdsourced = dbData && dbData[0] && dbData[0].rating_count > 0 ? dbData[0] : null;
    const avgAqi = await getHistoricalAQI(lat, lon);
    return computeScores({ elements: [] }, lat, lon, crowdsourced, avgAqi);
  }
}

function computeScores(overpassData: any, lat: number, lon: number, crowdsourced: any, avgAqi: number | null) {
  const elements = overpassData.elements || [];

  const roads: any[] = [];
  const railways: any[] = [];
  const shops: any[] = [];
  const eateries: any[] = [];
  const nightlife: any[] = [];
  const marketCommercial: any[] = [];
  const worship: any[] = [];
  const eventVenues: any[] = [];
  const parks: any[] = [];
  const industrial: any[] = [];
  const construction: any[] = [];
  const police: any[] = [];
  const hospitals: any[] = [];
  const schools: any[] = [];
  const drains: any[] = [];
  const waterBodies: any[] = [];

  elements.forEach((el: any) => {
    if (!el.tags) return;
    const t = el.tags;
    if (t.highway === "motorway" || t.highway === "trunk" || t.highway === "primary" || t.highway === "secondary" || t.highway === "tertiary") roads.push(el);
    if (t.railway) railways.push(el);
    if (t.shop) shops.push(el);
    if (t.amenity === "restaurant" || t.amenity === "cafe" || t.amenity === "fast_food") eateries.push(el);
    if (t.amenity === "bar" || t.amenity === "pub" || t.amenity === "nightclub") nightlife.push(el);
    if (t.amenity === "marketplace" || t.amenity === "fuel" || t.landuse === "commercial" || t.landuse === "retail") marketCommercial.push(el);
    if (t.amenity === "place_of_worship") worship.push(el);
    if (t.amenity === "community_centre" || t.amenity === "events_venue") eventVenues.push(el);
    if (t.leisure === "park" || t.leisure === "garden") parks.push(el);
    if (t.landuse === "industrial") industrial.push(el);
    if (t.landuse === "construction") construction.push(el);
    if (t.amenity === "police") police.push(el);
    if (t.amenity === "hospital" || t.amenity === "clinic") hospitals.push(el);
    if (t.amenity === "school" || t.amenity === "college" || t.amenity === "university") schools.push(el);
    if (t.waterway) drains.push(el);
    if (t.natural === "water") waterBodies.push(el);
  });

  // ======== NOISE RISK (distance + importance weighted) ========
  let totalNoiseImpact = 0;
  const allNoiseSources = [
    ...roads.map(el => ({ el, baseNoise: el.tags.highway === "motorway" || el.tags.highway === "trunk" ? 1.5 : el.tags.highway === "primary" ? 1.0 : 0.6 })),
    ...railways.map(el => ({ el, baseNoise: 1.8 })),
    ...shops.map(el => ({ el, baseNoise: 0.15 })),
    ...eateries.map(el => ({ el, baseNoise: 0.2 })),
    ...nightlife.map(el => ({ el, baseNoise: 0.5 })),
    ...marketCommercial.map(el => ({ el, baseNoise: 0.6 })),
  ];

  allNoiseSources.forEach(({ el, baseNoise }) => {
    const coords = getElementCoords(el);
    if (!coords) return;
    const dist = getDistanceMeters(lat, lon, coords[0], coords[1]);
    const dw = distanceWeight(dist);
    const im = importanceMultiplier(el.tags || {});
    totalNoiseImpact += baseNoise * dw * im;
  });

  const osmNoise = Math.max(1, Math.min(5, Math.round((5 - totalNoiseImpact * 0.5) * 10) / 10));

  // ======== AIR QUALITY (real AQI data) ========
  let osmAqi: number;
  if (avgAqi !== null) {
    if (avgAqi <= 25) osmAqi = 5;
    else if (avgAqi <= 50) osmAqi = 4;
    else if (avgAqi <= 75) osmAqi = 3;
    else if (avgAqi <= 100) osmAqi = 2;
    else osmAqi = 1;
  } else {
    osmAqi = Math.min(5, Math.max(1, 3 + (parks.length > 0 ? 1 : 0) - (industrial.length > 0 ? 2 : 0)));
  }
  if (industrial.length > 0) osmAqi = Math.max(1, osmAqi - 1);
  if (construction.length > 0) osmAqi = Math.max(1, osmAqi - 0.5);
  osmAqi = Math.round(osmAqi * 10) / 10;

  // ======== EVENT NOISE (distance + importance weighted) ========
  let totalEventImpact = 0;
  const allEventSources = [
    ...worship.map(el => ({ el, baseEvent: 1.0 })),
    ...eventVenues.map(el => ({ el, baseEvent: 1.5 })),
  ];

  allEventSources.forEach(({ el, baseEvent }) => {
    const coords = getElementCoords(el);
    if (!coords) return;
    const dist = getDistanceMeters(lat, lon, coords[0], coords[1]);
    const dw = distanceWeight(dist);
    const im = importanceMultiplier(el.tags || {});
    totalEventImpact += baseEvent * dw * im;
  });

  const osmEvent = Math.max(1, Math.min(5, Math.round((5 - totalEventImpact) * 10) / 10));

  // ======== WATERLOGGING ========
  let osmWater = 3;
  if (drains.length >= 3) osmWater += 1.5;
  else if (drains.length >= 1) osmWater += 0.5;
  if (waterBodies.length > 0) osmWater -= 1;
  if (parks.length > 2) osmWater += 0.5;
  osmWater = Math.max(1, Math.min(5, Math.round(osmWater * 10) / 10));

  // ======== POWER/WATER ========
  let osmPower = 3;
  if (hospitals.length > 0) osmPower += 0.5;
  if (schools.length > 0) osmPower += 0.5;
  if (shops.length > 10 || marketCommercial.length > 0) osmPower += 0.5;
  if (industrial.length > 1) osmPower -= 0.5;
  osmPower = Math.max(1, Math.min(5, Math.round(osmPower * 10) / 10));

  // ======== SAFETY (distance weighted) ========
  let osmSafety = 3;
  police.forEach((el: any) => {
    const coords = getElementCoords(el);
    if (!coords) return;
    const dist = getDistanceMeters(lat, lon, coords[0], coords[1]);
    if (dist < 200) osmSafety += 1.0;
    else if (dist < 500) osmSafety += 0.5;
    else osmSafety += 0.2;
  });
  if (hospitals.length > 0) osmSafety += 0.5;
  if (schools.length > 0) osmSafety += 0.3;
  if (nightlife.length >= 5) osmSafety -= 1.5;
  else if (nightlife.length >= 3) osmSafety -= 1;
  else if (nightlife.length >= 1) osmSafety -= 0.5;
  if (industrial.length > 0) osmSafety -= 0.5;
  osmSafety = Math.max(1, Math.min(5, Math.round(osmSafety * 10) / 10));

  // Blend with crowdsourced
  const blend = (osm: number, cs: number | null | undefined) =>
    cs !== null && cs !== undefined ? parseFloat(((osm * 0.6) + (cs * 0.4)).toFixed(1)) : parseFloat(osm.toFixed(1));

  const noiseScore = blend(osmNoise, crowdsourced?.avg_noise);
  const aqiScore = blend(osmAqi, crowdsourced?.avg_air);
  const waterScore = blend(osmWater, crowdsourced?.avg_water);
  const powerScore = blend(osmPower, crowdsourced?.avg_water);
  const safetyScore = blend(osmSafety, crowdsourced?.avg_safety);
  const eventScore = parseFloat(osmEvent.toFixed(1));

  const aggregateScore = parseFloat(((noiseScore + aqiScore + eventScore + waterScore + powerScore + safetyScore) / 6).toFixed(1));
  const csText = crowdsourced ? ` (Blended with ${crowdsourced.rating_count} resident ratings)` : "";

  // ======== DETAILED REASONS ========
  const totalCommercial = shops.length + eateries.length + nightlife.length + marketCommercial.length;
  let noiseReason: string;
  if (totalCommercial > 20 && roads.length > 2) {
    noiseReason = `Very noisy: ${roads.length} roads, ${railways.length} rail lines, ${totalCommercial} commercial spots (${shops.length} shops, ${eateries.length} eateries, ${nightlife.length} bars) within 800m.` + csText;
  } else if (totalCommercial > 5 || roads.length > 3) {
    noiseReason = `Moderate-to-high noise: ${roads.length} roads and ${totalCommercial} commercial establishments within 800m.` + csText;
  } else if (roads.length > 0 || railways.length > 0) {
    noiseReason = `Some traffic noise from ${roads.length} roads and ${railways.length} rail lines nearby.` + csText;
  } else if (totalCommercial > 0) {
    noiseReason = `Light commercial noise from ${totalCommercial} nearby establishments.` + csText;
  } else {
    noiseReason = "Quiet residential area with minimal commercial activity." + csText;
  }

  let aqiReason: string;
  if (avgAqi !== null) {
    const label = avgAqi <= 25 ? "Excellent" : avgAqi <= 50 ? "Fair" : avgAqi <= 75 ? "Moderate" : avgAqi <= 100 ? "Poor" : "Very Poor";
    aqiReason = `6-month avg AQI is ${avgAqi} (European Scale) — "${label}".`;
    if (industrial.length > 0) aqiReason += ` ${industrial.length} industrial zone(s) nearby.`;
    if (parks.length > 0) aqiReason += ` ${parks.length} park(s) provide some relief.`;
    aqiReason += csText;
  } else {
    aqiReason = industrial.length > 0
      ? `${industrial.length} industrial zone(s) degrade air quality.` + csText
      : parks.length > 0 ? `${parks.length} park(s) improve air circulation.` + csText
      : "Average urban air quality." + csText;
  }

  let eventReason: string;
  if (worship.length > 0 || eventVenues.length > 0) {
    const famousOnes = worship.filter((el: any) => el.tags?.wikidata || el.tags?.wikipedia || el.tags?.tourism);
    eventReason = `${worship.length} religious structure(s) and ${eventVenues.length} event venue(s) within 800m.`;
    if (famousOnes.length > 0) eventReason += ` ${famousOnes.length} are major landmarks (higher visitor footfall).`;
    eventReason += csText;
  } else {
    eventReason = "Low density of event venues or religious structures." + csText;
  }

  let waterReason = `${drains.length} drain(s)/canal(s) detected for drainage.`;
  if (waterBodies.length > 0) waterReason += ` ${waterBodies.length} water body/bodies nearby (flood risk).`;
  if (parks.length > 2) waterReason += " Good green cover aids water absorption.";
  waterReason += csText;

  let powerReason = "Base urban infrastructure.";
  if (hospitals.length > 0 || schools.length > 0) powerReason = `${hospitals.length} hospital(s) and ${schools.length} school(s) nearby — priority supply zones.`;
  if (shops.length > 10 || marketCommercial.length > 0) powerReason += " Commercial zone ensures reliable power grid.";
  powerReason += csText;

  let safetyReason: string;
  if (police.length > 0) {
    const closestPolice = Math.min(...police.map((el: any) => { const c = getElementCoords(el); return c ? getDistanceMeters(lat, lon, c[0], c[1]) : 9999; }));
    safetyReason = `${police.length} police station(s) — nearest is ${Math.round(closestPolice)}m away.`;
  } else {
    safetyReason = "No police stations detected within 800m.";
  }
  if (nightlife.length >= 3) safetyReason += ` High nightlife density (${nightlife.length} bars/pubs).`;
  if (hospitals.length > 0) safetyReason += ` ${hospitals.length} hospital(s) nearby.`;
  if (schools.length > 0) safetyReason += ` ${schools.length} school(s) nearby.`;
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
