import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { 
  Search, Eye, Check, X, LogIn, LogOut, 
  Calendar, User, Phone, Mail, FileText, Filter, DollarSign 
} from 'lucide-react';

interface Reservation {
  id: string;
  hotel_id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  room_type: string | null;
  status: 'Pending' | 'Confirmed' | 'Declined' | 'Checked In' | 'Checked Out' | 'Cancelled';
  notes: string | null;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  total_amount?: number;
  created_at: string;
}

const STATUS_OPTIONS: Reservation['status'][] = [
  'Pending',
  'Confirmed',
  'Checked In',
  'Checked Out',
  'Declined',
  'Cancelled',
];

export default function HotelReservations() {
  const { user } = useAuth();
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('All');

  // Modal State
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('hotels')
      .select('id')
      .eq('partner_user_id', user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setHotelId(data.id);
          fetchReservations(data.id);
        } else {
          setLoading(false);
        }
      });
  }, [user]);

  const fetchReservations = async (hId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('hotel_reservations')
      .select('*')
      .eq('hotel_id', hId)
      .order('created_at', { ascending: false });

    setReservations((data as Reservation[]) ?? []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: Reservation['status']) => {
    setReservations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    if (selectedRes && selectedRes.id === id) {
      setSelectedRes({ ...selectedRes, status });
    }
    await supabase.from('hotel_reservations').update({ status }).eq('id', id);
  };

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Checked In':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Checked Out':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Declined':
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Filter Logic
  const filteredReservations = reservations.filter((r) => {
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Pending' && r.status === 'Pending') ||
      (activeTab === 'Confirmed' && r.status === 'Confirmed') ||
      (activeTab === 'In-House' && r.status === 'Checked In') ||
      (activeTab === 'Completed' && r.status === 'Checked Out');

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      r.id.toLowerCase().includes(query) ||
      (r.guest_name && r.guest_name.toLowerCase().includes(query)) ||
      (r.room_type && r.room_type.toLowerCase().includes(query));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Reservations"
        subtitle="Manage booking requests, guest check-ins, and stay schedules"
      />

      {/* FILTER TABS & SEARCH BAR */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'All', label: 'All Stays', count: reservations.length },
            { id: 'Pending', label: 'Pending Requests', count: reservations.filter((r) => r.status === 'Pending').length },
            { id: 'Confirmed', label: 'Upcoming Confirmed', count: reservations.filter((r) => r.status === 'Confirmed').length },
            { id: 'In-House', label: 'In-House', count: reservations.filter((r) => r.status === 'Checked In').length },
            { id: 'Completed', label: 'Completed', count: reservations.filter((r) => r.status === 'Checked Out').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  activeTab === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input text-xs pl-10 pr-4 py-2.5 w-full bg-white border-slate-200 rounded-xl"
            placeholder="Search by guest name, reservation ID, or room type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* RESERVATIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading reservations...</div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No reservations matching your filter.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Guest Info</th>
                    <th className="px-5 py-3.5">Stay Dates</th>
                    <th className="px-5 py-3.5">Room & Guests</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-center">Quick Action</th>
                    <th className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{r.guest_name || 'Standard Booking'}</div>
                        <div className="text-2xs text-slate-400 font-mono">ID: #{r.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <div className="font-semibold">{r.check_in} &rarr; {r.check_out}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <div>{r.room_type || 'Standard Room'}</div>
                        <div className="text-2xs text-slate-400">{r.num_guests} Guest{r.num_guests > 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {r.total_amount ? `$${Number(r.total_amount).toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-2xs font-bold border ${getStatusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {/* Quick Action Shortcuts */}
                        {r.status === 'Pending' && (
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => updateStatus(r.id, 'Confirmed')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-md flex items-center gap-1 text-2xs"
                              title="Confirm Booking"
                            >
                              <Check size={12} /> Confirm
                            </button>
                            <button
                              onClick={() => updateStatus(r.id, 'Declined')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-md flex items-center gap-1 text-2xs"
                              title="Decline Booking"
                            >
                              <X size={12} /> Decline
                            </button>
                          </div>
                        )}
                        {r.status === 'Confirmed' && (
                          <button
                            onClick={() => updateStatus(r.id, 'Checked In')}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-md inline-flex items-center gap-1 text-2xs"
                          >
                            <LogIn size={12} /> Check In
                          </button>
                        )}
                        {r.status === 'Checked In' && (
                          <button
                            onClick={() => updateStatus(r.id, 'Checked Out')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md inline-flex items-center gap-1 text-2xs"
                          >
                            <LogOut size={12} /> Check Out
                          </button>
                        )}
                        {(r.status === 'Checked Out' || r.status === 'Declined' || r.status === 'Cancelled') && (
                          <select
                            value={r.status}
                            onChange={(e) => updateStatus(r.id, e.target.value as Reservation['status'])}
                            className="text-2xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-600 focus:outline-none"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedRes(r)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredReservations.map((r) => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{r.guest_name || 'Guest Booking'}</div>
                      <div className="text-2xs text-slate-400">{r.check_in} to {r.check_out}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold border ${getStatusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>{r.room_type || 'Standard Room'} &bull; {r.num_guests} Guests</span>
                    <span className="font-bold text-slate-900">{r.total_amount ? `$${r.total_amount}` : ''}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <button
                      onClick={() => setSelectedRes(r)}
                      className="text-2xs font-semibold text-teal-600 flex items-center gap-1"
                    >
                      <Eye size={12} /> View Full Details
                    </button>
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value as Reservation['status'])}
                      className="text-2xs border border-slate-200 rounded px-2 py-1 text-slate-700"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedRes && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-xl space-y-5 border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">Reservation Details</h3>
                <p className="text-2xs font-mono text-slate-400">ID: {selectedRes.id}</p>
              </div>
              <button
                onClick={() => setSelectedRes(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <User size={14} className="text-teal-600" />
                  <span>{selectedRes.guest_name || 'Guest Details Unspecified'}</span>
                </div>
                {selectedRes.guest_email && (
                  <div className="flex items-center gap-2 text-slate-600 pl-5">
                    <Mail size={12} /> {selectedRes.guest_email}
                  </div>
                )}
                {selectedRes.guest_phone && (
                  <div className="flex items-center gap-2 text-slate-600 pl-5">
                    <Phone size={12} /> {selectedRes.guest_phone}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 p-3 rounded-xl">
                  <span className="text-2xs text-slate-400 block font-semibold">Check In</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedRes.check_in}</span>
                </div>
                <div className="border border-slate-200 p-3 rounded-xl">
                  <span className="text-2xs text-slate-400 block font-semibold">Check Out</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedRes.check_out}</span>
                </div>
              </div>

              <div className="border border-slate-200 p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Room Requested:</span>
                  <span className="font-bold text-slate-800">{selectedRes.room_type || 'Standard Room'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guests Count:</span>
                  <span className="font-bold text-slate-800">{selectedRes.num_guests}</span>
                </div>
                {selectedRes.total_amount && (
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Total Booking Value:</span>
                    <span className="font-bold text-emerald-600">${Number(selectedRes.total_amount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {selectedRes.notes && (
                <div className="border border-slate-200 p-3 rounded-xl space-y-1">
                  <span className="text-2xs text-slate-400 font-semibold flex items-center gap-1">
                    <FileText size={12} /> Special Requests / Notes
                  </span>
                  <p className="text-slate-700 text-xs italic">{selectedRes.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className={`px-2.5 py-1 rounded-full text-2xs font-bold border ${getStatusBadge(selectedRes.status)}`}>
                {selectedRes.status}
              </span>
              <button
                onClick={() => setSelectedRes(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}