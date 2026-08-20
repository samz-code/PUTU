import { Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import TopBar from '@/components/TopBar';

const servicesLinks = [
  { to: '/experiences', label: 'Experiences', desc: 'Snorkeling, dhow cruises, island trips' },
  { to: '/accommodation', label: 'Accommodation', desc: 'Hotels, resorts, villas, boutiques' },
  { to: '/transfers', label: 'Private Transfers', desc: 'Sedans, SUVs, vans with trusted drivers' },
  { to: '/concierge', label: 'Concierge Services', desc: 'Dining, celebrations, special requests' },
];

const escapesAndPlannerLinks = [
  { to: '/planner', label: 'Curate My Coast', desc: 'Interactive multi-step custom trip planner' },
  { to: '/experiences', label: 'Curated Escapes', desc: 'Browse hand-crafted luxury packages' },
  { to: '/her-turn', label: 'Her Turn', desc: 'Exclusive women editions & events' },
  { to: '/destinations', label: 'Explore Coast', desc: 'Discover beaches, dining & hotspots' },
];

const discoverLinks = [
  { to: '/destinations', label: 'Destinations' },
  { to: '/journal', label: 'Journal & Stories' },
];

const companyLinks = [
  { to: '/about', label: 'About Us' },
  { to: '/partners', label: 'Partners' },
  { to: '/contact', label: 'Contact' },
];

function Dropdown({ label, children, width = 'min-w-[300px]' }: { label: string; children: React.ReactNode; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-slate-600 hover:text-cocoa-700 transition-colors duration-150 py-2"
      >
        {label}
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180 text-coral-600' : ''}`} />
        <span
          className={`pointer-events-none absolute left-0 -bottom-0.5 h-0.5 bg-coral-600 transition-all duration-200 ${
            open ? 'w-full' : 'w-0'
          }`}
        />
      </button>

      {open && (
        <div className={`absolute top-full left-0 pt-3 ${width} z-50`}>
          <div className="bg-white rounded-md border border-sand-200 shadow-card-lg overflow-hidden">
            <div className="flex h-1">
              <div className="w-1/2 bg-teal-600" />
              <div className="w-1/2 bg-coral-500" />
            </div>
            <div className="py-2">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownLink({
  to,
  label,
  desc,
  onClick,
}: {
  to: string;
  label: string;
  desc?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex flex-col px-4 py-2.5 hover:bg-sand-100 transition-colors duration-150"
    >
      <div className="text-sm font-bold uppercase tracking-wide text-cocoa-700">{label}</div>
      {desc && <div className="text-xs text-slate-400 mt-0.5 normal-case tracking-normal font-normal">{desc}</div>}
    </Link>
  );
}

function SimpleDropdownLink({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wide text-cocoa-700 hover:bg-sand-100 transition-colors duration-150"
    >
      <span className="w-1 h-1 rounded-full bg-teal-600" />
      {label}
    </Link>
  );
}

/** One reusable Login/Register (or Dashboard) block used on desktop and mobile */
function AuthButtons({
  user,
  dashboardPath,
  variant,
}: {
  user: unknown;
  dashboardPath: string;
  variant: 'desktop' | 'mobile';
}) {
  if (variant === 'desktop') {
    if (user) {
      return (
        <Link
          to={dashboardPath}
          className="rounded-md bg-coral-600 hover:bg-coral-700 text-white font-bold uppercase tracking-wide py-2.5 px-5 text-sm transition-colors duration-150 whitespace-nowrap"
        >
          Dashboard
        </Link>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="rounded-md border border-teal-700 text-teal-700 font-bold uppercase tracking-wide py-2.5 px-5 text-sm hover:bg-teal-50 transition-colors duration-150 whitespace-nowrap"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="rounded-md bg-coral-600 hover:bg-coral-700 text-white font-bold uppercase tracking-wide py-2.5 px-5 text-sm transition-colors duration-150 whitespace-nowrap"
        >
          Register
        </Link>
      </div>
    );
  }

  // mobile variant
  if (user) {
    return (
      <Link
        to={dashboardPath}
        className="block w-full text-center rounded-md bg-coral-600 text-white font-bold uppercase tracking-wide py-3 text-sm"
      >
        Dashboard
      </Link>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2.5 w-full">
      <Link
        to="/login"
        className="text-center rounded-md border border-teal-700 text-teal-700 font-bold uppercase tracking-wide py-3 text-sm whitespace-nowrap"
      >
        Login
      </Link>
      <Link
        to="/register"
        className="text-center rounded-md bg-coral-600 text-white font-bold uppercase tracking-wide py-3 text-sm whitespace-nowrap"
      >
        Register
      </Link>
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const dashboardPath =
    role === 'admin' ? '/admin' :
    role === 'hotel' ? '/partner/hotel' :
    role === 'restaurant' ? '/partner/restaurant' :
    role === 'driver' ? '/partner/driver' :
    role === 'guide' ? '/partner/guide' :
    '/portal';

  const mobileAccountPath = user ? dashboardPath : '/login';

  return (
    <header className={`sticky top-0 z-40 transition-shadow duration-300 ${scrolled ? 'shadow-[0_2px_12px_rgba(20,20,20,0.08)]' : ''}`}>
      <TopBar />

      <div className="bg-white">
        <div className="page-container">
          <div className="flex items-center justify-between h-20 sm:h-24 md:h-28 lg:h-32">
            <Link to="/" className="flex items-center flex-shrink-0 py-1 sm:py-2 min-w-0">
              <img
                src="/logo.png"
                alt="Putu Travels"
                className="h-14 sm:h-16 md:h-24 lg:h-28 w-auto object-contain"
              />
            </Link>

            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `relative py-2 text-sm font-bold uppercase tracking-wide transition-colors duration-150 ${
                    isActive ? 'text-coral-600' : 'text-slate-600 hover:text-cocoa-700'
                  }`
                }
                end
              >
                {({ isActive }) => (
                  <>
                    Home
                    <span
                      className={`pointer-events-none absolute left-0 -bottom-0.5 h-0.5 bg-coral-600 transition-all duration-200 ${
                        isActive ? 'w-full' : 'w-0'
                      }`}
                    />
                  </>
                )}
              </NavLink>

              <Dropdown label="Plan Your Trip" width="min-w-[320px]">
                {escapesAndPlannerLinks.map((l) => (
                  <DropdownLink key={l.to} to={l.to} label={l.label} desc={l.desc} />
                ))}
              </Dropdown>

              <Dropdown label="Services">
                {servicesLinks.map((l) => (
                  <DropdownLink key={l.to} to={l.to} label={l.label} desc={l.desc} />
                ))}
              </Dropdown>

              <Dropdown label="Discover" width="min-w-[220px]">
                {discoverLinks.map((l) => (
                  <SimpleDropdownLink key={l.to} to={l.to} label={l.label} />
                ))}
              </Dropdown>

              <Dropdown label="Company" width="min-w-[220px]">
                {companyLinks.map((l) => (
                  <SimpleDropdownLink key={l.to} to={l.to} label={l.label} />
                ))}
              </Dropdown>
            </nav>

            <div className="hidden lg:flex items-center gap-4">
              {user && (
                <Link
                  to={dashboardPath}
                  aria-label="Your account"
                  className="flex items-center justify-center w-11 h-11 rounded-full text-cocoa-700 hover:bg-sand-100 transition-colors duration-150"
                >
                  <User size={28} strokeWidth={2.25} />
                </Link>
              )}
              <AuthButtons user={user} dashboardPath={dashboardPath} variant="desktop" />
            </div>

            {/* Mobile Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3 lg:hidden flex-shrink-0">
              <Link
                to={mobileAccountPath}
                aria-label={user ? 'Go to your dashboard' : 'Login or register'}
                className="flex items-center justify-center w-11 h-11 rounded-full text-cocoa-700 hover:bg-sand-100 active:scale-95 transition-all duration-150 flex-shrink-0"
              >
                <User size={28} strokeWidth={2.25} />
              </Link>
              <button
                className="p-2.5 text-teal-700 rounded-md hover:bg-teal-50 transition-colors flex-shrink-0"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-label="Toggle navigation menu"
              >
                {open ? <X size={32} /> : <Menu size={32} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[3px] w-full">
          <div className="w-1/2 bg-teal-600" />
          <div className="w-1/2 bg-coral-500" />
        </div>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-x-0 top-[calc(5rem+2.25rem)] sm:top-[calc(6rem+2.75rem)] bottom-0 border-t border-sand-200 bg-white overflow-y-auto overflow-x-hidden z-30">
          <nav className="page-container py-4 flex flex-col gap-1 pb-28">
            <Link to="/" className="py-2.5 text-sm font-bold uppercase tracking-wide text-cocoa-700">Home</Link>

            <div className="pt-2 pb-1">
              <div className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Plan Your Trip
              </div>
              {escapesAndPlannerLinks.map((l) => (
                <Link key={l.to} to={l.to} className="block py-2.5 pl-1 text-sm font-bold uppercase tracking-wide text-cocoa-700">
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 pb-1 border-t border-sand-200">
              <div className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 mt-2">
                Services
              </div>
              {servicesLinks.map((l) => (
                <Link key={l.to} to={l.to} className="block py-2.5 pl-1 text-sm font-bold uppercase tracking-wide text-cocoa-700">
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 pb-1 border-t border-sand-200">
              <div className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 mt-2">
                Discover
              </div>
              {discoverLinks.map((l) => (
                <Link key={l.to} to={l.to} className="flex items-center gap-2 py-2.5 pl-1 text-sm font-bold uppercase tracking-wide text-cocoa-700">
                  <span className="w-1 h-1 rounded-full bg-teal-600" />
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 pb-1 border-t border-sand-200">
              <div className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 mt-2">
                Company
              </div>
              {companyLinks.map((l) => (
                <Link key={l.to} to={l.to} className="flex items-center gap-2 py-2.5 pl-1 text-sm font-bold uppercase tracking-wide text-cocoa-700">
                  <span className="w-1 h-1 rounded-full bg-teal-600" />
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="pt-4 pb-4 border-t border-sand-200">
              <AuthButtons user={user} dashboardPath={dashboardPath} variant="mobile" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}