import { useEffect, useState, useRef } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Message {
  id: string;
  sender_role: string;
  body: string;
  created_at: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`messages:${user.id}`);

    supabase.from('messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).then(({ data, error }) => {
      if (error) setError('Unable to load messages.');
      else setMessages((data as Message[]) ?? []);
      setLoading(false);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
      (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !input.trim() || sending) return;
    setSending(true);
    const body = input.trim();
    setInput('');
    const { error } = await supabase.from('messages').insert({ user_id: user.id, sender_role: 'customer', body });
    if (error) setError('Failed to send message. Please try again.');
    setSending(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <PageHeader title="Messages" subtitle="Chat with your concierge in real time" />
      {error && (
        <div className="flex items-center gap-2 text-coral-600 mb-4 text-base">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      <div className="card-md flex flex-col" style={{ height: '60vh' }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <p className="text-base text-slate-400">Loading...</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-base text-slate-500">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender_role === 'customer' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-lg text-base ${m.sender_role === 'customer' ? 'bg-coral-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {m.body}
                </div>
                <span className="text-xs text-slate-400 mt-1 px-1">{formatTime(m.created_at)}</span>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="border-t border-slate-100 p-3 flex gap-2">
          <input className="input flex-1" placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} disabled={sending} />
          <button type="submit" className="btn-primary px-4" disabled={sending}><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
}
