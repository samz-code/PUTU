import { useEffect, useState, useCallback } from 'react';
import { 
  Bell, 
  Trash2, 
  AlertCircle, 
  Check, 
  Filter, 
  Send, 
  ShieldCheck, 
  UserCheck, 
  CreditCard, 
  Calendar, 
  Compass, 
  Loader2,
  Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Notif {
  id: string;
  user_id: string;
  type: 'booking' | 'payment' | 'signup' | 'experience' | 'system' | 'partner_alert';
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export default function AdminNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unread' | 'Read'>('All');

  // Broadcast / Custom Notification Modal State
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastType, setBroadcastType] = useState<Notif['type']>('system');
  const [targetUserId, setTargetUserId] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Admins fetch all system notifications for oversight
      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setItems((data as Notif[]) || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load system notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Realtime subscription for incoming system events
    const channel = supabase
      .channel('admin_notifications_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setItems((prev) => [payload.new as Notif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !user) return;

    setSendingBroadcast(true);
    try {
      const { error: insertErr } = await supabase.from('notifications').insert({
        user_id: targetUserId.trim() || user.id, // Fallback to current admin if blank, or specific recipient
        type: broadcastType,
        title: broadcastTitle.trim(),
        body: broadcastBody.trim() || null,
      });

      if (insertErr) throw insertErr;

      setIsBroadcastOpen(false);
      setBroadcastTitle('');
      setBroadcastBody('');
      loadNotifications();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch notification.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Icon mapping based on notification type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar size={16} className="text-teal-600" />;
      case 'payment': return <CreditCard size={16} className="text-emerald-600" />;
      case 'signup': return <UserCheck size={16} className="text-blue-600" />;
      case 'experience': return <Compass size={16} className="text-amber-600" />;
      case 'partner_alert': return <ShieldCheck size={16} className="text-purple-600" />;
      default: return <Bell size={16} className="text-slate-500" />;
    }
  };

  const filtered = items.filter((n) => {
    if (typeFilter !== 'All' && n.type !== typeFilter) return false;
    if (statusFilter === 'Unread' && n.is_read) return false;
    if (statusFilter === 'Read' && !n.is_read) return false;
    return true;
  });

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 text-[#332219]">
      <PageHeader
        title="System & Partner Alert Center"
        subtitle="Monitor bookings, transactions, driver/guide dispatches, hotel updates, and customer sign-ups"
        action={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="px-3 py-2 bg-white border border-[#EBE5DF] text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-2xs">
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsBroadcastOpen(true)}
              className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#0d645e] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus size={14} />
              <span>Trigger Alert</span>
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#EBE5DF] shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter size={12} /> Category:
          </span>
          {['All', 'booking', 'payment', 'signup', 'experience', 'partner_alert', 'system'].map((cat) => (
            <button
              key={cat}
              onClick={() => setTypeFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                typeFilter === cat
                  ? 'bg-[#0F766E] text-white shadow-2xs'
                  : 'bg-[#FAF8F5] text-slate-600 hover:bg-[#EBE5DF]/50'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EBE5DF]">
          {(['All', 'Unread', 'Read'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab ? 'bg-white text-[#332219] shadow-2xs' : 'text-slate-500 hover:text-[#332219]'
              }`}
            >
              {tab} {tab === 'Unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-[#0F766E]" />
          <span>Loading system activity stream...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EBE5DF] p-12 text-center space-y-2 shadow-2xs">
          <Bell size={36} className="mx-auto text-slate-300 mb-1" />
          <p className="font-serif font-bold text-sm text-[#332219]">No notifications found</p>
          <p className="text-xs text-slate-400">All caught up across drivers, guides, hotels, and customer transactions.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border p-4 flex items-start gap-3.5 transition-all shadow-2xs ${
                !n.is_read ? 'border-l-4 border-l-[#0F766E] border-[#EBE5DF]' : 'border-[#EBE5DF]/70 opacity-85'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-[#E6F4F1]' : 'bg-[#FAF8F5]'}`}>
                {getTypeIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#0F766E] border border-[#EBE5DF]">
                    {n.type.replace('_', ' ')}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#332219] truncate">{n.title}</h4>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#F55361] shrink-0" />}
                </div>
                {n.body && <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{n.body}</p>}
                <p className="text-[11px] text-slate-400 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="p-1.5 text-slate-400 hover:text-[#0F766E] hover:bg-[#E6F4F1] rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotif(n.id)}
                  className="p-1.5 text-slate-400 hover:text-[#F55361] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                  title="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Trigger Manual Notification / Broadcast */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#EBE5DF]">
            <div className="flex items-center justify-between border-b border-[#F5F0EB] pb-3">
              <h3 className="font-serif font-bold text-base text-[#332219]">Dispatch System Alert</h3>
              <button onClick={() => setIsBroadcastOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#332219] mb-1">Alert Category</label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as Notif['type'])}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EBE5DF] rounded-xl focus:ring-1 focus:ring-[#0F766E]"
                >
                  <option value="booking">Booking / Tour Dispatch</option>
                  <option value="payment">Transaction / Payment</option>
                  <option value="signup">Customer / Partner Sign-up</option>
                  <option value="experience">Experience Update</option>
                  <option value="partner_alert">Partner Alert (Drivers, Guides, Hotels)</option>
                  <option value="system">General System Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332219] mb-1">Target User ID (Leave blank for self/admin)</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="UUID of user, driver, guide, or hotel partner..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EBE5DF] rounded-xl focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332219] mb-1">Alert Title</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g., New Safari Booking Assigned to Driver"
                  required
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EBE5DF] rounded-xl focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332219] mb-1">Message Details</label>
                <textarea
                  rows={3}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Include itinerary details, pickup times, or transaction amount..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EBE5DF] rounded-xl focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingBroadcast || !broadcastTitle.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-[#0F766E] hover:bg-[#0d645e] text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
                >
                  {sendingBroadcast && <Loader2 size={14} className="animate-spin" />}
                  <Send size={14} />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}