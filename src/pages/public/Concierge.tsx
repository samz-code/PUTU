import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Utensils, 
  Cake, 
  Camera, 
  Flower2, 
  Heart, 
  CalendarCheck, 
  Loader2 
} from 'lucide-react';
import { IMAGES } from '@/lib/images';
import { supabase } from '@/lib/supabase';

interface ConciergeService {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

// Icon mapping dictionary
const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Heart,
  Cake,
  Camera,
  Flower2,
  CalendarCheck,
};

export default function Concierge() {
  const [services, setServices] = useState<ConciergeService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('concierge_services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching concierge services:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="bg-sand-100 py-16 border-b border-sand-200">
        <div className="page-container">
          <h1 className="font-serif text-4xl font-semibold text-cocoa-700">Concierge Services</h1>
          <p className="mt-3 text-slate-500 max-w-xl">Dining, celebrations, and every special request, handled by your dedicated concierge.</p>
        </div>
      </section>

      <section className="page-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="rounded-xl overflow-hidden shadow-card-lg">
            <img src={IMAGES.beachDinner} alt="Beach dinner" className="w-full h-full object-cover" />
          </div>
          <div className="text-center lg:text-left">
            <h2 className="section-title">Dining, Handled</h2>
            <p className="section-subtitle">
              From a quiet table for two to a full private dinner on the sand, we coordinate with our restaurant partners to secure reservations, plan menus, and arrange every detail of the evening.
            </p>
            <Link to="/planner" className="mt-6 inline-flex items-center justify-center gap-2 mx-auto lg:mx-0 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 px-5 text-sm transition-colors duration-150">
              Reserve Your Evening <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin text-coral-600" />
            <span className="text-sm font-medium">Loading concierge services...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => {
              const IconComponent = iconMap[s.icon_name] || Utensils;
              return (
                <div key={s.id || s.title} className="card p-6">
                  <div className="w-10 h-10 rounded-lg bg-coral-50 flex items-center justify-center mb-4">
                    <IconComponent size={18} className="text-coral-600" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-cocoa-700">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-sand-100 py-16">
        <div className="page-container text-center max-w-2xl mx-auto">
          <h2 className="section-title">Special Requests Welcome</h2>
          <p className="section-subtitle">
            Wheelchair access, medical needs, anniversaries, birthdays, photographers, decorations. If it matters to you, it matters to us. Tell us in your journey brief.
          </p>
          <Link to="/planner" className="btn-primary mt-6 inline-flex items-center justify-center gap-2">
            Plan Your Journey <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}