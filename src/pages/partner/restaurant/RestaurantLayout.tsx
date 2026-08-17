import DashboardShell from '@/components/DashboardShell';
import { LayoutDashboard, Calendar, DollarSign } from 'lucide-react';

const navItems = [
  { to: '/partner/restaurant', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/partner/restaurant/reservations', label: 'Reservations', icon: Calendar },
  { to: '/partner/restaurant/payments', label: 'Payments', icon: DollarSign },
];

export default function RestaurantLayout() {
  return <DashboardShell title="Restaurant Portal" navItems={navItems} homePath="/partner/restaurant" />;
}
