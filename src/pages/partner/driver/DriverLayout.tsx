import DashboardShell from '@/components/DashboardShell';
import { LayoutDashboard, Car, DollarSign, Route } from 'lucide-react';

const navItems = [
  { to: '/partner/driver', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/partner/driver/trips', label: "Today's Trips", icon: Route },
  { to: '/partner/driver/vehicle', label: 'Vehicle', icon: Car },
  { to: '/partner/driver/payments', label: 'Payments', icon: DollarSign },
];

export default function DriverLayout() {
  return <DashboardShell title="Driver Portal" navItems={navItems} homePath="/partner/driver" />;
}
