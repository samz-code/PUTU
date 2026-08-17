import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { HerTurnEdition } from '@/types/herTurn';
import { Send, Mail, MessageSquare, Users, CheckCircle2, AlertCircle } from 'lucide-react';

interface NotificationLogEntry {
  id: string;
  edition_id: string;
  channel: 'email' | 'sms';
  subject: string | null;
  message: string;
  recipient_count: number;
  created_at: string;
}

export default function NotificationsBroadcast() {
  const [editions, setEditions] = useState<HerTurnEdition[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [log, setLog] = useState<NotificationLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [paidCount, setPaidCount] = useState<number | null>(null);

  useEffect(() => {
    fetchEditions();
  }, []);

  useEffect(() => {
    if (selectedEditionId) {
      fetchLog(selectedEditionId);
      fetchPaidCount(selectedEditionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEditionId]);

  async function fetchEditions() {
    const { data, error: fetchError } = await supabase.from('her_turn_editions').select('*').order('start_date', { ascending: false });
    if (fetchError) {
      console.error('Error fetching editions:', fetchError);
      return;
    }
    setEditions(data || []);
    if (data && data.length > 0) setSelectedEditionId(data[0].id);
  }

  async function fetchPaidCount(editionId: string) {
    const { count, error: countError } = await supabase
      .from('her_turn_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('edition_id', editionId)
      .in('status', ['paid', 'checked_in']);
    if (countError) {
      console.error('Error counting paid attendees:', countError);
      return;
    }
    setPaidCount(count ?? 0);
  }

  async function fetchLog(editionId: string) {
    setLogLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('her_turn_notification_log')
        .select('*')
        .eq('edition_id', editionId)
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setLog(data || []);
    } catch (err) {
      console.error('Error fetching notification log:', err);
    } finally {
      setLogLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEditionId || !message.trim()) return;
    if (!confirm(`Send this ${channel === 'email' ? 'email' : 'SMS'} to ${paidCount ?? 'all'} paid attendee(s)?`)) return;

    setSending(true);
    setError('');
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-her-turn-notification', {
        body: {
          mode: 'broadcast',
          edition_id: selectedEditionId,
          channel,
          subject: channel === 'email' ? subject.trim() || undefined : undefined,
          message: message.trim(),
          sent_by: 'admin',
        },
      });
      if (fnError) throw fnError;
      setResult({ sent: data?.sent ?? 0, total: data?.total ?? 0 });
      setMessage('');
      setSubject('');
      fetchLog(selectedEditionId);
    } catch (err) {
      console.error('Error sending broadcast:', err);
      setError('Failed to send broadcast. Check that the edge function secrets are configured.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-sand-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-cocoa-700">Compose Broadcast</h3>

          <select value={selectedEditionId} onChange={e => setSelectedEditionId(e.target.value)} className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none">
            {editions.map(ed => <option key={ed.id} value={ed.id}>{ed.title}</option>)}
          </select>

          {paidCount !== null && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><Users size={13} /> {paidCount} paid attendee{paidCount === 1 ? '' : 's'} will receive this</p>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => setChannel('email')} className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${channel === 'email' ? 'bg-teal-700 text-white' : 'bg-sand-100 text-cocoa-700'}`}>
              <Mail size={14} /> Email
            </button>
            <button type="button" onClick={() => setChannel('sms')} className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${channel === 'sms' ? 'bg-teal-700 text-white' : 'bg-sand-100 text-cocoa-700'}`}>
              <MessageSquare size={14} /> SMS
            </button>
          </div>

          <form onSubmit={handleSend} className="space-y-3">
            {channel === 'email' && (
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line" className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none" />
            )}
            <textarea
              required
              rows={channel === 'sms' ? 3 : 6}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={channel === 'sms' ? 'Keep it short — SMS is billed per segment.' : 'Write your announcement or reminder...'}
              className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
            />
            {channel === 'sms' && <p className="text-[11px] text-slate-400">{message.length} characters (~{Math.ceil(message.length / 160) || 1} SMS segment{Math.ceil(message.length / 160) > 1 ? 's' : ''})</p>}

            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}
            {result && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-xs">
                <CheckCircle2 size={14} className="shrink-0" /> Sent to {result.sent} of {result.total} attendees.
              </div>
            )}

            <button type="submit" disabled={sending || !message.trim()} className="w-full inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer transition-colors">
              <Send size={15} /> {sending ? 'Sending...' : `Send ${channel === 'email' ? 'Email' : 'SMS'}`}
            </button>
          </form>
        </div>

        {/* Log */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-sand-200 shadow-sm">
          <div className="p-4 border-b border-sand-200">
            <h3 className="text-xs font-bold text-cocoa-700 uppercase">Send History</h3>
          </div>
          {logLoading ? (
            <p className="p-6 text-sm text-slate-400 text-center">Loading...</p>
          ) : log.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 text-center">No broadcasts sent yet for this edition.</p>
          ) : (
            <div className="divide-y divide-sand-100 max-h-[420px] overflow-y-auto">
              {log.map(entry => (
                <div key={entry.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${entry.channel === 'email' ? 'bg-teal-50 text-teal-700' : 'bg-coral-50 text-coral-700'}`}>
                      {entry.channel === 'email' ? <Mail size={10} /> : <MessageSquare size={10} />} {entry.channel}
                    </span>
                    <span className="text-[10px] text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                  {entry.subject && <p className="text-xs font-semibold text-cocoa-700">{entry.subject}</p>}
                  <p className="text-xs text-slate-500 line-clamp-2">{entry.message}</p>
                  <p className="text-[11px] text-slate-400">Sent to {entry.recipient_count} attendee{entry.recipient_count === 1 ? '' : 's'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
