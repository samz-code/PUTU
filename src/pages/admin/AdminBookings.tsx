import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  RefreshCw, 
  Edit3, 
  X, 
  Check, 
  DollarSign, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

export interface AdminBooking {
  id: string;
  reference: string;
  user_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  destination?: string;
  trip_title?: string;
  arrival_date: string | null;
  departure_date: string | null;
  status: string;
  total_amount: number | null;
  paid_amount: number | null;
  num_guests?: number;
  notes?: string;
  created_at: string;
}

const statusBadge = (s: string) => {
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
  return map[s] ?? 'bg-slate-100 text-slate-700 border-slate-200';
};

const statuses = ['Draft', 'Pending', 'Quoted', 'Awaiting Payment', 'Confirmed', 'Checked In', 'Completed', 'Cancelled', 'Refunded'];

export default function AdminBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Edit Drawer Modal
  const [editingBooking, setEditingBooking] = useState<AdminBooking | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    total_amount: 0,
    paid_amount: 0,
    arrival_date: '',
    departure_date: '',
    notes: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data as AdminBooking[]) ?? []);
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (error) throw error;

      setBookings((b) => b.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenEdit = (b: AdminBooking) => {
    setEditingBooking(b);
    setEditForm({
      status: b.status || 'Pending',
      total_amount: b.total_amount || 0,
      paid_amount: b.paid_amount || 0,
      arrival_date: b.arrival_date || '',
      departure_date: b.departure_date || '',
      notes: b.notes || ''
    });
  };

  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setSavingEdit(true);

    try {
      const payload = {
        status: editForm.status,
        total_amount: Number(editForm.total_amount),
        paid_amount: Number(editForm.paid_amount),
        arrival_date: editForm.arrival_date || null,
        departure_date: editForm.departure_date || null,
        notes: editForm.notes
      };

      const { error } = await supabase.from('bookings').update(payload).eq('id', editingBooking.id);
      if (error) throw error;

      setBookings((prev) =>
        prev.map((item) => (item.id === editingBooking.id ? { ...item, ...payload } : item))
      );
      setEditingBooking(null);
    } catch (err: any) {
      console.error('Error updating booking:', err);
      alert(`Could not save booking update: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.reference.toLowerCase().includes(search.toLowerCase()) ||
        (b.full_name && b.full_name.toLowerCase().includes(search.toLowerCase())) ||
        (b.email && b.email.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;
      if (filter === 'All') return true;
      return b.status === filter;
    });
  }, [bookings, search, filter]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6 font-sans min-w-0">
      
      {/* Header */}
      <PageHeader 
        title="Admin Booking & Quote Manager" 
        subtitle="Manage client requests, update quotes, record payments, and adjust dates."
        action={
          <button 
            onClick={fetchAllBookings}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 shadow-sm"
            title="Refresh All Bookings"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
              placeholder="Search by reference, guest name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full max-w-full overflow-x-auto scrollbar-none pb-1">
          <div className="flex items-center gap-1.5 w-max">
            {['All', ...statuses].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all whitespace-nowrap ${
                  filter === s
                    ? 'bg-[#F06553] text-white border-[#F06553] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-w-0">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[#F06553]" />
            <p className="text-xs sm:text-sm font-medium text-slate-500">Loading booking database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No bookings match your current search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[750px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">Guest Info</th>
                  <th className="px-5 py-3.5">Arrival</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Quote ($)</th>
                  <th className="px-5 py-3.5 text-right">Paid ($)</th>
                  <th className="px-5 py-3.5 text-center">Quick Status</th>
                  <th className="px-5 py-3.5 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {b.reference}
                    </td>
                    <td className="px-5 py-3.5 min-w-[160px]">
                      <div className="font-semibold text-slate-800">{b.full_name || 'Guest'}</div>
                      {b.email && <div className="text-[11px] text-slate-400 truncate">{b.email}</div>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                      {b.arrival_date ? new Date(b.arrival_date).toLocaleDateString() : 'TBD'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                      {b.total_amount != null ? `$${Number(b.total_amount).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 whitespace-nowrap">
                      ${Number(b.paid_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <select
                        disabled={updatingId === b.id}
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#F06553] cursor-pointer"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <Edit3 size={15} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Edit & Financial Drawer Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-7 max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 border border-slate-100 min-w-0">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#F06553] uppercase tracking-wider block">
                  Admin Editor — Ref: {editingBooking.reference}
                </span>
                <h2 className="text-xl font-bold font-serif text-slate-900 mt-0.5">
                  {editingBooking.full_name || 'Guest Booking'}
                </h2>
              </div>
              <button
                onClick={() => setEditingBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="space-y-4 text-xs sm:text-sm">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Booking Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Package Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={editForm.total_amount}
                    onChange={(e) => setEditForm({ ...editForm, total_amount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={editForm.paid_amount}
                    onChange={(e) => setEditForm({ ...editForm, paid_amount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Arrival Date</label>
                  <input
                    type="date"
                    value={editForm.arrival_date}
                    onChange={(e) => setEditForm({ ...editForm, arrival_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departure Date</label>
                <input
                  type="date"
                  value={editForm.departure_date}
                  onChange={(e) => setEditForm({ ...editForm, departure_date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Internal Notes & Itinerary Remarks</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Internal logistics or quotes notes..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 px-5 py-2 bg-[#F06553] text-white rounded-xl font-medium hover:bg-[#e05442] text-xs shadow-sm transition-colors disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}