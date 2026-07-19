export type ScoreDimension = {
  name: string;
  score: number; // 1-5
  reason: string;
};

export type Locality = {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  aggregateScore: number;
  dimensions: ScoreDimension[];
  recentNotes: string[];
};

// Data derived from comprehensive Delhi NCR livability research (2024-2025)
export const MOCK_LOCALITIES: Locality[] = [
  {
    id: "loc-saket",
    name: "Saket",
    coordinates: [28.5192, 77.2134],
    aggregateScore: 3.8,
    dimensions: [
      { name: "Noise Risk", score: 3, reason: "Moderate traffic noise from MB Road." },
      { name: "Air Quality", score: 2, reason: "AQI 250 (Poor) - General South Delhi averages." },
      { name: "Event Noise", score: 4, reason: "Few religious structures nearby." },
      { name: "Waterlogging", score: 5, reason: "No major reported flooding." },
      { name: "Power/Water", score: 4, reason: "Reliable power, occasional water issues." },
      { name: "Safety", score: 5, reason: "Gated blocks, active RWAs, high perceived safety." }
    ],
    recentNotes: [
      "Great connectivity but MB road traffic is a nightmare during peak hours.",
      "Safe at night, lots of parks for kids."
    ]
  },
  {
    id: "loc-vasantkunj",
    name: "Vasant Kunj",
    coordinates: [28.5350, 77.1436],
    aggregateScore: 4.2,
    dimensions: [
      { name: "Noise Risk", score: 4, reason: "Away from main highways, airplane noise occasional (near flight path)." },
      { name: "Air Quality", score: 3, reason: "AQI 210 (Poor) - Better than central Delhi due to Ridge proximity." },
      { name: "Event Noise", score: 5, reason: "Very quiet residential sectors." },
      { name: "Waterlogging", score: 4, reason: "Generally good drainage." },
      { name: "Power/Water", score: 2, reason: "High water tanker dependency during summers." },
      { name: "Safety", score: 5, reason: "Premium gated communities, very secure." }
    ],
    recentNotes: [
      "Very quiet and green, but relying on water tankers in summer is a major pain.",
      "Flight path noise is there but you get used to it."
    ]
  },
  {
    id: "loc-lajpatnagar",
    name: "Lajpat Nagar",
    coordinates: [28.5740, 77.2397],
    aggregateScore: 3.0,
    dimensions: [
      { name: "Noise Risk", score: 2, reason: "High traffic noise from Ring Road and central market." },
      { name: "Air Quality", score: 2, reason: "AQI 280 (Poor) - High vehicular emissions." },
      { name: "Event Noise", score: 2, reason: "Dense commercial and residential mix." },
      { name: "Waterlogging", score: 3, reason: "Moderate risk in low-lying pockets and underpasses." },
      { name: "Power/Water", score: 3, reason: "Power cuts reported during peak summer heatwaves." },
      { name: "Safety", score: 4, reason: "Very active area, feels safe but crowded." }
    ],
    recentNotes: [
      "Extremely crowded, parking is a daily battle.",
      "Everything is available downstairs, but don't expect peace and quiet."
    ]
  },
  {
    id: "loc-dwarka",
    name: "Dwarka",
    coordinates: [28.5916, 77.0620],
    aggregateScore: 4.0,
    dimensions: [
      { name: "Noise Risk", score: 4, reason: "Well-planned sectors, noise is mostly limited to arterial roads." },
      { name: "Air Quality", score: 3, reason: "Moderate to Poor depending on wind from surrounding areas." },
      { name: "Event Noise", score: 5, reason: "Regulated society layouts." },
      { name: "Waterlogging", score: 4, reason: "Good planned drainage, fewer issues than older Delhi." },
      { name: "Power/Water", score: 3, reason: "Occasional water salinity/supply issues." },
      { name: "Safety", score: 5, reason: "CGHS societies with single-entry security." }
    ],
    recentNotes: [
      "Spacious and well-planned, but relies a lot on RO water.",
      "Very safe inside the societies."
    ]
  },
  {
    id: "loc-rohini",
    name: "Rohini",
    coordinates: [28.7061, 77.1147],
    aggregateScore: 3.3,
    dimensions: [
      { name: "Noise Risk", score: 3, reason: "Varies by sector; outer sectors are quieter." },
      { name: "Air Quality", score: 2, reason: "Often records high PM2.5 levels in North-West Delhi." },
      { name: "Event Noise", score: 3, reason: "Mixed use areas can be noisy." },
      { name: "Waterlogging", score: 3, reason: "Some sectors face severe waterlogging during heavy monsoons." },
      { name: "Power/Water", score: 3, reason: "Summer power disruptions noted in recent years." },
      { name: "Safety", score: 4, reason: "Generally safe, but varies by specific sector." }
    ],
    recentNotes: [
      "Good metro connectivity, but traffic is increasing.",
      "Air quality gets really bad in winters here."
    ]
  },
  {
    id: "loc-janakpuri",
    name: "Janakpuri",
    coordinates: [28.6256, 77.0822],
    aggregateScore: 3.5,
    dimensions: [
      { name: "Noise Risk", score: 3, reason: "Proximity to Najafgarh Road brings traffic noise." },
      { name: "Air Quality", score: 3, reason: "Average for West Delhi." },
      { name: "Event Noise", score: 4, reason: "Mainly residential blocks." },
      { name: "Waterlogging", score: 3, reason: "Known hotspots nearby." },
      { name: "Power/Water", score: 2, reason: "Faced significant water shortage and power cuts in 2024." },
      { name: "Safety", score: 4, reason: "Well-established neighborhood." }
    ],
    recentNotes: [
      "Lots of greenery, but water supply was a huge issue this summer."
    ]
  },
  {
    id: "loc-karolbagh",
    name: "Karol Bagh",
    coordinates: [28.6480, 77.1901],
    aggregateScore: 2.7,
    dimensions: [
      { name: "Noise Risk", score: 1, reason: "Severe noise from commercial activity and elevated Metro corridor." },
      { name: "Air Quality", score: 2, reason: "Dense vehicular traffic contributes to high AQI." },
      { name: "Event Noise", score: 2, reason: "Highly commercialized." },
      { name: "Waterlogging", score: 2, reason: "Old drainage system struggles during monsoon." },
      { name: "Power/Water", score: 4, reason: "Generally stable." },
      { name: "Safety", score: 3, reason: "Crowded; petty theft can be a concern in markets." }
    ],
    recentNotes: [
      "Unbeatable for shopping and food, but terrible for peace of mind."
    ]
  },
  {
    id: "loc-jahangirpuri",
    name: "Jahangirpuri",
    coordinates: [28.7302, 77.1641],
    aggregateScore: 2.0,
    dimensions: [
      { name: "Noise Risk", score: 2, reason: "Industrial and highway proximity." },
      { name: "Air Quality", score: 1, reason: "Consistently ranked as one of the most polluted stations in Delhi." },
      { name: "Event Noise", score: 3, reason: "Dense settlement." },
      { name: "Waterlogging", score: 2, reason: "Poor drainage infrastructure." },
      { name: "Power/Water", score: 2, reason: "Irregular supply in many blocks." },
      { name: "Safety", score: 2, reason: "Safety concerns frequently reported." }
    ],
    recentNotes: [
      "The air pollution here is unbearable in winters."
    ]
  },
  {
    id: "loc-anandvihar",
    name: "Anand Vihar",
    coordinates: [28.6473, 77.3160],
    aggregateScore: 2.5,
    dimensions: [
      { name: "Noise Risk", score: 1, reason: "Massive transport hub (ISBT, Railway, Metro)." },
      { name: "Air Quality", score: 1, reason: "A notorious pollution hotspot due to bus terminal and border traffic." },
      { name: "Event Noise", score: 3, reason: "Constant background hum of transport." },
      { name: "Waterlogging", score: 3, reason: "Moderate issues." },
      { name: "Power/Water", score: 4, reason: "Reliable." },
      { name: "Safety", score: 3, reason: "Busy transit area; requires caution at night." }
    ],
    recentNotes: [
      "Very well connected, but you have to keep your windows shut due to dust and noise."
    ]
  },
  {
    id: "loc-okhla",
    name: "Okhla",
    coordinates: [28.5413, 77.2798],
    aggregateScore: 2.8,
    dimensions: [
      { name: "Noise Risk", score: 2, reason: "Industrial area traffic and railway line nearby." },
      { name: "Air Quality", score: 2, reason: "Industrial emissions affect local AQI." },
      { name: "Event Noise", score: 3, reason: "Mixed residential/industrial." },
      { name: "Waterlogging", score: 2, reason: "Underpasses (like Okhla underpass) are major flooding hotspots." },
      { name: "Power/Water", score: 2, reason: "Severe water crisis reported in summer 2024." },
      { name: "Safety", score: 3, reason: "Industrial sectors quiet down at night, varying by block." }
    ],
    recentNotes: [
      "Water tankers are the only way to survive summer here."
    ]
  },
  {
    id: "loc-noida-sec50",
    name: "Noida Sector 50",
    coordinates: [28.5743, 77.3614],
    aggregateScore: 4.5,
    dimensions: [
      { name: "Noise Risk", score: 4, reason: "Quiet, established residential layout." },
      { name: "Air Quality", score: 3, reason: "Better than Delhi average, but still impacted by NCR smog." },
      { name: "Event Noise", score: 5, reason: "Peaceful environment." },
      { name: "Waterlogging", score: 5, reason: "Excellent planned drainage." },
      { name: "Power/Water", score: 4, reason: "Very stable." },
      { name: "Safety", score: 5, reason: "Premium sector, active security." }
    ],
    recentNotes: [
      "One of the best places for families in Noida. Lots of parks."
    ]
  },
  {
    id: "loc-gurgaon-gcr",
    name: "Gurgaon - Golf Course Road",
    coordinates: [28.4398, 77.1009],
    aggregateScore: 4.3,
    dimensions: [
      { name: "Noise Risk", score: 3, reason: "High traffic on the main road, but apartments are insulated." },
      { name: "Air Quality", score: 3, reason: "Dust from construction and traffic." },
      { name: "Event Noise", score: 5, reason: "Corporate/Luxury residential vibe." },
      { name: "Waterlogging", score: 3, reason: "Some nearby underpasses flood, but main road is better now." },
      { name: "Power/Water", score: 4, reason: "Societies have 100% power backup." },
      { name: "Safety", score: 5, reason: "Extremely secure luxury condominiums." }
    ],
    recentNotes: [
      "Ultimate luxury, but stepping out during peak traffic is stressful."
    ]
  },
  {
    id: "loc-gnida-west",
    name: "Greater Noida West (Noida Ext.)",
    coordinates: [28.5997, 77.4334],
    aggregateScore: 3.7,
    dimensions: [
      { name: "Noise Risk", score: 4, reason: "Spread out, wide roads, less congested." },
      { name: "Air Quality", score: 3, reason: "Construction dust is a major ongoing issue." },
      { name: "Event Noise", score: 4, reason: "Newer societies, relatively quiet." },
      { name: "Waterlogging", score: 4, reason: "New infrastructure handles rain reasonably well." },
      { name: "Power/Water", score: 3, reason: "Some societies face erratic supply." },
      { name: "Safety", score: 4, reason: "Safe inside societies, but peripheral roads can be isolated at night." }
    ],
    recentNotes: [
      "Affordable and spacious, but the construction dust is everywhere."
    ]
  }
];
