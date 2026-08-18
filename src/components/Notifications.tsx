import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead as dbMarkAllAsRead,
  deleteNotification,
  DBNotification,
} from '@/services/notificationService';
import { supabase } from '@/lib/supabase';

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications and subscribe to realtime inserts
  useEffect(() => {
    loadData();

    // Setup Supabase Realtime listener
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          loadData(); // Refresh list on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    // Optimistic UI update
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    await dbMarkAllAsRead();
  };

  const handleItemClick = async (item: DBNotification) => {
    if (!item.is_read) {
      setNotifications(
        notifications.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      await markAsRead(item.id);
    }
    if (item.link) {
      setIsOpen(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic UI update
    setNotifications(notifications.filter((n) => n.id !== id));
    await deleteNotification(id);
  };

  // Helper to format time relative or short date
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative inline-block text-left">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2.5 text-slate-500 hover:text-cocoa-800 hover:bg-sand-100 rounded-lg border border-sand-200 transition-colors focus:outline-none cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
          }}
          className="fixed w-80 sm:w-96 bg-white border border-sand-200 rounded-xl shadow-2xl z-[9999] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-sand-50 border-b border-sand-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] bg-coral-100 text-coral-700 font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                title="Refresh notifications"
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-cocoa-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Check size={13} />
                  Mark read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-sand-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                {loading ? 'Loading...' : 'No notifications right now'}
              </div>
            ) : (
              notifications.map((item) => {
                const content = (
                  <div
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 transition-colors hover:bg-sand-50 flex items-start gap-3 relative group cursor-pointer ${
                      !item.is_read ? 'bg-sand-50/60' : ''
                    }`}
                  >
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-coral-500 mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                      {item.link && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-coral-600 hover:text-coral-700 mt-1.5">
                          <span>View details</span>
                          <ExternalLink size={11} />
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-opacity cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );

                return item.link ? (
                  <Link key={item.id} to={item.link} onClick={() => setIsOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-sand-50 border-t border-sand-200 text-center">
            <Link
              to="/admin/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-cocoa-800 hover:underline block"
            >
              View all system alerts
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}