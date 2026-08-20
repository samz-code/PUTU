import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Plane, FileText, CreditCard, FolderOpen, MessageSquare,
  Bell, Heart, User, LogOut, Menu, X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const navItems = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/trips', label: 'Upcoming Trips', icon: Plane },
  { to: '/portal/bookings', label: 'Booking Status', icon: FileText },
  { to: '/portal/itineraries', label: 'Saved Itineraries', icon: FolderOpen },
  { to: '/portal/payments', label: 'Payment History', icon: CreditCard },
  { to: '/portal/documents', label: 'Travel Documents', icon: FolderOpen },
  { to: '/portal/messages', label: 'Messages', icon: MessageSquare },
  { to: '/portal/notifications', label: 'Notifications', icon: Bell },
  { to: '/portal/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/portal/profile', label: 'Profile', icon: User },
];

interface SidebarContentProps {
  unreadCount: number;
  onNavigate?: () => void;
  onSignOut: () => void;
  userEmail?: string | null;
}

function SidebarNav({ unreadCount, onNavigate }: Pick<SidebarContentProps, 'unreadCount' | 'onNavigate'>) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'sidebar-link-active' : 'sidebar-link')}
        >
          <item.icon size={18} /> {item.label}
          {item.to === '/portal/notifications' && unreadCount > 0 && (
            <span className="ml-auto bg-coral-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter({ userEmail, onSignOut }: Pick<SidebarContentProps, 'userEmail' | 'onSignOut'>) {
  return (
    <div className="border-t border-sand-200 p-3">
      <div className="px-3 py-2 mb-2">
        <div className="text-xs text-slate-400 font-medium">Signed in as</div>
        <div className="text-sm font-semibold text-slate-700 truncate">{userEmail}</div>
      </div>
      <button onClick={onSignOut} className="sidebar-link w-full text-left">
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
}

export default function PortalLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const loadUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!cancelled && !error) {
        setUnreadCount(count ?? 0);
      }
    };

    loadUnreadCount();

    const channel = supabase
      .channel(`notifications-badge-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  return (
    /* Removed overflow-x-hidden from main container so position: sticky on header elements works correctly */
    <div className="min-h-screen bg-sand-50 flex w-full max-w-full">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-sand-200 fixed h-screen shrink-0 z-40">
        <Link to="/" className="flex items-center justify-center px-6 h-28 border-b border-sand-200 bg-white">
          <img
            src="/customerlogo.png"
            alt="Customer Portal Logo"
            className="h-20 w-auto object-contain"
          />
        </Link>
        <SidebarNav unreadCount={unreadCount} />
        <SidebarFooter userEmail={user?.email} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-cocoa-900/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 h-24 sm:h-28 border-b border-sand-200">
              <Link
                to="/"
                className="flex items-center justify-center min-w-0"
                onClick={() => setDrawerOpen(false)}
              >
                <img
                  src="/customerlogo.png"
                  alt="Customer Portal Logo"
                  className="h-16 sm:h-20 w-auto object-contain"
                />
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-slate-500 hover:text-cocoa-700 shrink-0"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarNav unreadCount={unreadCount} onNavigate={() => setDrawerOpen(false)} />
            <SidebarFooter userEmail={user?.email} onSignOut={handleSignOut} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 w-full lg:ml-72">
        {/* Desktop header — sticky top-0 */}
        <header className="hidden lg:flex items-center justify-end h-16 px-6 xl:px-10 border-b border-sand-200 bg-white sticky top-0 z-30">
          <Link
            to="/portal/notifications"
            className="relative p-2 rounded-lg text-cocoa-700 hover:bg-sand-50 transition-colors"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-coral-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </header>

        {/* Mobile header — sticky top-0 */}
        <header className="lg:hidden bg-white border-b border-sand-200 h-16 sm:h-20 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-30">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-cocoa-700 shrink-0"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="flex items-center min-w-0">
            <img
              src="/customerlogo.png"
              alt="Customer Portal Logo"
              className="h-11 sm:h-14 w-auto object-contain"
            />
          </Link>
          <Link to="/portal/notifications" className="relative p-2 shrink-0" aria-label="Notifications">
            <Bell size={20} className="text-cocoa-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-coral-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </header>

        <main className="w-full max-w-[1600px] mx-auto p-3 sm:p-6 lg:p-8 xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}