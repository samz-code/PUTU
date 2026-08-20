import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { HerTurnEdition, HerTurnTicketTier, HerTurnWaitlistEntry } from '@/types/Herturn';
import { tierSpotsLeft } from '@/types/Herturn';
import { Users, CheckCircle2, X, Copy, ExternalLink } from 'lucide-react';

export default function WaitlistManager() {
  const [editions, setEditions] = useState<HerTurnEdition[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<string>('');
  const [tiers, setTiers] = useState<HerTurnTicketTier[]>([]);
  const [entries, setEntries] = useState<HerTurnWaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEditions();
  }, []);

  useEffect(() => {
    if (selectedEditionId) {
      fetchTiers(selectedEditionId);
      fetchEntries(selectedEditionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEditionId]);

  async function fetchEditions() {
    const { data, error } = await supabase.from('her_turn_editions').select('*').order('start_date', { ascending: false });
    if (error) {
      console.error('Error fetching editions:', error);
      setLoading(false);
      return;
    }
    setEditions(data || []);
    if (data && data.length > 0) setSelectedEditionId(data[0].id);
    else setLoading(false);
  }

  async function fetchTiers(editionId: string) {
    const { data, error } = await supabase.from('her_turn_ticket_tiers').select('*').eq('edition_id', editionId);
    if (error) console.error('Error fetching tiers:', error);
    setTiers(data || []);
  }

  async function fetchEntries(editionId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('her_turn_waitlist')
        .select('*')
        .eq('edition_id', editionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching waitlist:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPromoted(entry: HerTurnWaitlistEntry) {
    try {
      const { error } = await supabase.from('her_turn_waitlist').update({ status: 'promoted' }).eq('id', entry.id);
      if (error) throw error;
      setEntries(prev => prev.map(e => (e.id === entry.id ? { ...e, status: 'promoted' } : e)));
    } catch (err) {
      console.error('Error promoting waitlist entry:', err);
    }
  }

  async function handleDecline(entry: HerTurnWaitlistEntry) {
    try {
      const { error } = await supabase.from('her_turn_waitlist').update({ status: 'declined' }).eq('id', entry.id);
      if (error) throw error;
      setEntries(prev => prev.map(e => (e.id === entry.id ? { ...e, status: 'declined' } : e)));
    } catch (err) {
      console.error('Error declining waitlist entry:', err);
    }
  }

  function checkoutLinkFor(entry: HerTurnWaitlistEntry) {
    const edition = editions.find(e => e.id === entry.edition_id);
    if (!edition || !entry.ticket_tier_id) return '';
    return `${window.location.origin}/her-turn/${edition.slug}/checkout?tier=${entry.ticket_tier_id}`;
  }

  function handleCopyLink(entry: HerTurnWaitlistEntry) {
    const link = checkoutLinkFor(entry);
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const waiting = entries.filter(e => e.status === 'waiting');
  const resolved = entries.filter(e => e.status !== 'waiting');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select value={selectedEditionId} onChange={e => setSelectedEditionId(e.target.value)} className="bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sm shadow-sm focus:outline-none flex-1">
          {editions.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {/* Tier capacity snapshot */}
      {tiers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiers.map(t => {
            const spots = tierSpotsLeft(t);
            return (
              <div key={t.id} className="bg-white rounded-xl border border-sand-200 p-3 space-y-1">
                <p className="text-xs font-semibold text-cocoa-700">{t.name}</p>
                <p className={`text-lg font-bold ${spots === 0 ? 'text-rose-500' : 'text-teal-700'}`}>{spots}</p>
                <p className="text-[10px] text-slate-400">spots free of {t.stock_total}</p>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading waitlist...</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-sand-200 shadow-sm">
            <div className="p-4 border-b border-sand-200 flex items-center gap-2">
              <Users size={16} className="text-coral-600" />
              <h3 className="text-sm font-bold text-cocoa-700">Waiting ({waiting.length})</h3>
            </div>
            {waiting.length === 0 ? (
              <p className="p-6 text-sm text-slate-400 text-center">No one is currently waiting for this edition.</p>
            ) : (
              <div className="divide-y divide-sand-100">
                {waiting.map((entry, idx) => {
                  const tier = tiers.find(t => t.id === entry.ticket_tier_id);
                  const spotsAvailable = tier ? tierSpotsLeft(tier) > 0 : false;
                  return (
                    <div key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-cocoa-700">#{idx + 1} {entry.full_name}</p>
                        <p className="text-xs text-slate-500">{entry.email} · {entry.phone}{tier ? ` · ${tier.name}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {spotsAvailable && (
                          <>
                            <button onClick={() => handleCopyLink(entry)} className="inline-flex items-center gap-1.5 bg-sand-100 hover:bg-sand-200 text-cocoa-700 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
                              {copiedId === entry.id ? <><CheckCircle2 size={13} /> Copied</> : <><Copy size={13} /> Copy Checkout Link</>}
                            </button>
                            <a href={checkoutLinkFor(entry)} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-sand-100 hover:bg-sand-200 text-cocoa-700 rounded-lg" title="Open checkout">
                              <ExternalLink size={13} />
                            </a>
                          </>
                        )}
                        <button onClick={() => handleMarkPromoted(entry)} className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer">
                          <CheckCircle2 size={13} /> Mark Promoted
                        </button>
                        <button onClick={() => handleDecline(entry)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg cursor-pointer" title="Decline">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {resolved.length > 0 && (
            <div className="bg-white rounded-2xl border border-sand-200 shadow-sm">
              <div className="p-4 border-b border-sand-200">
                <h3 className="text-xs font-bold text-cocoa-700 uppercase">Resolved</h3>
              </div>
              <div className="divide-y divide-sand-100">
                {resolved.map(entry => (
                  <div key={entry.id} className="p-3 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{entry.full_name}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${entry.status === 'promoted' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {entry.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-slate-400 px-1">
        "Mark Promoted" sends a personal checkout link with the tier pre-selected — the attendee still pays through the normal PesaPal flow, which keeps stock counts accurate.
      </p>
    </div>
  );
}
