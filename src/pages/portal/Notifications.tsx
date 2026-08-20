import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  Bell,
  CheckCheck,
  Trash2,
  Check,
  ExternalLink,
  MessageSquare,
  FileText,
  CreditCard,
  Info,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

type FilterTab = 'all' | 'unread' | 'read';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Realtime channel for live updates
    const channel = supabase
      .channel(`notifications-page-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    setActionId(id);
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
    setActionId(null);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    setActionId(id);
    const { error } = await supabase.from('notifications').delete().eq('id', id);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
    setActionId(null);
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.is_read;
    if (filter === 'read') return item.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message_received':
      case 'messaging':
        return <MessageSquare className="w-5 h-5 text-coral-500" />;
      case 'booking':
        return <FileText className="w-5 h-5 text-amber-500" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-cocoa-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-900">Notifications</h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1">
          Your real-time updates, messaging alerts, itinerary changes, and concierge updates
        </p>
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="inline-flex bg-sand-100 p-1 rounded-xl border border-sand-200 self-start">
          {(['all', 'unread', 'read'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all capitalize ${
                filter === tab
                  ? 'bg-white text-cocoa-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-cocoa-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-coral-600 hover:text-coral-700 transition-colors self-end sm:self-auto px-2 py-1"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-sand-200 p-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-coral-500" />
          <p className="text-sm">Fetching notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-sand-200 p-8 sm:p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-sand-100 flex items-center justify-center mb-4 text-slate-400 border border-sand-200">
            <Bell size={24} />
          </div>
          <h3 className="font-serif text-lg font-semibold text-cocoa-900 mb-1">
            {filter === 'all'
              ? 'No notifications yet'
              : filter === 'unread'
              ? 'No unread notifications'
              : 'No read notifications'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            We'll notify you as soon as your messages, booking status, payments, or vouchers update.
          </p>
        </div>
      ) : (
        /* Notification Items List */
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`group relative bg-white rounded-xl border p-4 sm:p-5 transition-all shadow-sm flex gap-4 items-start ${
                !item.is_read ? 'border-coral-200 bg-coral-50/20' : 'border-sand-200 hover:border-sand-300'
              }`}
            >
              {/* Type Icon */}
              <div className="p-2.5 rounded-xl bg-sand-100 border border-sand-200 shrink-0">
                {getNotificationIcon(item.type)}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 pr-12 sm:pr-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm sm:text-base font-semibold text-cocoa-900 truncate">
                    {item.title}
                  </h4>
                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-coral-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words mb-2">
                  {item.body}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span>{formatDate(item.created_at)}</span>
                  {item.link && (
                    <Link
                      to={item.link}
                      className="inline-flex items-center gap-1 text-coral-600 hover:underline font-medium"
                    >
                      View details <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 sm:static flex items-center gap-1 shrink-0">
                {!item.is_read && (
                  <button
                    onClick={() => markAsRead(item.id)}
                    disabled={actionId === item.id}
                    title="Mark as read"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(item.id)}
                  disabled={actionId === item.id}
                  title="Delete notification"
                  className="p-1.5 text-slate-400 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-colors"
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