import { useEffect, useState } from 'react';
import { Bell, Trash2, AlertCircle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIcon = (type: string) => {
  if (type.includes('booking') || type.includes('trip')) return 'plane';
  if (type.includes('payment')) return 'card';
  if (type.includes('document')) return 'doc';
  return 'bell';
};

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  const load = () => {
    if (!user) return;
    supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError('Unable to load notifications.');
      else setItems((data as Notif[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [user]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAll = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = items.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.is_read;
    if (filter === 'Read') return n.is_read;
    return true;
  });

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Your alerts and updates"
        action={unreadCount > 0 ? <button onClick={markAll} className="btn-secondary text-sm">Mark all read</button> : undefined}
      />

      <div className="mb-4 flex gap-2">
        {['All', 'Unread', 'Read'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === tab ? 'bg-coral-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-sand-100'}`}
          >
            {tab}{tab === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-base text-slate-400">Loading...</p>
      ) : error ? (
        <div className="flex items-center gap-2 text-coral-600">
          <AlertCircle size={18} /><span className="text-base">{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Bell size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-base text-slate-500">{items.length === 0 ? 'No notifications.' : 'No notifications in this filter.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div key={n.id} className={`card p-4 flex items-start gap-3 ${!n.is_read ? 'border-coral-200' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-coral-50' : 'bg-slate-100'}`}>
                <Bell size={15} className={!n.is_read ? 'text-coral-600' : 'text-slate-400'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-cocoa-700">{n.title}</span>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-coral-500" />}
                </div>
                {n.body && <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>}
                <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="p-1 text-slate-400 hover:text-teal-600 transition-colors" title="Mark read">
                    <Check size={16} />
                  </button>
                )}
                <button onClick={() => deleteNotif(n.id)} className="p-1 text-slate-400 hover:text-coral-600 transition-colors" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
