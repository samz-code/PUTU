import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Utensils, Car, Compass, Percent, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PartnerOffering {
  id: string;
  title: string;
  description: string;
  image_url: string;
  portal_name: string;
  category_key: string;
  is_active: boolean;
}

const iconMap: Record<string, any> = {
  hotel: BedDouble,
  restaurant: Utensils,
  driver: Car,
  guide: Compass,
};

const benefits = [
  { icon: Percent, title: 'Fair Commission', desc: 'Transparent commission structure, tracked and settled on time.' },
  { icon: Compass, title: 'Curated Guests', desc: 'Every guest is briefed and prepared by our concierge team.' },
  { icon: BedDouble, title: 'Dedicated Portal', desc: 'Manage your availability, reservations, and payments in one place.' },
];

export default function Partners() {
  const [partners, setPartners] = useState<PartnerOffering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartners() {
      try {
        const { data, error } = await supabase
          .from('partner_offerings')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setPartners(data || []);
      } catch (err: any) {
        console.error('Error fetching partner offerings:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPartners();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Header Banner */}
      <section className="bg-white py-16 border-b border-slate-200">
        <div className="page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">Partners Network</h1>
          <p className="mt-3 text-slate-500 max-w-xl text-sm sm:text-base">
            Join our trusted network and receive curated guests, managed end to end.
          </p>
        </div>
      </section>

      {/* Partner Portals Grid */}
      <section className="page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
          <ShieldCheck className="text-teal-600" /> Partner Portals & Programs
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin text-teal-600" />
            <span className="text-sm font-medium">Loading partner programs...</span>
          </div>
        ) : partners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <p className="font-semibold text-base text-slate-700">No partner programs currently listed</p>
            <p className="text-xs sm:text-sm mt-1">Please check back later or apply directly through registration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partners.map((p) => {
              const IconComponent = iconMap[p.category_key] || Compass;
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="h-48 overflow-hidden bg-slate-100">
                    <img src={p.image_url || 'https://via.placeholder.com/400'} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent size={18} className="text-teal-600 shrink-0" />
                        <h3 className="font-serif text-xl font-bold text-slate-900">{p.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{p.description}</p>
                      <span className="inline-block mt-3 px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg">
                        {p.portal_name}
                      </span>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <Link to="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:gap-2.5 transition-all">
                        Apply to partner <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Why Partner With Us */}
      <section className="bg-white py-16 border-t border-slate-200">
        <div className="page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Why Partner With Us</h2>
            <p className="text-sm text-slate-500 mt-1">We bring you the right guests, prepared and managed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
                  <b.icon size={18} className="text-teal-600" />
                </div>
                <h3 className="font-serif text-lg font-bold text-slate-900">{b.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}