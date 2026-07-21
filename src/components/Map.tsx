"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polygon } from "react-leaflet";
import L from "leaflet";
import { Locality } from "../lib/mockData";

// Fix for default marker icons in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

interface MapProps {
  selectedLocality: Locality | null;
  onSelectLocality: (loc: Locality) => void;
  onMapClick?: (lat: number, lon: number) => void;
}

export default function Map({ selectedLocality, onSelectLocality, onMapClick }: MapProps) {
  // Delhi NCR center
  const defaultCenter: [number, number] = [28.5600, 77.2000];
  
  // Delhi NCR approximate bounding box
  const maxBounds: L.LatLngBoundsExpression = [
    [28.2, 76.8], // Southwest
    [29.0, 77.6]  // Northeast
  ];

  // Inverted polygon to dim the rest of the world
  const worldBounds: [number, number][] = [
    [-90, -180],
    [90, -180],
    [90, 180],
    [-90, 180],
  ];
  
  const delhiHole: [number, number][] = [
    [28.2, 76.8],
    [29.0, 76.8],
    [29.0, 77.6],
    [28.2, 77.6],
  ];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        minZoom={3}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <Polygon
          positions={[worldBounds, delhiHole]}
          pathOptions={{ color: "transparent", fillColor: "#0f172a", fillOpacity: 0.85, interactive: false }}
        />
        
        <MapClickHandler onMapClick={onMapClick} />

        {selectedLocality && (
          <>
            <MapController center={selectedLocality.coordinates} />
            <Marker 
              position={selectedLocality.coordinates}
              icon={customIcon}
            >
              <Popup>
                <div className="font-sans text-slate-900 font-medium">
                  {selectedLocality.name} - Score: {selectedLocality.aggregateScore}
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}
