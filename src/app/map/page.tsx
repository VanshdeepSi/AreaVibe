"use client";

import { useState } from "react";
import MapWrapper from "@/components/MapWrapper";
import Sidebar from "@/components/Sidebar";
import { Locality } from "@/lib/mockData";
import { searchLocation, reverseGeocode, getLivabilityData } from "@/lib/osmApi";

export default function MapPage() {
  const [selectedLocality, setSelectedLocality] = useState<Locality | null>(null);
  const [compareLocality, setCompareLocality] = useState<Locality | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleMapClick = async (lat: number, lon: number) => {
    // Check bounds
    if (lat < 28.2 || lat > 29.0 || lon < 76.8 || lon > 77.6) {
      alert("AreaVibe is currently only available for locations within Delhi NCR.");
      return;
    }
  
    setIsLoading(true);
    try {
      const geo = await reverseGeocode(lat, lon);
      const name = geo?.address?.suburb || geo?.address?.neighbourhood || geo?.address?.city || geo?.display_name || "Unknown Location";
      
      const data = await getLivabilityData(lat, lon);
      
      const newLoc: Locality = {
        id: `loc-${Date.now()}`,
        name,
        coordinates: [lat, lon],
        aggregateScore: data.aggregateScore,
        dimensions: data.dimensions,
        recentNotes: []
      };

      if (isCompareMode) {
        setCompareLocality(newLoc);
      } else {
        setSelectedLocality(newLoc);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchResultSelect = async (lat: number, lon: number, name: string) => {
    setIsLoading(true);
    try {
      const data = await getLivabilityData(lat, lon);
      const newLoc: Locality = {
        id: `loc-${Date.now()}`,
        name,
        coordinates: [lat, lon],
        aggregateScore: data.aggregateScore,
        dimensions: data.dimensions,
        recentNotes: []
      };

      if (isCompareMode) {
        setCompareLocality(newLoc);
      } else {
        setSelectedLocality(newLoc);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-900 text-slate-100">
      <Sidebar 
        selectedLocality={selectedLocality} 
        onSelectLocality={(loc) => {
          setSelectedLocality(loc);
          if (!loc) {
            setIsCompareMode(false);
            setCompareLocality(null);
          }
        }} 
        compareLocality={compareLocality}
        onSelectCompareLocality={setCompareLocality}
        isCompareMode={isCompareMode}
        setIsCompareMode={setIsCompareMode}
        onSearchSelect={handleSearchResultSelect}
        isLoading={isLoading}
      />
      <div className="absolute inset-0 z-0">
        <MapWrapper 
          selectedLocality={selectedLocality}
          onSelectLocality={(loc) => {
             // old static markers can still just trigger select directly
             if (isCompareMode) setCompareLocality(loc);
             else setSelectedLocality(loc);
          }}
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  );
}
