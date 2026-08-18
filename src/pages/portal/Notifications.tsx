import { useEffect, useState, useCallback } from 'react';
import { 
  Bell, 
  Trash2, 
  AlertCircle, 
  Check, 
  Calendar, 
  CreditCard, 
  FileText, 
  Compass, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Notif {
  id: string;
  user_id: string;
  type: 'booking' | 'payment' | 'document' | 'trip' | 'experience' | 'system' | 'partner_alert' | string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Read'>('All');

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setItems((data as Notif[]) ?? []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();

    // Realtime subscription so incoming alerts show up instantly on this page too
    const channel = supabase
      .channel(`notifications_page_${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          setItems((prev) => [payload.new as Notif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadNotifications]);

  const markRead = async (id: string) => {
    // Optimistic UI update
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));

    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) console.error('Failed to mark read:', error);
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    // Optimistic UI update
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) console.error('Failed to mark all read:', error);
  };

  const deleteNotif = async (id: string) => {
    // Optimistic UI update
    setItems((prev) => prev.filter((n) => n.id !== id));

    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) console.error('Failed to delete notification:', error);
  };

  const getIconForType = (type: string, isRead: boolean) => {
    const iconClass = isRead ? 'text-slate-400' : 'text-[#0F766E]';
    if (type.includes('booking') || type.includes('trip')) return <Calendar size={16} className={iconClass} />;
    if (type.includes('payment')) return <CreditCard size={16} className={iconClass} />;
    if (type.includes('document')) return <FileText size={16} className={iconClass} />;
    if (type.includes('experience')) return <Compass size={16} className={iconClass} />;
    if (type.includes('partner')) return <ShieldCheck size={16} className={iconClass} />;
    return <Bell size={16} className={iconClass} />;
  };

  const filtered = items.filter((n) => {
    if (filter === 'Unread') return !n.is_read;
    if (filter === 'Read') return n.is_read;
    return true;
  });

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Notifications"
        subtitle="Your real-time alerts, bookings, and updates"
        action={
          unreadCount > 0 ? (
            <button 
              onClick={markAllRead} 
              className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#EBE5DF] text-[#0F766E] text-xs font-bold hover:bg-[#EBE5DF]/50 transition-all cursor-pointer shadow-2xs"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b border-[#F5F0EB] pb-4">
        {(['All', 'Unread', 'Read'] as const).map((tab) => {
          const tabCount = tab === 'Unread' ? unreadCount : tab === 'Read' ? items.length - unreadCount : items.length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === tab 
                  ? 'bg-[#0F766E] text-white shadow-sm' 
                  : 'bg-white border border-[#EBE5DF] text-slate-600 hover:bg-[#FAF8F5]'
              }`}
            >
              {tab} {tabCount > 0 ? `(${tabCount})` : ''}
            </button>
          );
        })}
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#0F766E]" />
          <span>Loading notifications...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-[#991B1B]">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#EBE5DF] rounded-3xl p-16 text-center shadow-xs">
          <div className="w-16 h-16 bg-[#FAF8F5] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#EBE5DF]">
            <Bell size={28} className="text-slate-300" />
          </div>
          <p className="font-serif font-bold text-base text-[#332219] mb-1">
            {items.length === 0 ? 'No notifications yet' : `No ${filter.toLowerCase()} notifications`}
          </p>
          <p className="text-xs text-slate-400">
            {items.length === 0 ? "We'll notify you when bookings, payments, or updates occur." : "You're all caught up in this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div 
              key={n.id} 
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                !n.is_read 
                  ? 'bg-[#E6F4F1]/20 border-[#0F766E]/30 shadow-2xs' 
                  : 'bg-white border-[#EBE5DF] hover:border-slate-300'
              }`}
            >
              {/* Type Icon Container */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                !n.is_read ? 'bg-[#E6F4F1] border-[#0F766E]/20' : 'bg-[#FAF8F5] border-[#EBE5DF]'
              }`}>
                {getIconForType(n.type, n.is_read)}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#0F766E] border border-[#EBE5DF]">
                    {n.type.replace('_', ' ')}
                  </span>
                  <h3 className="font-serif font-bold text-sm text-[#332219]">{n.title}</h3>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#F55361] shrink-0" />}
                </div>

                {n.body && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                    {n.body}
                  </p>
                )}

                <p className="text-[11px] text-slate-400 font-medium">
                  {new Date(n.created_at).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {!n.is_read && (
                  <button 
                    onClick={() => markRead(n.id)} 
                    className="p-2 text-slate-400 hover:text-[#0F766E] hover:bg-[#FAF8F5] rounded-xl transition-all cursor-pointer border border-transparent hover:border-[#EBE5DF]"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotif(n.id)} 
                  className="p-2 text-slate-400 hover:text-[#F55361] hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                  title="Delete notification"
                >
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