import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  capacity: string;
  price_per_day?: number;
  image_url: string;
  description: string;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
}

export default function Transfers() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicFleet() {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('is_active', true)
          .order('is_featured', { ascending: false });

        if (error) throw error;
        setVehicles(data || []);
      } catch (err: any) {
        console.error('Error fetching public fleet:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPublicFleet();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Header Banner */}
      <section className="bg-white py-16 border-b border-slate-200">
        <div className="page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">Private Transfers & Fleet</h1>
          <p className="mt-3 text-slate-500 max-w-xl text-sm sm:text-base">
            Trusted professional drivers and a luxury fleet for every travel need, from VIP airport pickups to bespoke day tours.
          </p>
        </div>
      </section>

      {/* Fleet Grid */}
      <section className="page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
          <ShieldCheck className="text-teal-600" /> Available Vehicles
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin text-teal-600" />
            <span className="text-sm font-medium">Loading fleet options...</span>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <p className="font-semibold text-base text-slate-700">No vehicles available at the moment</p>
            <p className="text-xs sm:text-sm mt-1">Please check back later or contact support for customized arrangements.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicles.map((v) => (
              <div 
                key={v.id} 
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col sm:flex-row transition-all relative ${
                  v.is_featured ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
                }`}
              >
                {v.is_featured && (
                  <span className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles size={10} /> Featured
                  </span>
                )}

                <div className="sm:w-2/5 h-56 sm:h-auto overflow-hidden bg-slate-100 relative">
                  <img 
                    src={v.image_url || 'https://via.placeholder.com/400'} 
                    alt={v.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-md uppercase">
                        {v.type}
                      </span>
                      <span className="text-xs font-bold text-teal-700">
                        {v.price_per_day ? `$${v.price_per_day} / day` : 'Custom Pricing'}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-slate-900 mt-2">{v.name}</h3>
                    
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                      <Users size={14} className="text-slate-400" /> {v.capacity}
                    </p>

                    <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {v.description}
                    </p>

                    {v.features && v.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {v.features.map((feature, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-[10px] font-medium rounded-lg text-slate-600">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action Section */}
      <section className="page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="font-serif text-2xl font-bold">Need private transport for your itinerary?</h3>
            <p className="text-sm text-slate-300 mt-1 max-w-lg">
              Seamlessly integrate custom transfer vehicles, airport drop-offs, and daily driving services directly into your journey brief.
            </p>
          </div>
          <Link 
            to="/planner" 
            className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap"
          >
            Plan Your Journey <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}