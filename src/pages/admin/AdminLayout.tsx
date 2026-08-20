import { 
  LayoutDashboard, Home, Compass, Building2, Plane, FileSpreadsheet, FileText, 
  Users, Hotel, Utensils, Car, UserCheck, Truck, 
  CreditCard, Calendar, FolderOpen, BarChart3, Star, 
  Settings, Shield, Sparkles, Info, BookOpen, MessageSquare, BellRing, Mail, CheckSquare,
  MapPinned, Gem, Handshake
} from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/DashboardShell';
import Notifications from '@/components/Notifications';

export interface CategorizedNavItem extends NavItem {
  category: 'Overview' | 'Content Management' | 'Sales & CRM' | 'Vendors & Fleet' | 'Administration';
  badgeColor: string;
}

export default function AdminLayout() {
  const adminNavItems: CategorizedNavItem[] = [
    // 1. OVERVIEW
    { 
      to: '/admin', 
      label: 'DASHBOARD', 
      icon: LayoutDashboard, 
      end: true,
      category: 'Overview',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/calendar', 
      label: 'CALENDAR', 
      icon: Calendar,
      category: 'Overview',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/analytics', 
      label: 'ANALYTICS', 
      icon: BarChart3,
      category: 'Overview',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },

    // 2. CONTENT MANAGEMENT
    { 
      to: '/admin/home-content', 
      label: 'HOMEPAGE CONTENT', 
      icon: Home,
      category: 'Content Management',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/about', 
      label: 'ABOUT CONTENT', 
      icon: Info,
      category: 'Content Management',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/destinations', 
      label: 'DESTINATIONS', 
      icon: Compass,
      category: 'Content Management',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/experiences', 
      label: 'EXPERIENCES', 
      icon: MapPinned,
      category: 'Content Management',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/accommodations', 
      label: 'ACCOMMODATIONS', 
      icon: Building2,
      category: 'Content Management',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/concierge', 
      label: 'CONCIERGE SERVICES', 
      icon: Sparkles,
      category: 'Content Management',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/journal', 
      label: 'JOURNAL & STORIES', 
      icon: BookOpen,
      category: 'Content Management',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/her-turn', 
      label: 'HER TURN RETREATS', 
      icon: Gem,
      category: 'Content Management',
      badgeColor: 'bg-[#f26b5e]/10 text-[#f26b5e] border-[#f26b5e]/20'
    },
    { 
      to: '/admin/partners', 
      label: 'PARTNERS & PORTALS', 
      icon: Handshake,
      category: 'Content Management',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/reviews', 
      label: 'REVIEWS', 
      icon: Star,
      category: 'Content Management',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },

    // 3. SALES & CRM
    { 
      to: '/admin/bookings', 
      label: 'BOOKINGS', 
      icon: Plane,
      category: 'Sales & CRM',
      badgeColor: 'bg-[#4274d9]/10 text-[#4274d9] border-[#4274d9]/20'
    },
    { 
      to: '/admin/briefs', 
      label: 'JOURNEY BRIEFS', 
      icon: FileSpreadsheet,
      category: 'Sales & CRM',
      badgeColor: 'bg-[#4274d9]/10 text-[#4274d9] border-[#4274d9]/20'
    },
    { 
      to: '/admin/planner-admin', 
      label: 'JOURNEY PLANNER', 
      icon: CheckSquare,
      category: 'Sales & CRM',
      badgeColor: 'bg-[#4274d9]/10 text-[#4274d9] border-[#4274d9]/20'
    },
    { 
      to: '/admin/quotes', 
      label: 'QUOTE BUILDER', 
      icon: FileText,
      category: 'Sales & CRM',
      badgeColor: 'bg-[#4274d9]/10 text-[#4274d9] border-[#4274d9]/20'
    },
    { 
      to: '/admin/customers', 
      label: 'CUSTOMERS', 
      icon: Users,
      category: 'Sales & CRM',
      badgeColor: 'bg-[#4274d9]/10 text-[#4274d9] border-[#4274d9]/20'
    },
    { 
      to: '/admin/messages', 
      label: 'MESSAGES', 
      icon: MessageSquare,
      category: 'Sales & CRM',
      badgeColor: 'bg-[#4274d9]/10 text-[#4274d9] border-[#4274d9]/20'
    },
    { 
      to: '/admin/payments', 
      label: 'PAYMENTS', 
      icon: CreditCard,
      category: 'Sales & CRM',
      badgeColor: 'bg-[#4274d9]/10 text-[#4274d9] border-[#4274d9]/20'
    },
    { 
      to: '/admin/documents', 
      label: 'DOCUMENTS', 
      icon: FolderOpen,
      category: 'Sales & CRM',
      badgeColor: 'bg-[#4274d9]/10 text-[#4274d9] border-[#4274d9]/20'
    },
    { 
      to: '/admin/newsletter', 
      label: 'NEWSLETTER', 
      icon: Mail,
      category: 'Sales & CRM',
      badgeColor: 'bg-[#4274d9]/10 text-[#4274d9] border-[#4274d9]/20'
    },

    // 4. VENDORS & FLEET
    { 
      to: '/admin/hotels', 
      label: 'HOTEL PARTNERS', 
      icon: Hotel,
      category: 'Vendors & Fleet',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/restaurants', 
      label: 'RESTAURANTS', 
      icon: Utensils,
      category: 'Vendors & Fleet',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/drivers', 
      label: 'DRIVERS', 
      icon: Car,
      category: 'Vendors & Fleet',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/guides', 
      label: 'TOUR GUIDES', 
      icon: UserCheck,
      category: 'Vendors & Fleet',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },
    { 
      to: '/admin/transfers', 
      label: 'TRANSFERS & FLEET', 
      icon: Truck,
      category: 'Vendors & Fleet',
      badgeColor: 'bg-[#17b5b1]/10 text-[#17b5b1] border-[#17b5b1]/20'
    },

    // 5. ADMINISTRATION
    { 
      to: '/admin/notifications', 
      label: 'SYSTEM ALERTS', 
      icon: BellRing,
      category: 'Administration',
      badgeColor: 'bg-[#f26b5e]/10 text-[#f26b5e] border-[#f26b5e]/20'
    },
    { 
      to: '/admin/settings', 
      label: 'SETTINGS', 
      icon: Settings,
      category: 'Administration',
      badgeColor: 'bg-[#f26b5e]/10 text-[#f26b5e] border-[#f26b5e]/20'
    },
    { 
      to: '/admin/super', 
      label: 'SUPER ADMIN', 
      icon: Shield,
      category: 'Administration',
      badgeColor: 'bg-[#f26b5e]/10 text-[#f26b5e] border-[#f26b5e]/20'
    },
  ];

  return (
    <DashboardShell
      title="ADMIN PORTAL"
      subtitle="EVERYTHING YOU NEED TO RUN PUTU TRAVELS DAY TO DAY"
      navItems={adminNavItems}
      homePath="/admin"
      topRightContent={<Notifications />}
    />
  );
}