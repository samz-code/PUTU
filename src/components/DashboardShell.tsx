import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X,
  ExternalLink,
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
  topRightContent?: React.ReactNode;
}

const SIDEBAR_COLLAPSE_KEY = 'ptv-admin-sidebar-collapsed';

export default function DashboardShell({
  title,
  subtitle = 'MANAGE BOOKINGS, CONTENT AND PARTNERS IN ONE PLACE',
  navItems,
  homePath,
  topRightContent,
}: DashboardShellProps) {
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex font-sans text-slate-800">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] ${sidebarWidth} bg-white border-r border-slate-200 flex flex-col transition-[width,transform] duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex items-center justify-center absolute -right-3 top-8 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-[#17b5b1] hover:border-[#17b5b1] shadow-md transition-colors z-10"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={13} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Brand */}
        <div
          className={`h-20 flex items-center border-b border-slate-200 shrink-0 ${
            collapsed ? 'justify-center px-2' : 'justify-between px-5'
          }`}
        >
          <Link to={homePath} className="flex items-center gap-2 min-w-0">
           <img
           src="/adminlogo.png"
           alt="Putu Travels"
           className={`object-contain transition-all duration-200 shrink-0 ${collapsed 
      ? 'h-10 w-10 mx-auto' 
      : 'h-14 sm:h-16 w-full max-w-[220px]'
  }`}
/>
          </Link>

          {!collapsed && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {Object.entries(groupedNav).map(([categoryName, items]) => (
            <div key={categoryName}>
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[11px] font-black uppercase tracking-wider text-[#4274d9]">
                  {categoryName.toUpperCase()}
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
                        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-[#17b5b1] text-white shadow-sm'
                          : 'text-slate-700 hover:bg-[#17b5b1]/10 hover:text-[#17b5b1]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Coral Active Line Accent */}
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-[#f26b5e]" />
                        )}
                        <item.icon
                          size={18}
                          strokeWidth={2.5}
                          className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#17b5b1]'}`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.badge !== undefined && (
                          <span
                            className={`ml-auto text-[10px] leading-none px-2 py-1 rounded-full font-black ${
                              isActive ? 'bg-white text-[#17b5b1]' : 'bg-[#f26b5e] text-white'
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

        {/* User Footer */}
        <div className={`border-t border-slate-200 shrink-0 ${collapsed ? 'p-2' : 'p-3'}`}>
          <div className={`flex items-center rounded-md ${collapsed ? 'justify-center' : 'justify-between px-1'}`}>
            <div className={`flex items-center min-w-0 ${collapsed ? '' : 'gap-2.5'}`}>
              <div className="w-8 h-8 rounded-full bg-[#17b5b1] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
                {userInitials}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase text-slate-900 truncate leading-tight">{userName}</div>
                  <div className="text-[10px] font-bold text-[#4274d9] uppercase flex items-center gap-1 leading-tight mt-0.5">
                    <ShieldCheck size={11} className="text-[#4274d9] shrink-0" />
                    <span className="truncate">{role || 'ADMINISTRATOR'}</span>
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-[#f26b5e] hover:bg-[#f26b5e]/10 rounded-md transition-colors shrink-0"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              onClick={handleSignOut}
              className="mt-1.5 w-full flex items-center justify-center p-2 text-slate-400 hover:text-[#f26b5e] hover:bg-[#f26b5e]/10 rounded-md transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className={`flex-1 flex flex-col h-full min-w-0 ${contentOffset} transition-[margin] duration-200 ease-out`}>
        {/* Sticky Header with Teal #17b5b1 */}
        <header className="bg-[#17b5b1] border-b border-[#17b5b1]/80 h-20 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 gap-3 shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-md border border-white/30 text-white hover:bg-white/10 transition-colors shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={19} strokeWidth={2.5} />
            </button>

            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-teal-100 mb-0.5">
                <Link to={homePath} className="hover:text-white transition-colors">
                  CONTROL PANEL
                </Link>
                <ChevronRight size={12} strokeWidth={3} />
                <span className="text-white/80">{title}</span>
              </div>
              <h1 className="text-base sm:text-lg font-black uppercase text-white leading-tight truncate tracking-wide">
                {subtitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Real-time Notifications Component */}
            {topRightContent && (
              <div className="relative flex items-center justify-center rounded-lg bg-white p-1 text-[#17b5b1] shadow-sm border border-slate-100">
                {topRightContent}
              </div>
            )}

            {/* View Site Action CTA Button in Coral #f26b5e */}
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs font-black uppercase text-white bg-[#f26b5e] hover:bg-[#d95346] px-3.5 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <span>VIEW SITE</span>
              <ExternalLink size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm min-h-[calc(100vh-140px)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}