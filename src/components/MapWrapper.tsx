"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <p>Loading map layer...</p>
      </div>
    </div>
  )
});

export default Map;
