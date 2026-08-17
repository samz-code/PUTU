import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  AlertCircle, 
  Calendar, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Eye, 
  X, 
  CreditCard,
  MapPin,
  RefreshCw,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

export interface Booking {
  id: string;
  reference: string;
  user_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  destination?: string;
  trip_title?: string;
  arrival_date: string | null;
  departure_date: string | null;
  status: string;
  total_amount: number | null;
  paid_amount: number | null;
  num_guests: number;
  notes?: string;
  created_at: string;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Awaiting Payment': 'bg-amber-100 text-amber-800 border-amber-200',
    Quoted: 'bg-sky-100 text-sky-800 border-sky-200',
    Pending: 'bg-slate-100 text-slate-700 border-slate-200',
    Draft: 'bg-slate-100 text-slate-600 border-slate-200',
    Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
    Completed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Checked In': 'bg-teal-100 text-teal-800 border-teal-200',
    Refunded: 'bg-purple-100 text-purple-800 border-purple-200'
  };
  return map[status] ?? 'bg-slate-100 text-slate-700 border-slate-200';
};

const filterTabs = ['All', 'Upcoming', 'Confirmed', 'Awaiting Payment', 'Quoted', 'Completed', 'Cancelled'];

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  
  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setBookings((data as Booking[]) ?? []);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError('Unable to load bookings. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Statistics
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => ['Confirmed', 'Awaiting Payment', 'Quoted', 'Pending'].includes(b.status)).length;
    const totalDue = bookings
      .filter(b => b.status !== 'Cancelled' && b.status !== 'Refunded')
      .reduce((sum, b) => sum + ((b.total_amount ?? 0) - (b.paid_amount ?? 0)), 0);

    return { totalBookings, activeBookings, totalDue: Math.max(0, totalDue) };
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch = 
        b.reference.toLowerCase().includes(search.toLowerCase()) ||
        (b.destination && b.destination.toLowerCase().includes(search.toLowerCase())) ||
        (b.trip_title && b.trip_title.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;
      if (filter === 'All') return true;
      if (filter === 'Upcoming') return ['Confirmed', 'Awaiting Payment', 'Quoted', 'Pending'].includes(b.status);
      return b.status === filter;
    });
  }, [bookings, search, filter]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6 font-sans min-w-0">
      
      {/* Header */}
      <PageHeader
        title="Booking Status & Itineraries"
        subtitle="Track your travel requests, review custom quotes, and manage payments."
        action={
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchBookings} 
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link to="/planner" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F06553] text-white rounded-xl text-sm font-medium hover:bg-[#e05442] transition-colors shadow-sm whitespace-nowrap">
              <Plus size={16} /> New Booking Request
            </Link>
          </div>
        }
      />

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between min-w-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Bookings</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalBookings}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100">
            <FileText size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between min-w-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active / Upcoming</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.activeBookings}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between min-w-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outstanding Balance</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${stats.totalDue.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
            <CreditCard size={22} />
          </div>
        </div>
      </div>

      {/* Search & Filtering Control */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4 min-w-0">
        
        {/* Scrollable Filters */}
        <div className="w-full max-w-full overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 w-max">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                  filter === tab
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
            placeholder="Search reference, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-w-0">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[#F06553]" />
            <p className="text-xs sm:text-sm font-medium text-slate-500">Retrieving booking records...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 text-rose-600 p-8">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">No bookings found</p>
              <p className="text-xs text-slate-500 mt-1">
                {bookings.length === 0 ? "You haven't placed any travel requests yet." : "No bookings match your selected criteria."}
              </p>
            </div>
            {bookings.length === 0 && (
              <Link to="/planner" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F06553] text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-[#e05442] transition-colors shadow-sm">
                <Plus size={16} /> Request First Journey
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[650px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">Destination / Title</th>
                  <th className="px-5 py-3.5">Travel Dates</th>
                  <th className="px-5 py-3.5">Guests</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Total Price</th>
                  <th className="px-5 py-3.5 text-right">Balance</th>
                  <th className="px-5 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((b) => {
                  const balance = (b.total_amount ?? 0) - (b.paid_amount ?? 0);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                        {b.reference}
                      </td>
                      <td className="px-5 py-4 font-medium max-w-[180px] truncate">
                        {b.trip_title || b.destination || 'Custom Itinerary'}
                      </td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                        {b.arrival_date ? new Date(b.arrival_date).toLocaleDateString() : 'TBD'}
                        {b.departure_date ? ` — ${new Date(b.departure_date).toLocaleDateString()}` : ''}
                      </td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Users size={14} className="text-slate-400" /> {b.num_guests || 1}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {b.total_amount != null ? `$${Number(b.total_amount).toLocaleString()}` : 'Pending Quote'}
                      </td>
                      <td className="px-5 py-4 text-right font-bold whitespace-nowrap">
                        {b.total_amount == null ? (
                          <span className="text-slate-400">—</span>
                        ) : balance > 0 ? (
                          <span className="text-rose-600">${balance.toLocaleString()}</span>
                        ) : (
                          <span className="text-emerald-600">Paid in Full</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                          title="View Itinerary Details"
                        >
                          <Eye size={15} /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Booking Inspection Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-7 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 border border-slate-100 min-w-0">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-[#F06553] uppercase tracking-wider block">
                  Reference: {selectedBooking.reference}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mt-0.5 break-words">
                  {selectedBooking.trip_title || selectedBooking.destination || 'Custom Booking Request'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Workflow Progress Indicator */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Booking Status Pipeline</p>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 gap-1 overflow-x-auto pb-1">
                <span className={`flex items-center gap-1 ${['Pending', 'Quoted', 'Awaiting Payment', 'Confirmed', 'Completed'].includes(selectedBooking.status) ? 'text-emerald-600 font-bold' : ''}`}>
                  <CheckCircle2 size={14} /> Requested
                </span>
                <span className="text-slate-300">→</span>
                <span className={`flex items-center gap-1 ${['Quoted', 'Awaiting Payment', 'Confirmed', 'Completed'].includes(selectedBooking.status) ? 'text-emerald-600 font-bold' : ''}`}>
                  <CheckCircle2 size={14} /> Quoted
                </span>
                <span className="text-slate-300">→</span>
                <span className={`flex items-center gap-1 ${['Confirmed', 'Completed'].includes(selectedBooking.status) ? 'text-emerald-600 font-bold' : ''}`}>
                  <CheckCircle2 size={14} /> Confirmed
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-1 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs font-medium block">Travel Dates</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar size={15} className="text-[#F06553]" />
                  {selectedBooking.arrival_date ? new Date(selectedBooking.arrival_date).toLocaleDateString() : 'TBD'}
                  {selectedBooking.departure_date ? ` to ${new Date(selectedBooking.departure_date).toLocaleDateString()}` : ''}
                </p>
              </div>

              <div className="space-y-1 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs font-medium block">Party Size</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Users size={15} className="text-[#F06553]" />
                  {selectedBooking.num_guests} Guests
                </p>
              </div>

              {selectedBooking.destination && (
                <div className="space-y-1 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 sm:col-span-2">
                  <span className="text-slate-400 text-xs font-medium block">Destination / Region</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin size={15} className="text-[#F06553]" />
                    {selectedBooking.destination}
                  </p>
                </div>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">Financial Breakdown</h4>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-300">Total Package Amount:</span>
                <span className="font-bold text-base">
                  {selectedBooking.total_amount != null ? `$${Number(selectedBooking.total_amount).toLocaleString()}` : 'Awaiting Quote'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-300">Amount Paid to Date:</span>
                <span className="font-semibold text-emerald-400">
                  ${Number(selectedBooking.paid_amount ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm border-t border-slate-800 pt-2 font-bold">
                <span className="text-slate-200">Remaining Balance:</span>
                <span className="text-rose-400 text-base">
                  ${Math.max(0, (selectedBooking.total_amount ?? 0) - (selectedBooking.paid_amount ?? 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Special Notes */}
            {selectedBooking.notes && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Special Notes & Requirements</h4>
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed break-words">
                  {selectedBooking.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}