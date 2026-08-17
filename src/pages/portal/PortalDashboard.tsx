import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  Plane, FileText, CreditCard, Bell, ArrowRight, Calendar, 
  AlertCircle, Clock, MapPin, MessageSquare, Download, Compass 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Booking {
  id: string;
  reference: string;
  arrival_date: string | null;
  departure_date: string | null;
  status: string;
  total_amount: number | null;
  paid_amount: number | null;
  num_guests: number;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface Itinerary {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
}

export default function PortalDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5), //[cite: 2]
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false), //[cite: 2]
      supabase.from('itineraries').select('*').eq('user_id', user.id).limit(3),
    ]).then(([b, notifs, n, its]) => {
      if (b.error) {
        setError('Unable to load your bookings. Please try again.'); //[cite: 2]
      } else {
        setBookings((b.data as Booking[]) ?? []); //[cite: 2]
        setNotifications((notifs.data as NotificationItem[]) ?? []);
        setNotifCount(n.count ?? 0); //[cite: 2]
        setItineraries((its.data as Itinerary[]) ?? []);
      }
      setLoading(false);
    }).catch(() => {
      setError('Unable to load your dashboard. Please try again.'); //[cite: 2]
      setLoading(false);
    });
  }, [user]);

  const upcoming = bookings.filter((b) => ['Confirmed', 'Awaiting Payment', 'Quoted', 'Pending'].includes(b.status)); //[cite: 2]
  const nextTrip = upcoming.find((b) => b.arrival_date && new Date(b.arrival_date) >= new Date()); //[cite: 2]
  const daysUntilTrip = nextTrip?.arrival_date //[cite: 2]
    ? Math.ceil((new Date(nextTrip.arrival_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) //[cite: 2]
    : null; //[cite: 2]
  const outstandingTotal = bookings.reduce(
    (sum, b) => sum + (b.total_amount ?? 0) - (b.paid_amount ?? 0), 0 //[cite: 2]
  );
  const paidTotal = bookings.reduce((sum, b) => sum + (b.paid_amount ?? 0), 0);

  const stats = [
    { label: 'Upcoming Trips', value: upcoming.length, icon: Plane, color: 'text-coral-500' }, //[cite: 2]
    { label: 'Total Bookings', value: bookings.length, icon: FileText, color: 'text-teal-500' }, //[cite: 2]
    { label: 'Unread Notifications', value: notifCount, icon: Bell, color: 'text-cocoa-500' }, //[cite: 2]
    { label: 'Outstanding Balance', value: `$${outstandingTotal.toLocaleString()}`, icon: CreditCard, color: 'text-coral-500' }, //[cite: 2]
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Manage your bookings, travel documents, and real-time updates."
        action={
          <div className="flex items-center gap-3">
            <Link to="/portal/messages" className="btn-secondary text-sm flex items-center gap-2">
              <MessageSquare size={16} /> Messages
            </Link>
            <Link to="/planner" className="btn-primary text-sm flex items-center gap-2">
              <Compass size={16} /> Plan New Journey
            </Link>
          </div>
        }
      />

      {/* Next Trip Banner */}
      {nextTrip && daysUntilTrip !== null && (
        <div className="card p-6 bg-white border border-coral-200 shadow-sm rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-coral-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
              <Clock size={28} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Next Adventure</div>
              <div className="font-serif text-2xl font-semibold text-cocoa-700">
                {daysUntilTrip === 0 ? 'Today is your trip!' : daysUntilTrip === 1 ? 'Tomorrow!' : `${daysUntilTrip} days away`}
              </div>
              <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                <MapPin size={14} className="text-coral-500" /> Reference: <span className="font-semibold text-cocoa-700">{nextTrip.reference}</span> · Arriving {nextTrip.arrival_date}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Link to={`/portal/bookings`} className="btn-secondary text-xs">View Booking</Link>
            <Link to={`/portal/documents`} className="btn-primary text-xs flex items-center gap-1.5">
              <Download size={14} /> Documents
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</span>
              <s.icon size={18} className={s.color} />
            </div>
            <span className="font-serif text-2xl font-semibold text-cocoa-700">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings & Financial Summary (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Bookings Table Card */}
          <div className="card-md p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-cocoa-700">Recent Bookings</h2>
              <Link to="/portal/bookings" className="text-sm text-coral-600 font-semibold inline-flex items-center gap-1 hover:text-coral-700">
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400 py-6">Loading bookings...</p>
            ) : error ? (
              <div className="flex items-center gap-2 text-coral-600 py-6">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500 mb-4">No bookings yet. Start planning your journey.</p>
                <Link to="/planner" className="btn-primary text-sm">Plan Your Journey</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Reference</th>
                      <th className="pb-3 font-semibold">Arrival Date</th>
                      <th className="pb-3 font-semibold">Guests</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 font-semibold text-cocoa-700">{b.reference}</td>
                        <td className="py-3.5 text-slate-600 flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" /> {b.arrival_date ?? 'TBD'}
                        </td>
                        <td className="py-3.5 text-slate-600">{b.num_guests} guests</td>
                        <td className="py-3.5">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-semibold text-slate-700">
                          {b.total_amount != null ? `$${b.total_amount.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Financial Overview Card */}
          <div className="card-md p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Financial Summary</div>
              <div className="font-serif text-xl font-semibold text-cocoa-700 mt-1">Payment & Billing Status</div>
              <p className="text-xs text-slate-500 mt-1">Track your total investments, paid amounts, and upcoming payment deadlines.</p>
            </div>
            <div className="flex items-center gap-6 w-full sm:w-auto justify-end border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
              <div>
                <div className="text-xs text-slate-400">Total Paid</div>
                <div className="text-base font-semibold text-teal-600">${paidTotal.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Outstanding</div>
                <div className="text-base font-semibold text-coral-600">${outstandingTotal.toLocaleString()}</div>
              </div>
              <Link to="/portal/payments" className="btn-primary text-xs">View Payments</Link>
            </div>
          </div>
        </div>

        {/* Notifications & Saved Itineraries Sidebar (1 column) */}
        <div className="space-y-6">
          {/* Notifications Widget */}
          <div className="card-md p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-semibold text-cocoa-700">Notifications</h2>
                {notifCount > 0 && (
                  <span className="bg-coral-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {notifCount}
                  </span>
                )}
              </div>
              <Link to="/portal/notifications" className="text-xs text-coral-600 font-semibold hover:text-coral-700">
                See all
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400 py-6">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-500">You're completely caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-3.5 rounded-xl border transition-all ${
                      n.is_read ? 'bg-slate-50/50 border-slate-100' : 'bg-coral-50/40 border-coral-200/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-cocoa-700">{n.title}</div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-coral-500 mt-1 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                    <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                      <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      <span className="font-medium text-cocoa-600">Putu Travels Support</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Itineraries Widget */}
          <div className="card-md p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-cocoa-700">Saved Itineraries</h2>
              <Link to="/portal/itineraries" className="text-xs text-coral-600 font-semibold hover:text-coral-700">
                View all
              </Link>
            </div>

            {itineraries.length === 0 ? (
              <div className="text-center py-6">
                <Compass size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 mb-3">No custom itineraries saved yet.</p>
                <Link to="/planner" className="btn-secondary text-xs">Create Itinerary</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {itineraries.map((it) => (
                  <div key={it.id} className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                    <div className="text-xs font-semibold text-cocoa-700">{it.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{it.destination}</div>
                    <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <Calendar size={11} /> {it.start_date} - {it.end_date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}