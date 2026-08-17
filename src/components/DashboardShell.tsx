import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, ExternalLink, Bell, ChevronRight, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: string | number;
  category?: string;
  badgeColor?: string;
}

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  homePath: string;
}

export default function DashboardShell({
  title,
  subtitle = "Operations & Management Portal",
  navItems,
  homePath,
}: DashboardShellProps) {
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'AD';

  const groupedNav = navItems.reduce((acc, item) => {
    const category = item.category || 'Main Menu';
    if (!acc[category]) {
      acc[category] = {
        badgeColor: item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200',
        items: []
      };
    }
    acc[category].items.push(item);
    return acc;
  }, {} as Record<string, { badgeColor: string; items: NavItem[] }>);

  return (
    <div className="min-h-screen bg-sand-50 flex font-sans antialiased text-slate-800">

      {/* Mobile Backdrop Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px] lg:w-80 bg-white border-r border-sand-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 sm:h-24 px-5 sm:px-7 border-b-2 border-sand-200 flex items-center justify-between bg-white shrink-0">
          <Link to={homePath} className="flex items-center gap-2 group py-2">
            <img
              src="/logo.png"
              alt="Brand Logo"
              className="h-12 sm:h-14 w-auto object-contain max-w-[170px] transition-transform duration-150 group-hover:scale-105"
            />
          </Link>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-2.5 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-sand-100 active:scale-95 transition-all"
            aria-label="Close Sidebar"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation Items List Grouped by Category (Cards) */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-5 space-y-4 custom-scrollbar">
          {Object.entries(groupedNav).map(([categoryName, group]) => (
            <div
              key={categoryName}
              className="bg-white border-2 border-sand-200 rounded-2xl p-2.5 shadow-sm"
            >
              <div className="px-2 pb-2 pt-1">
                <span className={`inline-block text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-sm ${group.badgeColor}`}>
                  {categoryName}
                </span>
              </div>

              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-bold transition-all duration-150 ${
                        isActive
                          ? 'bg-cocoa-900 text-white shadow-md'
                          : 'text-slate-700 hover:bg-sand-100 active:bg-sand-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <item.icon
                            size={22}
                            strokeWidth={2.25}
                            className={`transition-colors shrink-0 ${
                              isActive ? 'text-coral-300' : 'text-slate-400 group-hover:text-cocoa-700'
                            }`}
                          />
                          <span className="leading-tight">{item.label}</span>
                        </div>

                        {item.badge !== undefined && (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-black shrink-0 ${
                            isActive
                              ? 'bg-coral-500 text-white'
                              : 'bg-sand-200 text-slate-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* User Account & Role Card */}
        <div className="p-3 sm:p-4 border-t-2 border-sand-200 bg-sand-50 shrink-0">
          <div className="p-3.5 bg-white border-2 border-sand-200 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-cocoa-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-cocoa-900 truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-[11px] text-slate-500 capitalize truncate flex items-center gap-1 font-bold">
                  <ShieldCheck size={13} className="text-coral-500 shrink-0" />
                  {role || 'Administrator'}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2.5 text-slate-400 hover:text-coral-600 hover:bg-coral-50 rounded-xl transition-colors active:scale-95"
              title="Sign Out"
            >
              <LogOut size={19} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-80">

        {/* Header Bar */}
        <header className="bg-white border-b-2 border-sand-200 min-h-[72px] sm:h-24 px-3 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              className="lg:hidden p-2.5 rounded-xl border-2 border-sand-200 text-slate-700 hover:bg-sand-100 active:scale-95 transition-all shrink-0"
              onClick={() => setOpen(true)}
              aria-label="Open Menu"
            >
              <Menu size={22} strokeWidth={2.5} />
            </button>

            {/* Breadcrumb Context */}
            <div className="flex flex-col min-w-0">
              <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 font-bold">
                <Link to={homePath} className="hover:text-cocoa-700 transition-colors">Control Panel</Link>
                <ChevronRight size={11} />
                <span className="text-slate-600">{title}</span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-black text-cocoa-900 leading-tight truncate">
                {subtitle}
              </h1>
            </div>
          </div>

          {/* Quick Header Navigation Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/"
              target="_blank"
              className="hidden md:flex items-center gap-1.5 text-sm font-black text-slate-700 hover:text-coral-600 bg-sand-100 hover:bg-sand-200/70 px-4 py-2.5 rounded-xl transition-colors border-2 border-sand-200"
            >
              <span>View Website</span>
              <ExternalLink size={15} />
            </Link>

            <button
              className="relative p-2.5 sm:p-3 text-slate-600 hover:text-cocoa-800 hover:bg-sand-100 rounded-xl transition-colors border-2 border-sand-200 active:scale-95"
              aria-label="Notifications"
            >
              <Bell size={20} strokeWidth={2.25} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-coral-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* Page Content Slot */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="bg-white border-2 border-sand-200 rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 min-h-[60vh]">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}