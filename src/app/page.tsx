import Link from "next/link";
import { ArrowRight, Activity, MapPin, Shield, Zap, Volume2, CloudRain } from "lucide-react";

export default function LandingPage() {
  const features = [
    { icon: Volume2, title: "Noise Risk", desc: "Proximity to flyovers, railways, and loud transit." },
    { icon: Activity, title: "Air Quality", desc: "Live AQI and exposure to industrial belts." },
    { icon: MapPin, title: "Event Noise", desc: "Density of nearby banquet halls and religious centers." },
    { icon: CloudRain, title: "Waterlogging", desc: "Historical data on flood-prone sectors and underpasses." },
    { icon: Zap, title: "Power/Water", desc: "Crowdsourced reports of tanker dependency and power cuts." },
    { icon: Shield, title: "Safety Perception", desc: "Real experiences from residents and delivery workers." },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scroll bg-slate-950 text-slate-50 selection:bg-brand selection:text-white">
      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-24 md:pt-48 md:pb-32 flex flex-col items-center text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-20 bg-brand rounded-full blur-[120px]" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl z-10">
          The livability layer that <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-cyan-400">listing sites don't show you.</span>
        </h1>
        
        <p className="mt-8 text-xl md:text-2xl text-slate-400 max-w-2xl z-10 leading-relaxed">
          Price and photos aren't enough. Discover real data on noise, air quality, waterlogging, and safety for every street in Delhi NCR.
        </p>
        
        <div className="mt-12 flex gap-4 z-10">
          <Link 
            href="/map"
            className="px-8 py-4 bg-brand hover:bg-brand/90 text-white rounded-full font-bold text-lg transition-all flex items-center gap-2 hover:scale-105"
          >
            Explore the Map <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="/methodology"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-bold text-lg transition-all flex items-center gap-2"
          >
            How it Works
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">Know before you move.</h2>
            <p className="mt-4 text-slate-400 text-lg">AreaVibe computes scores instantly using open data and crowdsourced reality.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-colors">
                <div className="w-12 h-12 rounded-lg bg-brand/20 flex items-center justify-center mb-6">
                  <f.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 text-center text-slate-500 border-t border-white/5">
        <p>© 2026 AreaVibe. Building transparency for Indian real estate.</p>
      </footer>
    </div>
  );
}
