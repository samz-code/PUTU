import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { HerTurnEdition, HerTurnTicketTier } from '@/types/HerTurn';
import { effectiveTierPrice, tierSpotsLeft } from '@/types/HerTurn';
import { downloadIcsFile, buildGoogleCalendarUrl } from '@/utils/herTurnCalendar';
import {
  ArrowLeft, Calendar, MapPin, Clock, Users, Shirt, Download, ExternalLink,
  Sparkles, AlertTriangle,
} from 'lucide-react';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function HerTurnEditionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [edition, setEdition] = useState<HerTurnEdition | null>(null);
  const [tiers, setTiers] = useState<HerTurnTicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) fetchEdition(slug);
    window.scrollTo(0, 0);
  }, [slug]);

  async function fetchEdition(editionSlug: string) {
    setLoading(true);
    setNotFound(false);
    try {
      const { data: editionData, error: editionError } = await supabase
        .from('her_turn_editions')
        .select('*')
        .eq('slug', editionSlug)
        .eq('status', 'published')
        .maybeSingle();

      if (editionError) throw editionError;
      if (!editionData) {
        setNotFound(true);
        return;
      }
      setEdition(editionData);
      document.title = editionData.meta_title || `${editionData.title} | Her Turn`;

      const { data: tierData, error: tierError } = await supabase
        .from('her_turn_ticket_tiers')
        .select('*')
        .eq('edition_id', editionData.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (tierError) throw tierError;
      setTiers(tierData || []);
    } catch (err) {
      console.error('Error fetching edition:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const isPast = useMemo(() => {
    if (!edition) return false;
    return edition.end_date < new Date().toISOString().split('T')[0];
  }, [edition]);

  function handleAddToCalendar() {
    if (!edition) return;
    downloadIcsFile({
      title: edition.title,
      description: edition.description,
      location: edition.venue_name ? `${edition.venue_name}, ${edition.venue_address || ''}` : '',
      startDate: edition.start_date,
      endDate: edition.end_date,
      url: window.location.href,
    });
  }

  function handleGoogleCalendar() {
    if (!edition) return;
    window.open(
      buildGoogleCalendarUrl({
        title: edition.title,
        description: edition.description,
        location: edition.venue_name ? `${edition.venue_name}, ${edition.venue_address || ''}` : '',
        startDate: edition.start_date,
        endDate: edition.end_date,
        url: window.location.href,
      }),
      '_blank'
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading edition...</div>;
  }

  if (notFound || !edition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <h2 className="text-2xl font-serif font-bold text-cocoa-700">Edition Not Found</h2>
        <p className="text-slate-600 text-sm">This Her Turn edition may have been moved, unpublished, or removed.</p>
        <button onClick={() => navigate('/her-turn')} className="bg-cocoa-700 hover:bg-cocoa-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors">
          Back to Her Turn
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 pb-24">
      {/* Hero */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] bg-cocoa-900">
        <img src={edition.hero_image_url} alt={edition.title} className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 max-w-5xl mx-auto px-4 sm:px-6 pb-12 space-y-4 text-white">
          <button onClick={() => navigate('/her-turn')} className="inline-flex items-center gap-2 text-xs font-semibold text-sand-200 hover:text-white bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full cursor-pointer transition-colors">
            <ArrowLeft size={14} /> Back to Her Turn
          </button>
          {edition.themes?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {edition.themes.map(theme => (
                <span key={theme} className="inline-block bg-coral-600 text-white text-xs font-semibold px-3.5 py-1 rounded-full uppercase tracking-wider">{theme}</span>
              ))}
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl font-serif font-bold leading-tight">{edition.title}</h1>
          {edition.subtitle && <p className="text-sand-200 text-base sm:text-lg max-w-2xl">{edition.subtitle}</p>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Key facts bar */}
          <div className="bg-white rounded-3xl border border-sand-200 shadow-sm p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Calendar size={16} className="text-coral-600" />
              <p className="text-xs text-slate-500">Dates</p>
              <p className="text-sm font-semibold text-cocoa-700">{formatDate(edition.start_date)}</p>
            </div>
            <div className="space-y-1">
              <MapPin size={16} className="text-teal-700" />
              <p className="text-xs text-slate-500">Venue</p>
              <p className="text-sm font-semibold text-cocoa-700">{edition.venue_name || 'TBA'}</p>
            </div>
            {edition.start_time && (
              <div className="space-y-1">
                <Clock size={16} className="text-teal-700" />
                <p className="text-xs text-slate-500">Start Time</p>
                <p className="text-sm font-semibold text-cocoa-700">{edition.start_time}</p>
              </div>
            )}
            {edition.dress_code && (
              <div className="space-y-1">
                <Shirt size={16} className="text-coral-600" />
                <p className="text-xs text-slate-500">Dress Code</p>
                <p className="text-sm font-semibold text-cocoa-700">{edition.dress_code}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-3xl border border-sand-200 shadow-sm p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-serif font-bold text-cocoa-700">About This Edition</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{edition.description}</p>
          </div>

          {/* Itinerary */}
          {edition.itinerary?.length > 0 && (
            <div className="bg-white rounded-3xl border border-sand-200 shadow-sm p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-serif font-bold text-cocoa-700">Itinerary</h2>
              <div className="space-y-3">
                {edition.itinerary.map((item, idx) => (
                  <div key={idx} className="flex gap-4 pb-3 border-b border-sand-100 last:border-0 last:pb-0">
                    <div className="w-20 shrink-0">
                      <div className="text-xs font-bold text-coral-600">{item.day}</div>
                      <div className="text-[11px] text-slate-400">{item.time}</div>
                    </div>
                    <p className="text-sm text-slate-600">{item.activity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speakers */}
          {edition.keynote_speakers?.length > 0 && (
            <div className="bg-white rounded-3xl border border-sand-200 shadow-sm p-6 sm:p-8 space-y-5">
              <h2 className="text-xl font-serif font-bold text-cocoa-700 flex items-center gap-2">
                <Sparkles size={18} className="text-coral-600" /> Featured Voices
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {edition.keynote_speakers.map((speaker, idx) => (
                  <div key={idx} className="flex gap-3">
                    <img src={speaker.image_url} alt={speaker.name} className="w-14 h-14 rounded-full object-cover shrink-0 bg-sand-100" />
                    <div>
                      <h4 className="font-bold text-cocoa-700 text-sm">{speaker.name}</h4>
                      <p className="text-xs text-coral-600 font-medium">{speaker.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{speaker.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partners */}
          {edition.partners?.length > 0 && (
            <div className="bg-white rounded-3xl border border-sand-200 shadow-sm p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-serif font-bold text-cocoa-700">Partner Highlights</h2>
              <div className="flex flex-wrap items-center gap-6">
                {edition.partners.map((partner, idx) => (
                  <a key={idx} href={partner.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-700">
                    <img src={partner.logo_url} alt={partner.name} className="h-8 object-contain" /> {partner.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {edition.gallery_urls?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {edition.gallery_urls.map((url, idx) => (
                <img key={idx} src={url} alt={`${edition.title} gallery ${idx + 1}`} className="w-full h-40 object-cover rounded-2xl" loading="lazy" />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: tickets + calendar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="sticky top-6 space-y-6">
            {/* Calendar sync */}
            <div className="bg-white rounded-3xl border border-sand-200 shadow-sm p-6 space-y-3">
              <h3 className="font-serif font-bold text-cocoa-700 text-sm">Save the Date</h3>
              <button onClick={handleAddToCalendar} className="w-full flex items-center justify-center gap-2 bg-sand-100 hover:bg-sand-200 text-cocoa-700 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                <Download size={14} /> Download .ics
              </button>
              <button onClick={handleGoogleCalendar} className="w-full flex items-center justify-center gap-2 bg-white border border-sand-200 hover:bg-sand-100 text-cocoa-700 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                <ExternalLink size={14} /> Add to Google Calendar
              </button>
            </div>

            {/* Ticket tiers */}
            {isPast ? (
              <div className="bg-white rounded-3xl border border-sand-200 shadow-sm p-6 text-center text-sm text-slate-500">
                This edition has concluded.
              </div>
            ) : !edition.registration_open ? (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center space-y-2">
                <AlertTriangle size={20} className="text-amber-600 mx-auto" />
                <p className="text-sm font-semibold text-amber-700">Registration is currently closed</p>
                <p className="text-xs text-amber-600">Reach out via Contact to join the waitlist.</p>
              </div>
            ) : tiers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-sand-200 shadow-sm p-6 text-center text-sm text-slate-500">
                Ticket tiers coming soon.
              </div>
            ) : (
              <div className="space-y-4">
                {tiers.map(tier => {
                  const spotsLeft = tierSpotsLeft(tier);
                  const price = effectiveTierPrice(tier);
                  const soldOut = spotsLeft === 0;
                  return (
                    <div key={tier.id} className="bg-white rounded-3xl border border-sand-200 shadow-sm p-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-cocoa-700">{tier.name}</h4>
                          {tier.description && <p className="text-xs text-slate-500 mt-0.5">{tier.description}</p>}
                        </div>
                        <span className="text-lg font-bold text-coral-700 shrink-0">{tier.currency} {price}</span>
                      </div>
                      {tier.perks?.length > 0 && (
                        <ul className="space-y-1">
                          {tier.perks.map((perk, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-teal-600 shrink-0" /> {perk}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-sand-100">
                        <span className={`text-[11px] font-semibold flex items-center gap-1 ${soldOut ? 'text-rose-500' : spotsLeft <= 5 ? 'text-amber-600' : 'text-teal-700'}`}>
                          <Users size={12} /> {soldOut ? 'Sold out' : `Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/her-turn/${edition.slug}/checkout?tier=${tier.id}`)}
                        disabled={soldOut}
                        className="w-full bg-coral-600 hover:bg-coral-700 disabled:bg-sand-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                      >
                        {soldOut ? 'Join Waitlist' : 'Reserve Spot'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}