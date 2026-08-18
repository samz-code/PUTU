import { Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, ChevronDown, Phone, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth';

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

const companyLinks = [
  { to: '/destinations', label: 'Destinations' },
  { to: '/journal', label: 'Journal & Stories' },
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
        className="flex items-center gap-1 text-base font-medium text-slate-600 hover:text-cocoa-700 transition-colors duration-150 py-2"
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
      <div className="text-sm font-semibold text-cocoa-700">{label}</div>
      {desc && <div className="text-xs text-slate-400 mt-0.5">{desc}</div>}
    </Link>
  );
}

function SimpleDropdownLink({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 text-base font-medium text-cocoa-700 hover:bg-sand-100 transition-colors duration-150"
    >
      <span className="w-1 h-1 rounded-full bg-teal-600" />
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [location]);

  // Depth once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashboardPath =
    role === 'admin' ? '/admin' :
    role === 'hotel' ? '/partner/hotel' :
    role === 'restaurant' ? '/partner/restaurant' :
    role === 'driver' ? '/partner/driver' :
    role === 'guide' ? '/partner/guide' :
    '/portal';

  const mobileAccountPath = user ? dashboardPath : '/login';

  return (
    <header
      className={`bg-white sticky top-0 z-40 transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_2px_12px_rgba(20,20,20,0.08)]' : ''
      }`}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-24 lg:h-28">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0 py-2">
            <img
              src="/logo.png"
              alt="Putu Travels"
              className="h-20 lg:h-24 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav with dropdowns */}
          <nav className="hidden lg:flex items-center gap-7">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `relative py-2 text-base font-medium transition-colors duration-150 ${
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

            <Dropdown label="Company">
              {companyLinks.map((l) => (
                <SimpleDropdownLink key={l.to} to={l.to} label={l.label} />
              ))}
            </Dropdown>
          </nav>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="tel:+254714446328"
              className="flex items-center gap-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md pl-3 pr-4 py-2 transition-colors duration-150"
            >
              <Phone size={14} /> +254 714 446 328
            </a>
            {user ? (
              <Link
                to={dashboardPath}
                className="rounded-md bg-coral-600 hover:bg-coral-700 text-white font-semibold py-2.5 px-5 text-sm transition-colors duration-150"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md border border-teal-700 text-teal-700 font-semibold py-2.5 px-5 text-sm hover:bg-teal-50 transition-colors duration-150"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-coral-600 hover:bg-coral-700 text-white font-semibold py-2.5 px-5 text-sm transition-colors duration-150"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile actions: account icon + hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              to={mobileAccountPath}
              aria-label={user ? 'Go to your dashboard' : 'Login or register'}
              className="flex items-center justify-center w-10 h-10 rounded-full text-cocoa-700 hover:bg-sand-100 active:scale-95 transition-all duration-150"
            >
              <LogIn size={24} strokeWidth={2.5} />
            </Link>
            <button
              className="p-2 text-cocoa-700 rounded-md hover:bg-sand-100 transition-colors"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Toggle navigation menu"
            >
              {open ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Signature coast bar */}
      <div className="flex h-[3px] w-full">
        <div className="w-1/2 bg-teal-600" />
        <div className="w-1/2 bg-coral-500" />
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-sand-200 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="page-container py-4 flex flex-col gap-1">
            <Link to="/" className="nav-link py-2.5">Home</Link>

            <div className="pt-2 pb-1">
              <div className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Plan Your Trip
              </div>
              {escapesAndPlannerLinks.map((l) => (
                <Link key={l.to} to={l.to} className="block py-2.5 pl-1 nav-link font-semibold text-cocoa-700">
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 pb-1 border-t border-sand-200">
              <div className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 mt-2">
                Services
              </div>
              {servicesLinks.map((l) => (
                <Link key={l.to} to={l.to} className="block py-2.5 pl-1 nav-link font-semibold text-cocoa-700">
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 pb-1 border-t border-sand-200">
              <div className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 mt-2">
                Company
              </div>
              {companyLinks.map((l) => (
                <Link key={l.to} to={l.to} className="flex items-center gap-2 nav-link py-2.5 pl-1">
                  <span className="w-1 h-1 rounded-full bg-teal-600" />
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-sand-200">
              <a
                href="tel:+254714446328"
                className="flex items-center gap-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-md w-fit pl-3 pr-4 py-2"
              >
                <Phone size={14} /> +254 714 446 328
              </a>
            </div>

            <div className="flex gap-3 pt-3 border-t border-sand-200">
              {user ? (
                <Link
                  to={dashboardPath}
                  className="flex-1 text-center rounded-md bg-coral-600 text-white font-semibold py-2.5 text-xs"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex-1 text-center rounded-md border border-teal-700 text-teal-700 font-semibold py-2.5 text-xs"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 text-center rounded-md bg-coral-600 text-white font-semibold py-2.5 text-xs"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}