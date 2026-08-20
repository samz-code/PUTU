import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { HerTurnEdition, HerTurnTicketTier } from '@/types/Herturn';
import { effectiveTierPrice } from '@/types/Herturn';
import { ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function HerTurnCheckout() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const tierId = searchParams.get('tier');
  const navigate = useNavigate();

  const [edition, setEdition] = useState<HerTurnEdition | null>(null);
  const [tier, setTier] = useState<HerTurnTicketTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [soldOut, setSoldOut] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    dietary_requirements: '',
    social_handle: '',
  });

  useEffect(() => {
    if (slug && tierId) fetchData(slug, tierId);
    else {
      setError('Missing ticket selection. Please go back and choose a ticket.');
      setLoading(false);
    }
  }, [slug, tierId]);

  async function fetchData(editionSlug: string, ticketTierId: string) {
    try {
      const { data: editionData, error: editionError } = await supabase
        .from('her_turn_editions')
        .select('*')
        .eq('slug', editionSlug)
        .eq('status', 'published')
        .maybeSingle();
      if (editionError) throw editionError;
      if (!editionData) throw new Error('Edition not found');
      setEdition(editionData);

      const { data: tierData, error: tierError } = await supabase
        .from('her_turn_ticket_tiers')
        .select('*')
        .eq('id', ticketTierId)
        .eq('is_active', true)
        .maybeSingle();
      if (tierError) throw tierError;
      if (!tierData) throw new Error('Ticket tier not found');
      setTier(tierData);
    } catch (err) {
      console.error('Error loading checkout:', err);
      setError('We could not load this ticket. It may have been removed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!edition || !tier) return;

    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.phone.trim().length < 7) {
      setError('Please enter a valid phone number, including country code.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('pesapal-submit-order', {
        body: {
          edition_id: edition.id,
          ticket_tier_id: tier.id,
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          dietary_requirements: form.dietary_requirements.trim() || undefined,
          social_handle: form.social_handle.trim() || undefined,
          quantity: 1,
        },
      });

      if (fnError) throw fnError;
      if (data?.sold_out) {
        setSoldOut(true);
        return;
      }
      if (!data?.redirect_url) {
        throw new Error('Payment provider did not return a redirect URL.');
      }

      window.location.href = data.redirect_url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Something went wrong starting your payment. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!edition || !tier) return;
    try {
      const { error: waitlistError } = await supabase.from('her_turn_waitlist').insert([
        {
          edition_id: edition.id,
          ticket_tier_id: tier.id,
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
        },
      ]);
      if (waitlistError) throw waitlistError;
      setWaitlistSubmitted(true);
    } catch (err) {
      console.error('Waitlist error:', err);
      setError('Could not join the waitlist. Please try again.');
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading checkout...</div>;
  }

  if (error && !edition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <AlertCircle size={32} className="text-rose-500" />
        <p className="text-slate-600 text-sm max-w-sm">{error}</p>
        <Link to="/her-turn" className="bg-cocoa-700 hover:bg-cocoa-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          Back to Her Turn
        </Link>
      </div>
    );
  }

  if (!edition || !tier) return null;

  if (soldOut) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl border border-sand-200 shadow-sm max-w-md w-full p-8 text-center space-y-4">
          {waitlistSubmitted ? (
            <>
              <CheckCircle2 size={40} className="text-teal-600 mx-auto" />
              <h2 className="text-xl font-serif font-bold text-cocoa-700">You're on the waitlist</h2>
              <p className="text-sm text-slate-600">We'll reach out the moment a spot opens up for {tier.name} — {edition.title}.</p>
              <Link to="/her-turn" className="inline-block text-teal-700 text-sm font-semibold">Back to Her Turn</Link>
            </>
          ) : (
            <>
              <AlertCircle size={40} className="text-amber-500 mx-auto" />
              <h2 className="text-xl font-serif font-bold text-cocoa-700">This tier just sold out</h2>
              <p className="text-sm text-slate-600">Join the waitlist and we'll notify you the moment a spot frees up.</p>
              <form onSubmit={handleJoinWaitlist} className="space-y-3 text-left pt-2">
                <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" className="w-full bg-sand-50 border border-sand-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-600" />
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="w-full bg-sand-50 border border-sand-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-600" />
                <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone / WhatsApp" className="w-full bg-sand-50 border border-sand-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-600" />
                {error && <p className="text-xs text-rose-600">{error}</p>}
                <button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer transition-colors">
                  Join Waitlist
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  const price = effectiveTierPrice(tier);

  return (
    <div className="min-h-screen bg-sand-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(`/her-turn/${edition.slug}`)} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-cocoa-700 mb-6 cursor-pointer">
          <ArrowLeft size={14} /> Back to {edition.title}
        </button>

        <div className="bg-white rounded-3xl border border-sand-200 shadow-sm overflow-hidden">
          <div className="bg-cocoa-900 text-white p-6">
            <p className="text-xs text-sand-300 uppercase tracking-wider font-semibold">Secure Reservation</p>
            <h1 className="text-xl font-serif font-bold mt-1">{edition.title}</h1>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <span className="text-sm text-sand-200">{tier.name}</span>
              <span className="text-lg font-bold">{tier.currency} {price}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Full Name</label>
              <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Sarah Mwangi" className="w-full bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm text-cocoa-700 focus:outline-none focus:border-teal-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Email Address</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="sarah@example.com" className="w-full bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm text-cocoa-700 focus:outline-none focus:border-teal-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">WhatsApp / Phone Number</label>
              <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254 700 000000" className="w-full bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm text-cocoa-700 focus:outline-none focus:border-teal-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Instagram / Social Handle (Optional)</label>
              <input value={form.social_handle} onChange={e => setForm({ ...form, social_handle: e.target.value })} placeholder="@yourhandle" className="w-full bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm text-cocoa-700 focus:outline-none focus:border-teal-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Dietary Requirements (Optional)</label>
              <textarea rows={2} value={form.dietary_requirements} onChange={e => setForm({ ...form, dietary_requirements: e.target.value })} placeholder="Let us know any dietary needs..." className="w-full bg-sand-50 border border-sand-200 rounded-lg px-4 py-2.5 text-sm text-cocoa-700 focus:outline-none focus:border-teal-600" />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full bg-coral-600 hover:bg-coral-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg text-sm transition-colors shadow-sm cursor-pointer">
              {submitting ? 'Redirecting to secure payment…' : `Pay ${tier.currency} ${price} with PesaPal`}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck size={12} /> Secured by PesaPal — M-Pesa, card & mobile money accepted
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}