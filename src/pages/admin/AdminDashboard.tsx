import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plane, LogIn, LogOut, DollarSign, FileSpreadsheet, CreditCard,
  Car, Users, Hotel, Bell, ArrowRight, TrendingUp, Sparkles, Check,
  X, MessageSquare, Plus, RefreshCw, ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

interface Stats {
  todayBookings: number;
  todayArrivals: number;
  todayDepartures: number;
  revenue: number;
  pendingQuotes: number;
  pendingBriefs: number;
  pendingPayments: number;
  vehiclesAvailable: number;
  driversAvailable: number;
  hotelOccupancy: number;
  notifications: number;
  pendingReviews: number;
}

interface Experience {
  id: string;
  title: string;
  location: string;
  price: number;
  is_featured: boolean;
}

interface JourneyBrief {
  id: string;
  destination: string;
  guest_count: number;
  status: string;
  created_at: string;
  notes?: string;
}

interface Review {
  id: string;
  customer_name: string;
  comment: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<Stats>({
    todayBookings: 0,
    todayArrivals: 0,
    todayDepartures: 0,
    revenue: 0,
    pendingQuotes: 0,
    pendingBriefs: 0,
    pendingPayments: 0,
    vehiclesAvailable: 0,
    driversAvailable: 0,
    hotelOccupancy: 0,
    notifications: 0,
    pendingReviews: 0,
  });

  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentBriefs, setRecentBriefs] = useState<JourneyBrief[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      const [
        todayBookingsRes,
        arrivalsRes,
        departuresRes,
        paymentsRes,
        quotesRes,
        pendingPaymentsRes,
        vehiclesRes,
        driversRes,
        notificationsRes,
        recentBookingsRes,
        checkedInRes,
        totalHotelsRes,
        briefsCountRes,
        recentBriefsRes,
        experiencesRes,
        pendingReviewsRes,
      ] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('arrival_date', today),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('departure_date', today),
        supabase.from('payments').select('amount').eq('status', 'Completed'),
        supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Awaiting Payment'),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'Available'),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_available', true),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('hotel_reservations').select('*', { count: 'exact', head: true }).eq('status', 'Checked In'),
        supabase.from('hotels').select('*', { count: 'exact', head: true }),
        supabase.from('journey_briefs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('journey_briefs').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('experiences').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('reviews').select('*').eq('is_approved', false).order('created_at', { ascending: false }).limit(3),
      ]);

      const payments = paymentsRes.data as any[] ?? [];
      const revenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const totalHotels = totalHotelsRes.count ?? 0;
      const checkedIn = checkedInRes.count ?? 0;
      const calculatedOccupancy = totalHotels > 0 ? Math.round((checkedIn / totalHotels) * 100) : 0;

      setStats({
        todayBookings: todayBookingsRes.count ?? 0,
        todayArrivals: arrivalsRes.count ?? 0,
        todayDepartures: departuresRes.count ?? 0,
        revenue,
        pendingQuotes: quotesRes.count ?? 0,
        pendingBriefs: briefsCountRes.count ?? 0,
        pendingPayments: pendingPaymentsRes.count ?? 0,
        vehiclesAvailable: vehiclesRes.count ?? 0,
        driversAvailable: driversRes.count ?? 0,
        hotelOccupancy: calculatedOccupancy,
        notifications: notificationsRes.count ?? 0,
        pendingReviews: pendingReviewsRes.data?.length ?? 0,
      });

      setRecentBookings(recentBookingsRes.data ?? []);
      setRecentBriefs(recentBriefsRes.data ?? []);
      setExperiences(experiencesRes.data ?? []);
      setPendingReviews(pendingReviewsRes.data ?? []);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleFeaturedExperience = async (id: string, currentStatus: boolean) => {
    setExperiences((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_featured: !currentStatus } : e))
    );

    await supabase
      .from('experiences')
      .update({ is_featured: !currentStatus })
      .eq('id', id);
  };

  const handleReviewAction = async (id: string, approve: boolean) => {
    setPendingReviews((prev) => prev.filter((r) => r.id !== id));

    if (approve) {
      await supabase.from('reviews').update({ is_approved: true }).eq('id', id);
    } else {
      await supabase.from('reviews').delete().eq('id', id);
    }
  };

  const widgets = [
    { label: "Today's Bookings", value: stats.todayBookings, icon: Plane, color: 'text-coral-600 bg-coral-50' },
    { label: "Today's Arrivals", value: stats.todayArrivals, icon: LogIn, color: 'text-teal-600 bg-teal-50' },
    { label: "Today's Departures", value: stats.todayDepartures, icon: LogOut, color: 'text-slate-600 bg-slate-100' },
    { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-coral-600 bg-coral-50' },
    { label: 'New Web Leads', value: stats.pendingBriefs, icon: Sparkles, color: 'text-amber-600 bg-amber-50' },
    { label: 'Pending Quotes', value: stats.pendingQuotes, icon: FileSpreadsheet, color: 'text-teal-600 bg-teal-50' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: CreditCard, color: 'text-coral-600 bg-coral-50' },
    { label: 'Vehicles Ready', value: stats.vehiclesAvailable, icon: Car, color: 'text-slate-600 bg-slate-100' },
    { label: 'Drivers Available', value: stats.driversAvailable, icon: Users, color: 'text-teal-600 bg-teal-50' },
    { label: 'Hotel Occupancy', value: `${stats.hotelOccupancy}%`, icon: Hotel, color: 'text-coral-600 bg-coral-50' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Admin Control Center" 
          subtitle="Real-time operations, booking pipelines, and site management" 
        />
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-coral-500' : ''} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/admin/quotes')}
            className="px-4 py-2.5 bg-coral-500 hover:bg-coral-600 text-white rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={16} /> New Quote
          </button>
        </div>
      </div>

      {/* Primary Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {widgets.map((w) => (
          <div key={w.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${w.color}`}>
              <w.icon size={18} />
            </div>
            <div className="font-serif text-2xl font-bold text-slate-800">
              {loading ? <span className="text-slate-300">...</span> : w.value}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">{w.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Bookings Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Plane size={18} className="text-coral-500" />
              <h2 className="font-serif text-lg font-bold text-slate-800">Recent Bookings</h2>
            </div>
            <Link to="/admin/bookings" className="text-xs text-coral-600 font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No bookings recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentBookings.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{b.reference || 'BK-NEW'}</div>
                    <div className="text-xs text-slate-500">{b.full_name || 'Guest'} • Arrival: {b.arrival_date || 'TBD'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      b.status === 'Confirmed' ? 'bg-teal-100 text-teal-800' :
                      b.status === 'Awaiting Payment' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {b.status || 'Pending'}
                    </span>
                    <Link to={`/admin/bookings?id=${b.id}`} className="text-slate-400 hover:text-slate-600">
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operational Actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
            Quick Actions
          </h2>
          <div className="space-y-2">
            {[
              { label: 'View Journey Briefs', link: '/admin/briefs', icon: FileSpreadsheet, count: stats.pendingBriefs },
              { label: 'Quote Builder', link: '/admin/quotes', icon: FileSpreadsheet, count: stats.pendingQuotes },
              { label: 'Manage Reservations', link: '/admin/bookings', icon: Plane },
              { label: 'Customer Reviews Approval', link: '/admin/reviews', icon: MessageSquare, count: stats.pendingReviews },
              { label: 'Driver & Fleet Status', link: '/admin/fleet', icon: Car },
              { label: 'Analytics & Revenue', link: '/admin/analytics', icon: TrendingUp },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.link}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group"
              >
                <span className="flex items-center gap-3 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  <action.icon size={16} className="text-slate-400 group-hover:text-coral-500 transition-colors" /> 
                  {action.label}
                </span>
                <div className="flex items-center gap-2">
                  {action.count !== undefined && action.count > 0 && (
                    <span className="px-2 py-0.5 bg-coral-100 text-coral-700 text-[10px] font-bold rounded-full">
                      {action.count}
                    </span>
                  )}
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Website & Marketing Content Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Incoming Leads / Journey Briefs */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <h2 className="font-serif text-lg font-bold text-slate-800">New Homepage Leads</h2>
            </div>
            <Link to="/admin/briefs" className="text-xs text-coral-600 font-semibold hover:underline">
              View All
            </Link>
          </div>

          {recentBriefs.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No website briefs submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBriefs.map((brief) => (
                <div key={brief.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{brief.destination || 'Custom Coast Trip'}</span>
                    <span className="text-slate-500">{brief.guest_count} Guests • {new Date(brief.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link
                    to={`/admin/quotes?briefId=${brief.id}`}
                    className="px-3 py-1.5 bg-coral-500 hover:bg-coral-600 text-white font-medium rounded-md transition-colors shadow-xs"
                  >
                    Build Quote
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Featured Experiences Toggle */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="font-serif text-lg font-bold text-slate-800">Featured Homepage Tours</h2>
            <Link to="/experiences" target="_blank" className="text-xs text-coral-600 font-semibold hover:underline">
              Live Website
            </Link>
          </div>

          {experiences.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No experiences in catalog.</p>
          ) : (
            <div className="space-y-2">
              {experiences.map((exp) => (
                <div key={exp.id} className="p-2.5 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-medium text-slate-800 block truncate">{exp.title}</span>
                    <span className="text-slate-400">{exp.location} • ${exp.price}</span>
                  </div>
                  <button
                    onClick={() => toggleFeaturedExperience(exp.id, exp.is_featured)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                      exp.is_featured 
                        ? 'bg-teal-100 text-teal-800 hover:bg-teal-200' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {exp.is_featured ? (
                      <>
                        <Check size={12} /> Featured
                      </>
                    ) : (
                      <>
                        <X size={12} /> Hidden
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Customer Reviews */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-teal-600" />
              <h2 className="font-serif text-lg font-bold text-slate-800">Review Moderation</h2>
            </div>
            <Link to="/admin/reviews" className="text-xs text-coral-600 font-semibold hover:underline">
              Manage
            </Link>
          </div>

          {pendingReviews.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No pending reviews to moderate.</p>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((rev) => (
                <div key={rev.id} className="p-3 border border-slate-100 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{rev.customer_name}</span>
                    <span className="text-amber-500 font-bold">★ {rev.rating}/5</span>
                  </div>
                  <p className="text-slate-600 line-clamp-2 italic">"{rev.comment}"</p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleReviewAction(rev.id, false)}
                      className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-[11px] font-medium"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReviewAction(rev.id, true)}
                      className="px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded text-[11px] font-medium"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}