import { Info, MapPin, Server, Users } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="h-full overflow-y-auto custom-scroll bg-slate-950 text-slate-50 p-6 md:p-12 lg:px-32">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">How AreaVibe Works</h1>
          <p className="text-xl text-slate-400">
            We combine open geographic data with crowdsourced reality to build the most accurate livability map of India.
          </p>
        </div>

        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="p-3 bg-brand/20 rounded-lg">
              <Server className="w-6 h-6 text-brand" />
            </div>
            <h2 className="text-2xl font-semibold">Layer 1: Objective Open Data</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            The moment you search for any street, AreaVibe queries the <strong>OpenStreetMap Overpass API</strong> in real-time. We scan a 1km radius around your location to compute proximity to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400 ml-4">
            <li>Highways, major arterial roads, and railways (Noise & Air Quality)</li>
            <li>Industrial zones (Air Quality)</li>
            <li>Parks and green spaces (Air Quality)</li>
            <li>Religious structures and event halls (Event Noise)</li>
          </ul>
          <p className="text-slate-300 leading-relaxed">
            This creates an objective baseline score for <strong>every single location</strong> without needing a single user review.
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="p-3 bg-brand/20 rounded-lg">
              <Users className="w-6 h-6 text-brand" />
            </div>
            <h2 className="text-2xl font-semibold">Layer 2: Crowdsourced Reality</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Data can't tell you if a landlord is unreasonable or if the municipal water supply is cut every summer. Once an area has a baseline score, residents can submit anonymous ratings to refine the data.
          </p>
          <p className="text-slate-300 leading-relaxed">
            To prevent spam and gaming, all ratings are tied to verified phone numbers and aggregated at the locality level. We do not support building-level public shaming.
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="p-3 bg-brand/20 rounded-lg">
              <MapPin className="w-6 h-6 text-brand" />
            </div>
            <h2 className="text-2xl font-semibold">Layer 3: Dynamic Generation</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Unlike static listing sites, AreaVibe is dynamic. The score for a specific street corner might differ from a street two blocks away due to its immediate proximity to a major road or a park. Try clicking anywhere on the map to see this in action.
          </p>
        </section>

      </div>
    </div>
  );
}
