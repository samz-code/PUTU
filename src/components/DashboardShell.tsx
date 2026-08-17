import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X,
  ExternalLink,
  Bell,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
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

const SIDEBAR_COLLAPSE_KEY = 'ptv-admin-sidebar-collapsed';

export default function DashboardShell({
  title,
  subtitle = 'Manage bookings, content and partners in one place',
  navItems,
  homePath,
}: DashboardShellProps) {
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore collapse preference (desktop only feature, safe to read on mount)
  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
    if (stored === '1') setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'AD';
  const userName = user?.email?.split('@')[0] || 'User';

  const groupedNav = navItems.reduce((acc, item) => {
    const category = item.category || 'Menu';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const sidebarWidth = collapsed ? 'lg:w-[76px]' : 'lg:w-[264px]';
  const contentOffset = collapsed ? 'lg:ml-[76px]' : 'lg:ml-[264px]';

  return (
    <div className="min-h-screen bg-sand-50 flex font-sans text-slate-800">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] ${sidebarWidth} bg-white border-r border-sand-200 flex flex-col transition-[width,transform] duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex items-center justify-center absolute -right-3 top-8 w-6 h-6 rounded-full bg-white border border-sand-300 text-slate-500 hover:text-cocoa-800 hover:border-cocoa-300 shadow-sm transition-colors z-10"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={13} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Brand */}
        <div
          className={`h-20 flex items-center border-b border-sand-200 shrink-0 ${
            collapsed ? 'justify-center px-2' : 'justify-between px-5'
          }`}
        >
          <Link to={homePath} className="flex items-center gap-2 min-w-0">
            <img
              src="/logo.png"
              alt="Putu Travels"
              className={`object-contain shrink-0 ${collapsed ? 'h-11 w-11' : 'h-14 w-auto max-w-[190px]'}`}
            />
          </Link>

          {!collapsed && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-sand-100 transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {Object.entries(groupedNav).map(([categoryName, items]) => (
            <div key={categoryName}>
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {categoryName}
                </div>
              )}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center rounded-md text-sm font-medium transition-colors ${
                        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'
                      } ${
                        isActive
                          ? 'bg-cocoa-50 text-cocoa-900'
                          : 'text-slate-600 hover:bg-sand-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-coral-500" />
                        )}
                        <item.icon
                          size={18}
                          strokeWidth={2}
                          className={`shrink-0 ${isActive ? 'text-coral-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.badge !== undefined && (
                          <span
                            className={`ml-auto text-[11px] leading-none px-1.5 py-1 rounded-full font-semibold ${
                              isActive ? 'bg-coral-100 text-coral-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
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
        </nav>

        {/* User */}
        <div className={`border-t border-sand-200 shrink-0 ${collapsed ? 'p-2' : 'p-3'}`}>
          <div className={`flex items-center rounded-md ${collapsed ? 'justify-center' : 'justify-between px-1'}`}>
            <div className={`flex items-center min-w-0 ${collapsed ? '' : 'gap-2.5'}`}>
              <div className="w-8 h-8 rounded-full bg-cocoa-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate leading-tight">{userName}</div>
                  <div className="text-[11px] text-slate-500 capitalize flex items-center gap-1 leading-tight">
                    <ShieldCheck size={11} className="text-coral-500 shrink-0" />
                    <span className="truncate">{role || 'Administrator'}</span>
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-coral-600 hover:bg-coral-50 rounded-md transition-colors shrink-0"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} strokeWidth={2} />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              onClick={handleSignOut}
              className="mt-1.5 w-full flex items-center justify-center p-2 text-slate-400 hover:text-coral-600 hover:bg-coral-50 rounded-md transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col min-w-0 ${contentOffset} transition-[margin] duration-200 ease-out`}>
        {/* Header */}
        <header className="bg-white border-b border-sand-200 h-20 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-md border border-sand-200 text-slate-600 hover:bg-sand-100 transition-colors shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={19} strokeWidth={2} />
            </button>

            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 font-medium mb-0.5">
                <Link to={homePath} className="hover:text-cocoa-700 transition-colors">
                  Control Panel
                </Link>
                <ChevronRight size={12} />
                <span className="text-slate-500">{title}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-cocoa-900 leading-tight truncate">
                {subtitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-cocoa-800 px-3 py-2 rounded-md border border-sand-200 hover:bg-sand-100 transition-colors"
            >
              <span>View site</span>
              <ExternalLink size={14} />
            </Link>

            <button
              className="relative p-2 text-slate-500 hover:text-cocoa-800 hover:bg-sand-100 rounded-md border border-sand-200 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="bg-white border border-sand-200 rounded-lg p-4 sm:p-6 lg:p-8 min-h-[60vh]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}