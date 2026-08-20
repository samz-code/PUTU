import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Heart,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import type {
  HerTurnEdition,
  HerTurnPageSettings,
} from '@/types/Herturn';
import {
  DEFAULT_HER_TURN_PAGE_SETTINGS,
} from '@/types/Herturn';

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1691161510065-298039a5b51b?fm=jpg&q=80&w=2400&auto=format&fit=crop';

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);

  const opts: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
  };

  if (
    s.getFullYear() !== e.getFullYear() ||
    s.getMonth() !== e.getMonth()
  ) {
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString(
      'en-US',
      {
        ...opts,
        year: 'numeric',
      },
    )}`;
  }

  return `${s.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })} – ${e.getDate()}, ${e.getFullYear()}`;
}

export default function HerTurn() {
  const [editions, setEditions] = useState<HerTurnEdition[]>([]);
  const [settings, setSettings] =
    useState<HerTurnPageSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title =
      'Her Turn — Travel. Connect. Thrive. | Putu Travels';

    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [editionsRes, settingsRes] = await Promise.all([
        supabase
          .from('her_turn_editions')
          .select('*')
          .eq('status', 'published')
          .order('start_date', { ascending: true }),

        supabase
          .from('her_turn_page_settings')
          .select('*')
          .limit(1)
          .maybeSingle(),
      ]);

      if (editionsRes.error) {
        throw editionsRes.error;
      }

      setEditions(editionsRes.data || []);

      if (settingsRes.error) {
        throw settingsRes.error;
      }

      setSettings(settingsRes.data);
    } catch (err) {
      console.error('Error fetching Her Turn data:', err);
    } finally {
      setLoading(false);
    }
  }

  /*
   * Fallback only covers the brief loading window or a database
   * migration that has not yet been completed.
   */
  const copy =
    settings || DEFAULT_HER_TURN_PAGE_SETTINGS;

  const { upcoming, past } = useMemo(() => {
    const today = new Date()
      .toISOString()
      .split('T')[0];

    return {
      upcoming: editions.filter(
        (edition) => edition.end_date >= today,
      ),
      past: editions.filter(
        (edition) => edition.end_date < today,
      ),
    };
  }, [editions]);

  return (
    <div className="min-h-screen bg-sand-50 pb-24">
      {/* Hero */}
      <section className="relative py-24 text-white lg:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${HERO_IMAGE_URL}')`,
          }}
        />

        <div className="absolute inset-0 bg-cocoa-900/55" />

        <div className="page-container relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 border border-white/30 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
            <Sparkles size={13} />
            {copy.hero_badge_text}
          </div>

          <h1 className="mb-6 font-serif text-4xl font-bold leading-tight tracking-tight lg:text-6xl">
            {copy.hero_title}
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-100 lg:text-lg">
            {copy.hero_subtitle}
          </p>
        </div>
      </section>

      {/* Value proposition */}
      <section className="page-container pt-16">
        <div className="grid grid-cols-1 items-center gap-8 border border-sand-200 bg-white p-8 lg:grid-cols-3 lg:p-12">
          <div className="space-y-5 lg:col-span-2">
            <h2 className="font-serif text-2xl font-bold text-cocoa-700 lg:text-3xl">
              {copy.value_heading}
            </h2>

            <p className="text-sm leading-relaxed text-slate-600 lg:text-base">
              {copy.value_body}
            </p>

            <div className="grid grid-cols-1 gap-3.5 pt-2 sm:grid-cols-2">
              {copy.value_checklist.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2.5 text-sm font-semibold text-teal-800"
                >
                  <CheckCircle2
                    size={18}
                    className="flex-shrink-0 text-teal-600"
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center border border-coral-200 bg-coral-50 p-8 text-center">
            <Heart
              size={32}
              className="mx-auto mb-3 text-coral-600"
            />

            <h3 className="mb-1 font-serif text-lg font-bold text-cocoa-700">
              {copy.sisterhood_heading}
            </h3>

            <p className="mb-6 text-xs leading-relaxed text-slate-500">
              {copy.sisterhood_body}
            </p>

            <Link
              to={copy.sisterhood_cta_link}
              className="bg-coral-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-700"
            >
              {copy.sisterhood_cta_text}
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming editions */}
      <section className="page-container pt-16">
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Secure Your Cohort
          </span>

          <h2 className="mt-1 font-serif text-3xl font-bold text-cocoa-700">
            Upcoming Her Turn Editions
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-96 animate-pulse border border-sand-200 bg-white"
              />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="border border-sand-200 bg-white p-12 text-center text-slate-500">
            No upcoming editions announced yet. Check back soon or
            request access above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {upcoming.map((edition) => (
              <EditionCard
                key={edition.id}
                edition={edition}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past editions */}
      {past.length > 0 && (
        <section className="page-container pt-20">
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-cocoa-500">
              The Archive
            </span>

            <h2 className="mt-1 font-serif text-3xl font-bold text-cocoa-700">
              Past Editions
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((edition) => (
              <Link
                key={edition.id}
                to={`/her-turn/${edition.slug}`}
                className="group overflow-hidden border border-sand-200 bg-white transition-colors hover:border-cocoa-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={edition.hero_image_url}
                    alt={edition.title}
                    className="h-full w-full object-cover grayscale-[30%] transition-all duration-500 group-hover:grayscale-0"
                  />
                </div>

                <div className="space-y-2 p-5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    {formatDateRange(
                      edition.start_date,
                      edition.end_date,
                    )}
                  </span>

                  <h3 className="line-clamp-2 font-serif text-base font-bold text-cocoa-700">
                    {edition.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EditionCard({
  edition,
}: {
  edition: HerTurnEdition;
}) {
  return (
    <div className="group flex flex-col justify-between overflow-hidden border border-sand-200 bg-white">
      <div>
        <div className="relative h-72 overflow-hidden bg-sand-200">
          <img
            src={edition.hero_image_url}
            alt={edition.title}
            className="h-full w-full object-cover"
          />

          {edition.themes?.length > 0 && (
            <div className="absolute left-4 top-4 bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white">
              {edition.themes[0]}
            </div>
          )}
        </div>

        <div className="space-y-5 p-8">
          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar
                size={15}
                className="text-coral-600"
              />
              {formatDateRange(
                edition.start_date,
                edition.end_date,
              )}
            </span>

            {edition.venue_name && (
              <span className="flex items-center gap-1.5">
                <MapPin
                  size={15}
                  className="text-teal-600"
                />
                {edition.venue_name}
              </span>
            )}
          </div>

          <h3 className="font-serif text-2xl font-bold text-cocoa-700">
            {edition.title}
          </h3>

          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
            {edition.subtitle || edition.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-sand-100 p-8 pt-0">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Users
            size={14}
            className="text-teal-700"
          />
          Women-only group
        </span>

        <Link
          to={`/her-turn/${edition.slug}`}
          className="flex items-center gap-2 bg-coral-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-coral-700"
        >
          View & Reserve
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}