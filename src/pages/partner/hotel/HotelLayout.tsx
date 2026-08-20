import React from 'react';
import DashboardShell from '@/components/DashboardShell';
import { 
  LayoutDashboard, 
  BedDouble, 
  Calendar, 
  CalendarDays, 
  CreditCard 
} from 'lucide-react';

const navItems = [
  { to: '/partner/hotel', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/partner/hotel/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/partner/hotel/availability', label: 'Availability', icon: Calendar },
  { to: '/partner/hotel/reservations', label: 'Reservations', icon: CalendarDays },
  { to: '/partner/hotel/payments', label: 'Payments', icon: CreditCard },
];

export default function HotelLayout() {
  return (
    <DashboardShell 
      title="Hotel Partner Portal" 
      navItems={navItems} 
      homePath="/partner/hotel" 
    />
  );
}