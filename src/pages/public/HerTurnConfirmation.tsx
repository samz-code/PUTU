import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { qrImageUrl } from '@/utils/herTurnCalendar';
import { CheckCircle2, Clock, XCircle, Download, Share2 } from 'lucide-react';

interface RegistrationStatus {
  status: string;
  full_name: string;
  edition_title: string;
  edition_slug: string;
  ticket_tier: string;
  amount_due: number;
  currency: string;
  qr_token: string | null;
  checked_in_at: string | null;
}

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 30; // ~2 minutes

export default function HerTurnConfirmation() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const [reg, setReg] = useState<RegistrationStatus | null>(null);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!ref) {
      setError('Missing booking reference.');
      return;
    }
    fetchStatus();
    pollRef.current = setInterval(() => {
      setAttempts(prev => {
        if (prev >= MAX_POLL_ATTEMPTS) {
          if (pollRef.current) clearInterval(pollRef.current);
          return prev;
        }
        fetchStatus();
        return prev + 1;
      });
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  useEffect(() => {
    if (reg && (reg.status === 'paid' || reg.status === 'checked_in' || reg.status === 'failed')) {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [reg]);

  async function fetchStatus() {
    if (!ref) return;
    try {
      const { data, error: fetchError } = await supabase.rpc('get_registration_status', { p_merchant_reference: ref });
      if (fetchError) throw fetchError;
      const result = data?.[0];
      if (!result) {
        setError('We could not find a booking with this reference.');
        return;
      }
      setReg(result);
    } catch (err) {
      console.error('Error fetching registration status:', err);
      setError('Something went wrong checking your payment status.');
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center px-4 text-center">
        <div className="bg-white rounded-3xl border border-sand-200 shadow-sm max-w-md w-full p-8 space-y-4">
          <XCircle size={40} className="text-rose-500 mx-auto" />
          <p className="text-sm text-slate-600">{error}</p>
          <Link to="/her-turn" className="inline-block bg-cocoa-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">Back to Her Turn</Link>
        </div>
      </div>
    );
  }

  if (!reg) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Checking your booking...</div>;
  }

  if (reg.status === 'pending') {
    const timedOut = attempts >= MAX_POLL_ATTEMPTS;
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center px-4 text-center">
        <div className="bg-white rounded-3xl border border-sand-200 shadow-sm max-w-md w-full p-8 space-y-4">
          <Clock size={40} className="text-amber-500 mx-auto animate-pulse" />
          <h2 className="text-xl font-serif font-bold text-cocoa-700">Confirming your payment…</h2>
          <p className="text-sm text-slate-600">
            {timedOut
              ? "This is taking longer than expected. If you completed payment via M-Pesa or card, your ticket will still be confirmed shortly — refresh this page in a minute."
              : "Hang tight — this usually takes a few seconds once payment completes on PesaPal."}
          </p>
          {!timedOut && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (reg.status === 'failed' || reg.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center px-4 text-center">
        <div className="bg-white rounded-3xl border border-sand-200 shadow-sm max-w-md w-full p-8 space-y-4">
          <XCircle size={40} className="text-rose-500 mx-auto" />
          <h2 className="text-xl font-serif font-bold text-cocoa-700">Payment Was Not Completed</h2>
          <p className="text-sm text-slate-600">Your reservation for {reg.edition_title} was not confirmed. No charge should have gone through — please try booking again.</p>
          <Link to={`/her-turn/${reg.edition_slug}`} className="inline-block bg-coral-600 hover:bg-coral-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  // paid or checked_in — show the e-ticket
  return (
    <div className="min-h-screen bg-sand-50 py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 size={44} className="text-emerald-600 mx-auto" />
          <h1 className="text-2xl font-serif font-bold text-cocoa-700">You're Confirmed!</h1>
          <p className="text-sm text-slate-600">Your e-ticket has also been sent to your email.</p>
        </div>

        <div className="bg-white rounded-3xl border border-sand-200 shadow-sm overflow-hidden">
          <div className="bg-cocoa-900 text-white p-6 text-center">
            <p className="text-xs text-sand-300 uppercase tracking-wider font-semibold">Her Turn E-Ticket</p>
            <h2 className="text-lg font-serif font-bold mt-1">{reg.edition_title}</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex flex-col items-center">
              {reg.qr_token && (
                <img src={qrImageUrl(reg.qr_token, 220)} alt="E-ticket QR code" className="w-48 h-48 rounded-xl border border-sand-200" />
              )}
              <p className="text-[11px] text-slate-400 mt-2">Show this at check-in</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-semibold text-cocoa-700">{reg.full_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Ticket</span><span className="font-semibold text-cocoa-700">{reg.ticket_tier}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="font-semibold text-cocoa-700">{reg.currency} {reg.amount_due}</span></div>
              {reg.checked_in_at && (
                <div className="flex justify-between"><span className="text-slate-500">Checked In</span><span className="font-semibold text-emerald-600">{new Date(reg.checked_in_at).toLocaleString()}</span></div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => window.print()} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-sand-100 hover:bg-sand-200 text-cocoa-700 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                <Download size={14} /> Save / Print
              </button>
              <button
                onClick={() => navigator.share ? navigator.share({ title: reg.edition_title, url: window.location.href }) : navigator.clipboard.writeText(window.location.href)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-sand-200 hover:bg-sand-100 text-cocoa-700 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
        </div>

        <Link to="/her-turn" className="block text-center text-sm text-teal-700 font-semibold">Back to Her Turn</Link>
      </div>
    </div>
  );
}