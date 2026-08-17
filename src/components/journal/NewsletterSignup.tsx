import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Send, Check, AlertCircle } from 'lucide-react';

interface NewsletterSignupProps {
  source?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterSignup({ source = 'journal' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmed)) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert([{ email: trimmed, source }]);
      if (error) {
        // Postgres unique_violation
        if (error.code === '23505') {
          setStatus('error');
          setErrorMsg("You're already subscribed — thank you!");
          return;
        }
        throw error;
      }
      setStatus('success');
      setEmail('');
    } catch (err) {
      console.error('Newsletter signup error:', err);
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again in a moment.');
    }
  }

  return (
    <div className="bg-cocoa-900 text-white rounded-3xl p-8 sm:p-10 text-center space-y-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)] pointer-events-none" />
      <div className="relative space-y-4">
        <div className="w-12 h-12 bg-teal-600/30 rounded-2xl flex items-center justify-center mx-auto border border-teal-500/30">
          <Mail size={22} className="text-teal-300" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold">Never Miss a Dispatch</h3>
          <p className="text-sand-200 text-sm mt-1 max-w-md mx-auto">
            Coastal guides, conservation news, and hidden gems — straight to your inbox, once a week.
          </p>
        </div>

        {status === 'success' ? (
          <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm font-semibold bg-emerald-900/30 py-3 px-4 rounded-xl max-w-sm mx-auto">
            <Check size={16} /> You're subscribed. Welcome aboard!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto" noValidate>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              placeholder="you@example.com"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm placeholder:text-sand-300 focus:outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              {status === 'loading' ? 'Joining…' : (<>Subscribe <Send size={13} /></>)}
            </button>
          </form>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-center gap-1.5 text-rose-300 text-xs">
            <AlertCircle size={13} /> {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
