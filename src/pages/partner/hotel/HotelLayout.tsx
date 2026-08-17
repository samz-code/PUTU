import DashboardShell from '@/components/DashboardShell';
import { LayoutDashboard, BedDouble, Calendar, DollarSign, CreditCard } from 'lucide-react';

const navItems = [
  { to: '/partner/hotel', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/partner/hotel/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/partner/hotel/availability', label: 'Availability', icon: Calendar },
  { to: '/partner/hotel/reservations', label: 'Reservations', icon: Calendar },
  { to: '/partner/hotel/payments', label: 'Payments', icon: DollarSign },
];

export default function HotelLayout() {
  return <DashboardShell title="Hotel Portal" navItems={navItems} homePath="/partner/hotel" />;
}
