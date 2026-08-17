import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Plane, FileText, CreditCard, FolderOpen, MessageSquare,
  Bell, Heart, User, LogOut, Plus, Menu, X,
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

export default function PortalLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navList = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setDrawerOpen(false)}
          className={({ isActive }) => (isActive ? 'sidebar-link-active' : 'sidebar-link')}
        >
          <item.icon size={18} /> {item.label}
          {item.to === '/portal/notifications' && unreadCount > 0 && (
            <span className="ml-auto bg-coral-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const sidebarFooter = (
    <div className="border-t border-sand-200 p-3">
      <div className="px-3 py-2 mb-2">
        <div className="text-xs text-slate-400 font-medium">Signed in as</div>
        <div className="text-sm font-semibold text-slate-700 truncate">{user?.email}</div>
      </div>
      <button onClick={handleSignOut} className="sidebar-link w-full text-left">
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-sand-50 flex w-full max-w-full overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-sand-200 fixed h-screen shrink-0">
        <Link to="/" className="flex items-center justify-center px-6 h-28 border-b border-sand-200 bg-white">
          <img 
            src="/customerportallogo.png" 
            alt="Customer Portal Logo" 
            className="h-20 w-auto object-contain" 
          />
        </Link>
        <div className="px-3 py-4 border-b border-sand-200">
          <Link to="/planner" className="btn-primary w-full text-sm">
            <Plus size={16} /> Plan New Journey
          </Link>
        </div>
        {navList}
        {sidebarFooter}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-cocoa-900/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 h-24 sm:h-28 border-b border-sand-200">
              <Link to="/" className="flex items-center justify-center min-w-0" onClick={() => setDrawerOpen(false)}>
                <img 
                  src="/customerportallogo.png" 
                  alt="Customer Portal Logo" 
                  className="h-16 sm:h-20 w-auto object-contain" 
                />
              </Link>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-slate-500 hover:text-cocoa-700 shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="px-3 py-3 border-b border-sand-200">
              <Link to="/planner" className="btn-primary w-full text-sm" onClick={() => setDrawerOpen(false)}>
                <Plus size={16} /> Plan New Journey
              </Link>
            </div>
            {navList}
            {sidebarFooter}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      {/* min-w-0 is the critical fix: without it, a flex item won't shrink below its
          content's intrinsic width, so wide children push this column past 100vw
          and clip/shift everything on mobile. */}
      <div className="flex-1 min-w-0 w-full lg:ml-72">
        <header className="lg:hidden bg-white border-b border-sand-200 h-16 sm:h-20 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-30">
          <button onClick={() => setDrawerOpen(true)} className="p-2 text-cocoa-700 shrink-0" aria-label="Open menu">
            <Menu size={22} />
          </button>
          <Link to="/" className="flex items-center min-w-0">
            <img 
              src="/customerportallogo.png" 
              alt="Customer Portal Logo" 
              className="h-10 sm:h-14 w-auto object-contain" 
            />
          </Link>
          <Link to="/portal/notifications" className="relative p-2 shrink-0">
            <Bell size={20} className="text-cocoa-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-coral-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>
        </header>
        <main className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 lg:p-8 lg:max-w-5xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}