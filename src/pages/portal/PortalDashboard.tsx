import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Plane, FileText, CreditCard, Bell, ArrowRight, Calendar,
  AlertCircle, Clock, MapPin, MessageSquare, Download, Compass,
  ChevronRight, CheckCircle2, RefreshCw, Sparkles, LifeBuoy,
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

// Admin-managed via the `featured_destinations` table — never hardcoded here.
interface FeaturedDestination {
  id: string;
  name: string;
  tagline: string | null;
  price_from: number | null;
}

const STATUS_STYLES: Record<string, string> = {
  Confirmed: 'bg-teal-50 text-teal-700',
  'Awaiting Payment': 'bg-coral-50 text-coral-700',
  Quoted: 'bg-slate-100 text-slate-600',
  Pending: 'bg-slate-100 text-slate-600',
  Completed: 'bg-cocoa-50 text-cocoa-700',
  Cancelled: 'bg-slate-100 text-slate-400',
};

function statusStyle(status: string) {
  return STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600';
}

export default function PortalDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [destinations, setDestinations] = useState<FeaturedDestination[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    Promise.all([
      supabase.from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      supabase.from('itineraries').select('*').eq('user_id', user.id).limit(3),
      supabase.from('featured_destinations').select('id, name, tagline, price_from').eq('is_active', true).order('sort_order', { ascending: true }).limit(3),
    ])
      .then(([b, notifs, n, its, dest]) => {
        if (b.error) {
          setError('Unable to load your bookings. Please try again.');
        } else {
          setBookings((b.data as Booking[]) ?? []);
          setNotifications((notifs.data as NotificationItem[]) ?? []);
          setNotifCount(n.count ?? 0);
          setItineraries((its.data as Itinerary[]) ?? []);
          setDestinations((dest.data as FeaturedDestination[]) ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to load your dashboard. Please try again.');
        setLoading(false);
      });
  };

  useEffect(loadDashboard, [user]);

  const upcoming = bookings.filter((b) =>
    ['Confirmed', 'Awaiting Payment', 'Quoted', 'Pending'].includes(b.status)
  );
  const nextTrip = upcoming.find((b) => b.arrival_date && new Date(b.arrival_date) >= new Date());
  const daysUntilTrip = nextTrip?.arrival_date
    ? Math.ceil((new Date(nextTrip.arrival_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const outstandingTotal = bookings.reduce(
    (sum, b) => sum + (b.total_amount ?? 0) - (b.paid_amount ?? 0),
    0
  );
  const paidTotal = bookings.reduce((sum, b) => sum + (b.paid_amount ?? 0), 0);
  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const latestNotification = notifications[0];

  const stats = [
    {
      label: 'Upcoming Trips',
      value: upcoming.length,
      icon: Plane,
      accent: 'bg-coral-50 text-coral-600',
      note: nextTrip ? `Next in ${daysUntilTrip} ${daysUntilTrip === 1 ? 'day' : 'days'}` : 'None scheduled',
    },
    {
      label: 'Total Bookings',
      value: bookings.length,
      icon: FileText,
      accent: 'bg-teal-50 text-teal-600',
      note: `${confirmedCount} confirmed`,
    },
    {
      label: 'Unread Alerts',
      value: notifCount,
      icon: Bell,
      accent: 'bg-cocoa-50 text-cocoa-600',
      note: latestNotification ? new Date(latestNotification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No activity yet',
    },
    {
      label: 'Outstanding Balance',
      value: `$${outstandingTotal.toLocaleString()}`,
      icon: CreditCard,
      accent: 'bg-coral-50 text-coral-600',
      note: `$${paidTotal.toLocaleString()} paid to date`,
    },
  ];

  const quickActions = [
    { label: 'Plan New Journey', to: '/planner', icon: Compass },
    { label: 'Message Concierge', to: '/portal/messages', icon: MessageSquare },
    { label: 'View Documents', to: '/portal/documents', icon: FileText },
    { label: 'View Payments', to: '/portal/payments', icon: CreditCard },
  ];

  return (
    // w-full so this fills whatever width the portal shell hands it — see note at the end
    // of this response if there's still a gap on the right after this change.
    <div className="w-full space-y-5 sm:space-y-6">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Manage your bookings, travel documents, and real-time updates."
        action={
          <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Link to="/portal/messages" className="btn-secondary text-sm flex items-center justify-center gap-2">
              <MessageSquare size={16} /> Messages
            </Link>
            <Link to="/planner" className="btn-primary text-sm flex items-center justify-center gap-2">
              <Compass size={16} /> Plan New Journey
            </Link>
          </div>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={loadDashboard} />
      ) : (
        <>
          {/* Next Trip banner */}
          {nextTrip && daysUntilTrip !== null && (
            <div className="bg-white border border-coral-200 shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-coral-500 flex items-center justify-center flex-shrink-0 text-white">
                  <Clock size={24} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Your Next Adventure
                  </div>
                  <div className="font-serif text-xl sm:text-2xl font-semibold text-cocoa-700 leading-tight mt-0.5">
                    {daysUntilTrip === 0 ? 'Today is your trip!' : daysUntilTrip === 1 ? 'Tomorrow!' : `${daysUntilTrip} days away`}
                  </div>
                  <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1.5">
                    <MapPin size={14} className="text-coral-500 flex-shrink-0" />
                    <span className="font-semibold text-cocoa-700">{nextTrip.reference}</span>
                    <span>· Arriving {nextTrip.arrival_date}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:flex items-center gap-2 flex-shrink-0">
                <Link to="/portal/bookings" className="btn-secondary text-xs text-center py-2.5">View Booking</Link>
                <Link to="/portal/documents" className="btn-primary text-xs flex items-center justify-center gap-1.5 py-2.5">
                  <Download size={14} /> Documents
                </Link>
              </div>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col"
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 ${s.accent}`}>
                  <s.icon size={18} />
                </div>
                <span className="font-serif text-2xl sm:text-3xl font-semibold text-cocoa-700 leading-none">
                  {s.value}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-2">
                  {s.label}
                </span>
                <span className="text-xs text-slate-400 mt-1">{s.note}</span>
              </div>
            ))}
          </div>

          {/* Main content grid — widens to 4 columns at 2xl so ultra-wide screens don't end
              in a blank strip; the two right-most columns split apart instead of stacking. */}
          <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
            <div className="lg:col-span-2 space-y-5 sm:space-y-6">
              {/* Recent Bookings */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-lg sm:text-xl font-semibold text-cocoa-700">Recent Bookings</h2>
                  <Link
                    to="/portal/bookings"
                    className="text-sm text-coral-600 font-semibold inline-flex items-center gap-1 hover:text-coral-700"
                  >
                    View all <ArrowRight size={14} />
                  </Link>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-500 mb-4">No bookings yet. Start planning your journey.</p>
                    <Link to="/planner" className="btn-primary text-sm">Plan Your Journey</Link>
                  </div>
                ) : (
                  <>
                    {/* Table — laptop and desktop */}
                    <div className="hidden md:block overflow-x-auto">
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
                            <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 font-semibold text-cocoa-700">{b.reference}</td>
                              <td className="py-3.5 text-slate-600">
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar size={13} className="text-slate-400" />
                                  {b.arrival_date ?? 'TBD'}
                                </span>
                              </td>
                              <td className="py-3.5 text-slate-600">{b.num_guests} guests</td>
                              <td className="py-3.5">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyle(b.status)}`}>
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

                    {/* Cards — mobile and small tablet */}
                    <div className="md:hidden -mx-5 sm:-mx-6 border-t border-slate-100">
                      {bookings.map((b) => (
                        <Link
                          key={b.id}
                          to="/portal/bookings"
                          className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 last:border-b-0 active:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-cocoa-700 text-sm">{b.reference}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Calendar size={12} className="text-slate-400" />
                              {b.arrival_date ?? 'TBD'} · {b.num_guests} guests
                            </div>
                            <span className={`inline-block mt-2 px-2 py-0.5 text-[11px] font-semibold rounded-full ${statusStyle(b.status)}`}>
                              {b.status}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0 flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700 text-sm">
                              {b.total_amount != null ? `$${b.total_amount.toLocaleString()}` : '—'}
                            </span>
                            <ChevronRight size={16} className="text-slate-300" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Financial Summary</div>
                  <div className="font-serif text-lg sm:text-xl font-semibold text-cocoa-700 mt-1">
                    Payment &amp; Billing Status
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Track your total investments, paid amounts, and upcoming payment deadlines.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:flex items-center gap-4 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
                  <div>
                    <div className="text-xs text-slate-400">Total Paid</div>
                    <div className="text-lg font-semibold text-teal-600">${paidTotal.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Outstanding</div>
                    <div className="text-lg font-semibold text-coral-600">${outstandingTotal.toLocaleString()}</div>
                  </div>
                  <Link to="/portal/payments" className="btn-primary text-xs col-span-2 sm:col-span-1 text-center">
                    View Payments
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar column: notifications + itineraries */}
            <div className="space-y-5 sm:space-y-6">
              {/* Notifications */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-lg sm:text-xl font-semibold text-cocoa-700">Notifications</h2>
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

                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 size={26} className="mx-auto text-teal-400 mb-2" />
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
                        <div className="text-[10px] text-slate-400 mt-2">
                          {new Date(n.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Itineraries */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-lg sm:text-xl font-semibold text-cocoa-700">Saved Itineraries</h2>
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
                      <Link
                        key={it.id}
                        to="/portal/itineraries"
                        className="block p-3 rounded-xl border border-slate-100 hover:border-coral-200 hover:bg-coral-50/30 transition-all"
                      >
                        <div className="text-xs font-semibold text-cocoa-700">{it.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin size={11} /> {it.destination}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                          <Calendar size={11} /> {it.start_date} - {it.end_date}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fourth column — only splits out at 2xl (ultra-wide); stacks under the
                sidebar on everything narrower, so nothing is hidden on laptop/tablet. */}
            <div className="space-y-5 sm:space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
                <h2 className="font-serif text-lg sm:text-xl font-semibold text-cocoa-700 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 2xl:grid-cols-1 gap-2.5">
                  {quickActions.map((a) => (
                    <Link
                      key={a.label}
                      to={a.to}
                      className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-slate-100 hover:border-coral-200 hover:bg-coral-50/30 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <a.icon size={15} className="text-cocoa-500" />
                      </div>
                      <span className="text-xs font-semibold text-cocoa-700">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Explore the Coast — destinations come from the featured_destinations table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-coral-500" />
                    <h2 className="font-serif text-lg sm:text-xl font-semibold text-cocoa-700">Explore the Coast</h2>
                  </div>
                </div>

                {destinations.length === 0 ? (
                  <p className="text-xs text-slate-500">New destinations are added regularly — check back soon.</p>
                ) : (
                  <div className="space-y-3">
                    {destinations.map((d) => (
                      <Link
                        key={d.id}
                        to="/planner"
                        className="block p-3 rounded-xl border border-slate-100 hover:border-coral-200 hover:bg-coral-50/30 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-cocoa-700">{d.name}</span>
                          {d.price_from != null && (
                            <span className="text-[10px] font-semibold text-coral-600 flex-shrink-0">
                              from ${d.price_from.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {d.tagline && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{d.tagline}</p>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Support */}
              <Link
                to="/portal/messages"
                className="flex items-center gap-3 bg-cocoa-700 rounded-2xl p-5 text-white hover:bg-cocoa-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <LifeBuoy size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold">Need help?</div>
                  <div className="text-xs text-white/60">Message your concierge anytime</div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-coral-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-coral-50 flex items-center justify-center flex-shrink-0">
          <AlertCircle size={18} className="text-coral-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-cocoa-700">Couldn't load your dashboard</div>
          <p className="text-xs text-slate-500 mt-0.5">{message}</p>
        </div>
      </div>
      <button onClick={onRetry} className="btn-secondary text-xs flex items-center justify-center gap-1.5 self-start sm:self-auto">
        <RefreshCw size={13} /> Try again
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="w-full space-y-5 sm:space-y-6 animate-pulse">
      <div className="h-24 sm:h-28 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
        </div>
        <div className="space-y-5 sm:space-y-6">
          <div className="h-48 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
        <div className="hidden 2xl:block space-y-5 sm:space-y-6">
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}