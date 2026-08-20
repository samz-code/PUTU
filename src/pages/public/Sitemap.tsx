import { Link } from 'react-router-dom';
import {
  Compass,
  Building2,
  Car,
  Sparkles,
  MapPinned,
  Route,
  Info,
  Handshake,
  Newspaper,
  Heart,
  Mail,
  User,
  LogIn,
  UserPlus,
  Shield,
  ScrollText,
  Map as MapIcon,
  ArrowRight,
} from 'lucide-react';

interface SitemapLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface SitemapGroup {
  title: string;
  links: SitemapLink[];
}

const GROUPS: SitemapGroup[] = [
  {
    title: 'Explore',
    links: [
      { to: '/experiences', label: 'Experiences', icon: Sparkles },
      { to: '/accommodation', label: 'Accommodation', icon: Building2 },
      { to: '/transfers', label: 'Private Transfers', icon: Car },
      { to: '/concierge', label: 'Concierge', icon: Compass },
      { to: '/destinations', label: 'Destinations', icon: MapPinned },
      { to: '/planner', label: 'Journey Planner', icon: Route },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About Us', icon: Info },
      { to: '/partners', label: 'Partners', icon: Handshake },
      { to: '/journal', label: 'Journal', icon: Newspaper },
      { to: '/her-turn', label: 'Her Turn', icon: Heart },
      { to: '/contact', label: 'Contact', icon: Mail },
      { to: '/portal', label: 'Customer Portal', icon: User },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/login', label: 'Log In', icon: LogIn },
      { to: '/register', label: 'Create an Account', icon: UserPlus },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy Policy', icon: Shield },
      { to: '/terms', label: 'Terms of Service', icon: ScrollText },
      { to: '/sitemap', label: 'Sitemap', icon: MapIcon },
    ],
  },
];

export default function Sitemap() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-teal-700 text-white">
        <div className="page-container py-14 sm:py-20">
          <p className="text-coral-300 text-sm font-semibold tracking-wide uppercase mb-3">Navigate</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">Sitemap</h1>
          <p className="text-sand-200 text-base sm:text-lg max-w-2xl">
            Every page on Putu Travels, in one place.
          </p>
        </div>
      </div>

      <div className="page-container py-12 sm:py-16">
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 text-coral-600 font-medium mb-10 hover:gap-2.5 transition-all"
        >
          <span>Home</span>
          <ArrowRight size={16} className="transition-transform" />
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8">
          {GROUPS.map(({ title, links }) => (
            <div key={title}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-cocoa-400 mb-4">
                {title}
              </h2>
              <ul className="space-y-3">
                {links.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="group flex items-center gap-2.5 text-cocoa-700 hover:text-coral-600 transition-colors"
                    >
                      <Icon size={16} className="shrink-0 text-cocoa-400 group-hover:text-coral-500 transition-colors" />
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}