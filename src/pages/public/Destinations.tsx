import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Compass, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Destination {
  id: string;
  name: string;
  region: string;
  image_url: string;
  description: string;
  highlights: string[];
  display_order: number;
}

export default function Destinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setDestinations(data || []);
    } catch (err) {
      console.error('Error loading destinations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-sand-50/50 min-h-screen pb-20">
      {/* Hero Header */}
      <section className="bg-sand-100 py-20 border-b border-sand-200 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c29b61_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="page-container relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-4 border border-teal-100">
            <Compass size={14} /> Coastal Exploration
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-cocoa-700 tracking-tight">
            Magical Coastal Destinations
          </h1>
          <p className="mt-4 text-slate-600 max-w-2xl text-base sm:text-lg leading-relaxed">
            Explore the unique paradises operating along the Kenyan coastline—each offering its own distinct atmosphere, heritage, and marine wonder.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="page-container py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-teal-600" />
            <span className="text-sm font-medium">Curating coastal destinations...</span>
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-600 font-medium">No destinations currently listed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {destinations.map((d) => (
              <div 
                key={d.id || d.name} 
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row group"
              >
                {/* Image Container */}
                <div className="sm:w-2/5 h-64 sm:h-auto relative overflow-hidden bg-slate-100">
                  <img 
                    src={d.image_url} 
                    alt={d.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-teal-800 text-xs font-bold rounded-lg shadow-sm">
                      {d.region}
                    </span>
                  </div>
                </div>

                {/* Details Container */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-cocoa-700 group-hover:text-teal-700 transition-colors">
                      {d.name}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                      {d.description}
                    </p>

                    {/* Highlights Tags */}
                    {d.highlights && d.highlights.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Sparkles size={12} className="text-teal-600" /> Key Highlights
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.highlights.map((h, i) => (
                            <span 
                              key={i} 
                              className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-md border border-slate-100"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <MapPin size={14} className="text-teal-600" /> Kenyan Coastline
                    </div>
                    <Link 
                      to="/planner" 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 group-hover:translate-x-1 transition-transform"
                    >
                      Plan Experience <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA Banner */}
      <section className="page-container mt-8">
        <div className="bg-gradient-to-br from-cocoa-700 to-cocoa-900 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
            <Compass size={240} />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">Ready to Explore the Coast?</h2>
            <p className="mt-3 text-sand-200 text-sm sm:text-base leading-relaxed">
              Let our journey planners build a bespoke itinerary combining private transfers, luxury stays, and curated excursions across these stunning destinations.
            </p>
            <div className="mt-8">
              <Link 
                to="/planner" 
                className="px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-lg inline-flex items-center gap-2 transition-all"
              >
                Start Your Journey <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}