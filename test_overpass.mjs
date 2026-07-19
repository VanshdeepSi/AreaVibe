const lat = 28.6315;
const lon = 77.2167;
const radius = 800;

const query = [
  `[out:json][timeout:25];`,
  `(`,
  `way["highway"~"motorway|trunk|primary|secondary|tertiary"](around:${radius},${lat},${lon});`,
  `node["shop"](around:${radius},${lat},${lon});`,
  `node["amenity"~"restaurant|cafe|fast_food|bar|pub|nightclub"](around:${radius},${lat},${lon});`,
  `node["amenity"="place_of_worship"](around:${radius},${lat},${lon});`,
  `);`,
  `out center;`
].join("\n");

// Test with GET request
console.log("=== TEST: GET with User-Agent ===");
const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
try {
  const res = await fetch(url, {
    headers: { "User-Agent": "AreaVibe-MVP/1.0" }
  });
  console.log("Status:", res.status, res.statusText);
  if (res.ok) {
    const data = await res.json();
    console.log("Elements:", data.elements?.length);
    let shops = 0, roads = 0, worship = 0, restaurants = 0;
    data.elements?.forEach(el => {
      if (el.tags?.highway) roads++;
      if (el.tags?.shop) shops++;
      if (el.tags?.amenity === "restaurant" || el.tags?.amenity === "cafe" || el.tags?.amenity === "fast_food") restaurants++;
      if (el.tags?.amenity === "place_of_worship") worship++;
    });
    console.log("Roads:", roads, "Shops:", shops, "Restaurants:", restaurants, "Worship:", worship);
  } else {
    console.log("Error:", (await res.text()).substring(0, 300));
  }
} catch(e) {
  console.error("Error:", e.message);
}

// Also test alternate endpoint
console.log("\n=== TEST: Alternate endpoint (lz4) ===");
const url2 = `https://lz4.overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
try {
  const res2 = await fetch(url2, {
    headers: { "User-Agent": "AreaVibe-MVP/1.0" }
  });
  console.log("Status:", res2.status, res2.statusText);
  if (res2.ok) {
    const data = await res2.json();
    console.log("Elements:", data.elements?.length);
    let shops = 0, roads = 0, worship = 0, restaurants = 0;
    data.elements?.forEach(el => {
      if (el.tags?.highway) roads++;
      if (el.tags?.shop) shops++;
      if (el.tags?.amenity === "restaurant" || el.tags?.amenity === "cafe" || el.tags?.amenity === "fast_food") restaurants++;
      if (el.tags?.amenity === "place_of_worship") worship++;
    });
    console.log("Roads:", roads, "Shops:", shops, "Restaurants:", restaurants, "Worship:", worship);
  } else {
    console.log("Error:", (await res2.text()).substring(0, 300));
  }
} catch(e) {
  console.error("Error:", e.message);
}

// Test POST with User-Agent
console.log("\n=== TEST: POST with User-Agent ===");
try {
  const res3 = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "AreaVibe-MVP/1.0",
      "Accept": "*/*"
    },
    body: `data=${encodeURIComponent(query)}`
  });
  console.log("Status:", res3.status, res3.statusText);
  if (res3.ok) {
    const data = await res3.json();
    console.log("Elements:", data.elements?.length);
  } else {
    console.log("Error:", (await res3.text()).substring(0, 300));
  }
} catch(e) {
  console.error("Error:", e.message);
}
