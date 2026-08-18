import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Bell, 
  Trash2, 
  AlertCircle, 
  Check, 
  Calendar, 
  CreditCard, 
  UserCheck, 
  Compass, 
  ShieldCheck, 
  Loader2, 
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface Notif {
  id: string;
  user_id: string;
  type: 'booking' | 'payment' | 'signup' | 'experience' | 'system' | 'partner_alert';
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside on desktop/mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setItems((data as Notif[]) || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();

    // Realtime subscription for incoming notifications
    if (!user) return;
    const channel = supabase
      .channel(`notifications_user_${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: `notifications`, filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => [payload.new as Notif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications]);

  const markRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('notifications').delete().eq('id', id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar size={14} className="text-teal-600" />;
      case 'payment': return <CreditCard size={14} className="text-emerald-600" />;
      case 'signup': return <UserCheck size={14} className="text-blue-600" />;
      case 'experience': return <Compass size={14} className="text-amber-600" />;
      case 'partner_alert': return <ShieldCheck size={14} className="text-purple-600" />;
      default: return <Bell size={14} className="text-slate-500" />;
    }
  };

  const filteredItems = items.filter((n) => {
    if (filter === 'Unread') return !n.is_read;
    return true;
  });

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Top-Right Notification Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-[#0F766E] hover:bg-[#FAF8F5] border border-transparent hover:border-[#EBE5DF] transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
        aria-label="Toggle notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F55361] text-[10px] font-bold text-white shadow-2xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Responsive Dropdown Panel (Positioned Top Right) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-[#EBE5DF] z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-4 border-b border-[#F5F0EB] flex items-center justify-between bg-[#FAF8F5]/50">
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-[#332219]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E6F4F1] text-[#0F766E] text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  className="text-[11px] font-bold text-[#0F766E] hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Sub-bar */}
          <div className="px-4 py-2 border-b border-[#F5F0EB] flex items-center gap-2 bg-white">
            {(['All', 'Unread'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filter === tab 
                    ? 'bg-[#0F766E] text-white shadow-2xs' 
                    : 'bg-[#FAF8F5] text-slate-600 hover:bg-[#EBE5DF]/50'
                }`}
              >
                {tab} {tab === 'Unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
              </button>
            ))}
          </div>

          {/* Content List Area */}
          <div className="overflow-y-auto flex-1 divide-y divide-[#F5F0EB] max-h-[380px]">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin text-[#0F766E]" />
                <span>Loading alerts...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-[#991B1B] flex items-center justify-center gap-1.5">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-1">
                <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="font-serif font-bold text-xs text-[#332219]">No notifications found</p>
                <p className="text-[11px] text-slate-400">You're completely caught up on updates.</p>
              </div>
            ) : (
              filteredItems.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left ${
                    !n.is_read ? 'bg-[#E6F4F1]/30 hover:bg-[#E6F4F1]/60' : 'bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${!n.is_read ? 'bg-[#E6F4F1]' : 'bg-[#FAF8F5]'}`}>
                    {getTypeIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#0F766E] border border-[#EBE5DF]">
                        {n.type.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-[#332219] truncate">{n.title}</h4>
                      {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[#F55361] shrink-0 ml-auto" />}
                    </div>
                    {n.body && <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mt-0.5">{n.body}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {!n.is_read && (
                      <button
                        onClick={(e) => markRead(n.id, e)}
                        className="p-1 text-slate-400 hover:text-[#0F766E] rounded-lg transition-colors"
                        title="Mark read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteNotif(n.id, e)}
                      className="p-1 text-slate-400 hover:text-[#F55361] rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer summary */}
          <div className="p-2.5 bg-[#FAF8F5] border-t border-[#F5F0EB] text-center text-[10px] text-slate-400">
            Realtime updates active for customers, drivers, guides & partners
          </div>
        </div>
      )}
    </div>
  );
}