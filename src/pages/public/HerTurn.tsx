import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { HerTurnEdition, HerTurnPageSettings } from '@/types/herTurn';
import { DEFAULT_HER_TURN_PAGE_SETTINGS } from '@/types/HerTurn';
import { Sparkles, Calendar, MapPin, ArrowRight, CheckCircle2, Heart, Users } from 'lucide-react';

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1691161510065-298039a5b51b?fm=jpg&q=80&w=2400&auto=format&fit=crop';

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  if (s.getFullYear() !== e.getFullYear() || s.getMonth() !== e.getMonth()) {
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  }
  return `${s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${e.getDate()}, ${e.getFullYear()}`;
}

export default function HerTurn() {
  const [editions, setEditions] = useState<HerTurnEdition[]>([]);
  const [settings, setSettings] = useState<HerTurnPageSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Her Turn — Travel. Connect. Thrive. | Putu Travels';
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [editionsRes, settingsRes] = await Promise.all([
        supabase.from('her_turn_editions').select('*').eq('status', 'published').order('start_date', { ascending: true }),
        supabase.from('her_turn_page_settings').select('*').limit(1).maybeSingle(),
      ]);

      if (editionsRes.error) throw editionsRes.error;
      setEditions(editionsRes.data || []);

      if (settingsRes.error) throw settingsRes.error;
      setSettings(settingsRes.data);
    } catch (err) {
      console.error('Error fetching Her Turn data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Fallback only covers the brief loading window / a not-yet-migrated DB —
  // once her_turn_page_settings loads, everything below is admin-controlled.
  const copy = settings || DEFAULT_HER_TURN_PAGE_SETTINGS;

  const { upcoming, past } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      upcoming: editions.filter(e => e.end_date >= today),
      past: editions.filter(e => e.end_date < today),
    };
  }, [editions]);

  return (
    <div className="min-h-screen bg-sand-50 pb-24">
      {/* Hero */}
      <section className="relative text-white py-24 lg:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
        />
        <div className="absolute inset-0 bg-cocoa-900/55" />
        <div className="page-container relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-white/30 text-white text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 mb-6">
            <Sparkles size={13} /> {copy.hero_badge_text}
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 font-serif leading-tight">
            {copy.hero_title}
          </h1>
          <p className="text-slate-100 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            {copy.hero_subtitle}
          </p>
        </div>
      </section>

      {/* Value proposition */}
      <section className="page-container pt-16">
        <div className="bg-white border border-sand-200 p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-2xl lg:text-3xl font-bold text-cocoa-700 font-serif">
              {copy.value_heading}
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm lg:text-base">
              {copy.value_body}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {copy.value_checklist.map(item => (
                <div key={item} className="flex items-center gap-2.5 text-sm font-semibold text-teal-800">
                  <CheckCircle2 size={18} className="text-teal-600 flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-coral-50 border border-coral-200 p-8 flex flex-col justify-center text-center">
            <Heart size={32} className="text-coral-600 mx-auto mb-3" />
            <h3 className="font-bold text-cocoa-700 text-lg mb-1 font-serif">{copy.sisterhood_heading}</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">{copy.sisterhood_body}</p>
            <Link to={copy.sisterhood_cta_link} className="bg-coral-600 hover:bg-coral-700 text-white font-semibold py-3 px-6 text-sm transition-colors">
              {copy.sisterhood_cta_text}
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming editions */}
      <section className="page-container pt-16">
        <div className="mb-10">
          <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Secure Your Cohort</span>
          <h2 className="text-3xl font-bold text-cocoa-700 font-serif mt-1">Upcoming Her Turn Editions</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map(n => <div key={n} className="bg-white border border-sand-200 h-96 animate-pulse" />)}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="bg-white border border-sand-200 p-12 text-center text-slate-500">
            No upcoming editions announced yet — check back soon or request access above.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {upcoming.map(edition => <EditionCard key={edition.id} edition={edition} />)}
          </div>
        )}
      </section>

      {/* Past editions */}
      {past.length > 0 && (
        <section className="page-container pt-20">
          <div className="mb-10">
            <span className="text-xs font-semibold text-cocoa-500 uppercase tracking-wider">The Archive</span>
            <h2 className="text-3xl font-bold text-cocoa-700 font-serif mt-1">Past Editions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.map(edition => (
              <Link
                key={edition.id}
                to={`/her-turn/${edition.slug}`}
                className="bg-white border border-sand-200 overflow-hidden hover:border-cocoa-300 transition-colors group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={edition.hero_image_url} alt={edition.title} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" />
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">{formatDateRange(edition.start_date, edition.end_date)}</span>
                  <h3 className="font-serif font-bold text-cocoa-700 text-base line-clamp-2">{edition.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EditionCard({ edition }: { edition: HerTurnEdition }) {
  return (
    <div className="bg-white border border-sand-200 overflow-hidden flex flex-col justify-between group">
      <div>
        <div className="relative h-72 overflow-hidden bg-sand-200">
          <img src={edition.hero_image_url} alt={edition.title} className="w-full h-full object-cover" />
          {edition.themes?.length > 0 && (
            <div className="absolute top-4 left-4 bg-teal-700 text-white text-xs font-semibold px-3 py-1.5">
              {edition.themes[0]}
            </div>
          )}
        </div>
        <div className="p-8 space-y-5">
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><Calendar size={15} className="text-coral-600" /> {formatDateRange(edition.start_date, edition.end_date)}</span>
            {edition.venue_name && <span className="flex items-center gap-1.5"><MapPin size={15} className="text-teal-600" /> {edition.venue_name}</span>}
          </div>
          <h3 className="text-2xl font-bold text-cocoa-700 font-serif">{edition.title}</h3>
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{edition.subtitle || edition.description}</p>
        </div>
      </div>
      <div className="p-8 pt-0 flex items-center justify-between border-t border-sand-100 mt-4">
        <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
          <Users size={14} className="text-teal-700" /> Women-only group
        </span>
        <Link
          to={`/her-turn/${edition.slug}`}
          className="bg-coral-600 hover:bg-coral-700 text-white font-semibold px-6 py-3 text-sm transition-colors duration-150 flex items-center gap-2"
        >
          View & Reserve <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}