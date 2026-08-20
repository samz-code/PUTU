import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, Percent, Compass, Bed, ShieldCheck, 
  Layers, Award, ChevronRight, Loader2, Briefcase, Star, 
  HeartHandshake, Zap, Globe, Lock, LogIn
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PartnerHeroSettings {
  badge_text: string;
  hero_title: string;
  hero_subtitle: string;
  primary_btn_text: string;
  secondary_btn_text: string;
  stat1_value: string;
  stat1_label: string;
  stat2_value: string;
  stat2_label: string;
  stat3_value: string;
  stat3_label: string;
  stat4_value: string;
  stat4_label: string;
  benefits_title: string;
  benefits_subtitle: string;
}

interface PartnerBenefit {
  id: string;
  title: string;
  description: string;
  icon_name: string;
}

interface PartnerOffering {
  id: string;
  title: string;
  description: string;
  image_url: string;
  portal_name: string;
  category_key: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Percent,
  Compass,
  Bed,
  ShieldCheck,
  Layers,
  Award,
  Briefcase,
  Star,
  Sparkles,
  HeartHandshake,
  Zap,
  Globe,
  Lock,
};

const PORTAL_ROUTE_MAP: Record<string, string> = {
  hotel: '/partner/hotel',
  restaurant: '/partner/restaurant',
  driver: '/partner/driver',
  guide: '/partner/guide',
};

export default function Partner() {
  const [hero, setHero] = useState<PartnerHeroSettings | null>(null);
  const [benefits, setBenefits] = useState<PartnerBenefit[]>([]);
  const [offerings, setOfferings] = useState<PartnerOffering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartnerData();

    const channel = supabase
      .channel('public_partner_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_hero_settings' }, () => fetchHeroSettings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_benefits' }, () => fetchBenefits())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_offerings' }, () => fetchOfferings())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPartnerData = async () => {
    setLoading(true);
    await Promise.all([fetchHeroSettings(), fetchBenefits(), fetchOfferings()]);
    setLoading(false);
  };

  const fetchHeroSettings = async () => {
    const { data } = await supabase.from('partner_hero_settings').select('*').limit(1).single();
    if (data) setHero(data);
  };

  const fetchBenefits = async () => {
    const { data } = await supabase.from('partner_benefits').select('*').eq('is_active', true).order('display_order', { ascending: true });
    if (data) setBenefits(data);
  };

  const fetchOfferings = async () => {
    const { data } = await supabase.from('partner_offerings').select('*').eq('is_active', true).order('display_order', { ascending: true });
    if (data) setOfferings(data);
  };

  const getPortalRoute = (categoryKey: string) => {
    return PORTAL_ROUTE_MAP[categoryKey.toLowerCase()] || '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-teal-600 gap-2">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-sm font-medium text-slate-600">Loading partner ecosystem...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen text-slate-900 font-sans pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="pt-16 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        {hero?.badge_text && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/70 text-teal-700 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles size={14} className="text-teal-600" />
            <span>{hero.badge_text}</span>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 tracking-tight leading-[1.15] max-w-4xl">
          {hero?.hero_title}
        </h1>

        <p className="mt-4 text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
          {hero?.hero_subtitle}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>{hero?.primary_btn_text || 'Apply Now / Register'}</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm border border-slate-200 transition-all text-center shadow-2xs flex items-center justify-center gap-2"
          >
            <LogIn size={16} />
            <span>Partner Sign In</span>
          </Link>
        </div>

        {/* Top Counter Stats Cards */}
        <div className="w-full max-w-5xl mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs">
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{hero?.stat1_value}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{hero?.stat1_label}</p>
            </div>
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs">
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{hero?.stat2_value}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{hero?.stat2_label}</p>
            </div>
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs">
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{hero?.stat3_value}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{hero?.stat3_label}</p>
            </div>
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs">
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{hero?.stat4_value}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{hero?.stat4_label}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY PARTNER SECTION */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            {hero?.benefits_title}
          </h2>
          <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed">
            {hero?.benefits_subtitle}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit) => {
            const IconComponent = ICON_MAP[benefit.icon_name] || Percent;
            return (
              <div
                key={benefit.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col items-start shadow-2xs hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100/80 flex items-center justify-center text-teal-600 mb-6 shrink-0">
                  <IconComponent size={22} />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg sm:text-xl">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. DYNAMIC PARTNER PORTALS SECTION */}
      <section id="programs" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            Active Partner Portals
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Select your category to log in and manage your reservations and listings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {offerings.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <img src={item.image_url || 'https://via.placeholder.com/400'} alt={item.title} className="w-full h-44 object-cover" />
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-md inline-block mb-2">
                    {item.portal_name}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link 
                  to={getPortalRoute(item.category_key)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Access Portal</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}