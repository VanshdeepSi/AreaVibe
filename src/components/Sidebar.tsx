"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Activity, Droplets, Zap, Shield, X, ChevronRight, ArrowRightLeft, Loader2 } from "lucide-react";
import { Locality, ScoreDimension } from "../lib/mockData";
import { searchLocation } from "@/lib/osmApi";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface SidebarProps {
  selectedLocality: Locality | null;
  onSelectLocality: (loc: Locality | null) => void;
  compareLocality: Locality | null;
  onSelectCompareLocality: (loc: Locality | null) => void;
  isCompareMode: boolean;
  setIsCompareMode: (val: boolean) => void;
  onSearchSelect: (lat: number, lon: number, name: string) => void;
  isLoading?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 4) return "text-green-400 bg-green-400/10 border-green-400/20";
  if (score >= 3) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  return "text-red-400 bg-red-400/10 border-red-400/20";
};

const getDimensionIcon = (name: string) => {
  if (name.includes("Noise")) return <Activity className="w-4 h-4" />;
  if (name.includes("Air")) return <Zap className="w-4 h-4" />;
  if (name.includes("Water")) return <Droplets className="w-4 h-4" />;
  if (name.includes("Power")) return <Zap className="w-4 h-4" />;
  if (name.includes("Safety")) return <Shield className="w-4 h-4" />;
  return <MapPin className="w-4 h-4" />;
};

export default function Sidebar({ 
  selectedLocality, 
  onSelectLocality, 
  compareLocality, 
  onSelectCompareLocality,
  isCompareMode,
  setIsCompareMode,
  onSearchSelect,
  isLoading
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [ratingNoise, setRatingNoise] = useState(3);
  const [ratingAir, setRatingAir] = useState(3);
  const [ratingWater, setRatingWater] = useState(3);
  const [ratingSafety, setRatingSafety] = useState(3);
  const [ratingNote, setRatingNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        const results = await searchLocation(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <>
      <div className="absolute top-4 left-4 z-10 w-96 flex flex-col gap-4 max-h-[calc(100vh-2rem)] pointer-events-none">
        
        {/* Brand Header */}
        <div className="glass rounded-2xl p-4 pointer-events-auto flex items-center justify-between">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand" />
                    AreaVibe
                </h1>
                <p className="text-xs text-slate-400 mt-1">Dynamic Livability Score Layer</p>
            </div>
        </div>

        {/* Search Bar */}
        <div className="glass rounded-2xl p-3 pointer-events-auto flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder={isCompareMode ? "Search any street to compare..." : "Search any street or locality..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-slate-100 w-full placeholder-slate-500"
          />
          {isSearching && <Loader2 className="w-4 h-4 text-brand animate-spin" />}
          {searchQuery && !isSearching && (
            <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="glass rounded-2xl p-2 pointer-events-auto flex flex-col gap-1 overflow-y-auto max-h-60">
            {searchResults.map(res => (
              <button 
                key={res.place_id}
                onClick={() => {
                  const lat = parseFloat(res.lat);
                  const lon = parseFloat(res.lon);
                  
                  // Check bounds
                  if (lat < 28.2 || lat > 29.0 || lon < 76.8 || lon > 77.6) {
                    alert("AreaVibe is currently only available for locations within Delhi NCR.");
                    setSearchQuery("");
                    setSearchResults([]);
                    return;
                  }

                  onSearchSelect(lat, lon, res.display_name.split(",")[0]);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div>
                  <div className="text-slate-200 font-medium text-sm">{res.display_name.split(",")[0]}</div>
                  <div className="text-slate-500 text-xs truncate max-w-[250px]">{res.display_name}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Loading Overlay for Detail Card */}
        {isLoading && !selectedLocality && (
          <div className="glass rounded-3xl p-8 pointer-events-auto flex flex-col items-center justify-center text-center">
             <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
             <p className="text-slate-300 font-medium">Computing livability score...</p>
             <p className="text-slate-500 text-xs mt-2">Querying OSM Overpass API in real-time</p>
          </div>
        )}

        {/* Detail Card / Compare Card */}
        {selectedLocality && (
          <div className="glass rounded-3xl p-5 pointer-events-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar relative">
            {isLoading && (
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
              </div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white mb-1 leading-tight">
                  {isCompareMode && compareLocality ? `${selectedLocality.name} vs ${compareLocality.name}` : selectedLocality.name}
                </h2>
                {!isCompareMode && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`px-2 py-1 rounded-md border text-sm font-bold flex items-center gap-1 ${getScoreColor(selectedLocality.aggregateScore)}`}>
                      <Activity className="w-3 h-3" />
                      {selectedLocality.aggregateScore.toFixed(1)}
                    </div>
                    <span className="text-slate-400 text-sm">Overall Livability</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => {
                  if (isCompareMode) {
                    setIsCompareMode(false);
                    onSelectCompareLocality(null);
                  } else {
                    onSelectLocality(null);
                  }
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors bg-white/5 text-slate-400 shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isCompareMode && (
              <button
                onClick={() => setIsCompareMode(true)}
                className="w-full mb-6 py-2 px-4 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Compare with another area
              </button>
            )}

            {isCompareMode && !compareLocality && (
              <div className="mb-6 p-4 rounded-xl bg-brand/10 border border-brand/20 text-brand-100 text-sm flex flex-col items-center justify-center text-center">
                <ArrowRightLeft className="w-6 h-6 mb-2 text-brand" />
                Click anywhere on the map or search to compare.
              </div>
            )}

            <div className="space-y-4 mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Data Breakdown
              </h3>
              
              {selectedLocality.dimensions.map((dim: ScoreDimension, idx: number) => {
                const compareDim = compareLocality?.dimensions.find(d => d.name === dim.name);
                
                return (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-slate-200 font-medium text-sm">
                        {getDimensionIcon(dim.name)}
                        {dim.name}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`text-xs font-bold px-2 py-1 rounded-md border ${getScoreColor(dim.score)}`}>
                          {dim.score}/5
                        </div>
                        {isCompareMode && compareDim && (
                          <div className={`text-xs font-bold px-2 py-1 rounded-md border ${getScoreColor(compareDim.score)}`}>
                            {compareDim.score}/5
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isCompareMode && (
                      <p className="text-xs text-slate-400 leading-relaxed">{dim.reason}</p>
                    )}
                    
                    {isCompareMode && compareDim && compareLocality && (
                      <div className="text-xs text-slate-400 space-y-2 mt-3">
                        <p className="p-2 bg-black/20 rounded-lg"><span className="text-slate-300 font-bold block mb-1">{selectedLocality.name}</span> {dim.reason}</p>
                        <p className="p-2 bg-black/20 rounded-lg"><span className="text-slate-300 font-bold block mb-1">{compareLocality.name}</span> {compareDim.reason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!isCompareMode && (
              <div className="mt-4 pb-2 shrink-0">
                <button 
                  onClick={() => {
                    if (!user) {
                      router.push('/profile');
                    } else {
                      setShowRatingModal(true);
                    }
                  }}
                  className="w-full py-3 px-4 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  {user ? "Refine with Resident Rating" : "Log in to Rate Locality"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rating Modal Mockup */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Rate {selectedLocality?.name}</h2>
              <button onClick={() => setShowRatingModal(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-200">Noise Level</span><span className="text-brand font-medium">{ratingNoise}/5</span></div>
                <input type="range" min="1" max="5" value={ratingNoise} onChange={(e) => setRatingNoise(parseInt(e.target.value))} className="w-full accent-brand" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-200">Air Quality</span><span className="text-brand font-medium">{ratingAir}/5</span></div>
                <input type="range" min="1" max="5" value={ratingAir} onChange={(e) => setRatingAir(parseInt(e.target.value))} className="w-full accent-brand" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-200">Water & Power</span><span className="text-brand font-medium">{ratingWater}/5</span></div>
                <input type="range" min="1" max="5" value={ratingWater} onChange={(e) => setRatingWater(parseInt(e.target.value))} className="w-full accent-brand" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-200">Safety</span><span className="text-brand font-medium">{ratingSafety}/5</span></div>
                <input type="range" min="1" max="5" value={ratingSafety} onChange={(e) => setRatingSafety(parseInt(e.target.value))} className="w-full accent-brand" />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm text-slate-200">Optional Note</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-brand transition-colors custom-scrollbar"
                  placeholder="What's it like living here?"
                  rows={3}
                  value={ratingNote}
                  onChange={(e) => setRatingNote(e.target.value)}
                ></textarea>
              </div>
            </div>

            <button 
              onClick={async () => {
                if (!user || !selectedLocality) return;
                setIsSubmitting(true);
                const { error } = await supabase.from('ratings').insert({
                  user_id: user.id,
                  location_name: selectedLocality.name,
                  lat: selectedLocality.coordinates[0],
                  lon: selectedLocality.coordinates[1],
                  noise_score: ratingNoise,
                  air_score: ratingAir,
                  water_score: ratingWater,
                  safety_score: ratingSafety,
                  note: ratingNote
                });
                setIsSubmitting(false);
                if (!error) {
                  setShowRatingModal(false);
                  onSelectLocality(selectedLocality); // Re-trigger to fetch updated score
                } else {
                  alert("Failed to submit rating: " + error.message);
                }
              }}
              disabled={isSubmitting}
              className="w-full py-3 bg-brand text-white font-medium rounded-xl hover:bg-brand-hover transition-colors shadow-lg shadow-brand/25 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Rating
            </button>
          </div>
        </div>
      )}
    </>
  );
}
