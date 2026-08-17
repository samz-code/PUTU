import DashboardShell from '@/components/DashboardShell';
import { LayoutDashboard, Calendar, Star } from 'lucide-react';

const navItems = [
  { to: '/partner/guide', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/partner/guide/assignments', label: 'Assignments', icon: Calendar },
  { to: '/partner/guide/ratings', label: 'Ratings', icon: Star },
];

export default function GuideLayout() {
  return <DashboardShell title="Guide Portal" navItems={navItems} homePath="/partner/guide" />;
}
