import { 
  LayoutDashboard, Home, Compass, Building2, Plane, FileSpreadsheet, FileText, 
  Users, Hotel, Utensils, Car, UserCheck, Truck, 
  CreditCard, Calendar, FolderOpen, BarChart3, Star, 
  Settings, Shield, Sparkles, Info, BookOpen 
} from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/DashboardShell';

export interface CategorizedNavItem extends NavItem {
  category: 'Overview' | 'Content Management' | 'Sales & CRM' | 'Vendors & Fleet' | 'Administration';
  badgeColor: string;
}

export default function AdminLayout() {
  const adminNavItems: CategorizedNavItem[] = [
    // --- 1. OVERVIEW & MONITORING ---
    { 
      to: '/admin', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      end: true,
      category: 'Overview',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    { 
      to: '/admin/calendar', 
      label: 'Calendar', 
      icon: Calendar,
      category: 'Overview',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    { 
      to: '/admin/analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      category: 'Overview',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    },

    // --- 2. CATALOG & CONTENT MANAGEMENT ---
    { 
      to: '/admin/home-content', 
      label: 'Homepage Content', 
      icon: Home,
      category: 'Content Management',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    { 
      to: '/admin/about', 
      label: 'About Content', 
      icon: Info,
      category: 'Content Management',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    { 
      to: '/admin/destinations', 
      label: 'Destinations', 
      icon: Compass,
      category: 'Content Management',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    { 
      to: '/admin/experiences', 
      label: 'Experiences', 
      icon: Compass,
      category: 'Content Management',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    { 
      to: '/admin/accommodations', 
      label: 'Accommodations', 
      icon: Building2,
      category: 'Content Management',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    { 
      to: '/admin/concierge', 
      label: 'Concierge Services', 
      icon: Sparkles,
      category: 'Content Management',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    { 
      to: '/admin/journal', 
      label: 'Journal & Stories', 
      icon: BookOpen,
      category: 'Content Management',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    { 
      to: '/admin/her-turn', 
      label: 'Her Turn Retreats', 
      icon: Sparkles,
      category: 'Content Management',
      badgeColor: 'bg-coral-50 text-coral-700 border-coral-200'
    },
    { 
      to: '/admin/partners', 
      label: 'Partners & Portals', 
      icon: Building2,
      category: 'Content Management',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    { 
      to: '/admin/reviews', 
      label: 'Reviews', 
      icon: Star,
      category: 'Content Management',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },

    // --- 3. SALES & CLIENT OPERATIONS ---
    { 
      to: '/admin/bookings', 
      label: 'Bookings', 
      icon: Plane,
      category: 'Sales & CRM',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      to: '/admin/briefs', 
      label: 'Journey Briefs', 
      icon: FileSpreadsheet,
      category: 'Sales & CRM',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      to: '/admin/quotes', 
      label: 'Quote Builder', 
      icon: FileText,
      category: 'Sales & CRM',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      to: '/admin/customers', 
      label: 'Customers', 
      icon: Users,
      category: 'Sales & CRM',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      to: '/admin/payments', 
      label: 'Payments', 
      icon: CreditCard,
      category: 'Sales & CRM',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      to: '/admin/documents', 
      label: 'Documents', 
      icon: FolderOpen,
      category: 'Sales & CRM',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },

    // --- 4. VENDOR & FLEET LOGISTICS ---
    { 
      to: '/admin/hotels', 
      label: 'Hotel Partners', 
      icon: Hotel,
      category: 'Vendors & Fleet',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    { 
      to: '/admin/restaurants', 
      label: 'Restaurants', 
      icon: Utensils,
      category: 'Vendors & Fleet',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    { 
      to: '/admin/drivers', 
      label: 'Drivers', 
      icon: Car,
      category: 'Vendors & Fleet',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    { 
      to: '/admin/guides', 
      label: 'Tour Guides', 
      icon: UserCheck,
      category: 'Vendors & Fleet',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    { 
      to: '/admin/transfers', 
      label: 'Transfers & Fleet', 
      icon: Truck,
      category: 'Vendors & Fleet',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },

    // --- 5. SYSTEM & ADMINISTRATION ---
    { 
      to: '/admin/settings', 
      label: 'Settings', 
      icon: Settings,
      category: 'Administration',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    { 
      to: '/admin/super', 
      label: 'Super Admin', 
      icon: Shield,
      category: 'Administration',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
  ];

  return (
    <DashboardShell
      title="Admin Portal"
      subtitle="Operations, Lead Pipelines & Site Management"
      navItems={adminNavItems}
      homePath="/admin"
    />
  );
}