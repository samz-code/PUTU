import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { 
  Plus, Trash2, Calendar as CalendarIcon, Ban, 
  Search, ShieldAlert, Sparkles, RefreshCw, AlertCircle 
} from 'lucide-react';

interface Avail {
  id: string;
  hotel_id: string;
  date: string;
  is_available: boolean;
  note: string | null;
  created_at?: string;
}

export default function HotelAvailability() {
  const { user } = useAuth();
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [items, setItems] = useState<Avail[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('hotels')
      .select('id')
      .eq('partner_user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setHotelId(data.id);
      });
  }, [user]);

  const loadAvailability = async () => {
    if (!hotelId) return;
    setLoading(true);
    const { data } = await supabase
      .from('hotel_availability')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('date', { ascending: true });

    setItems((data as Avail[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadAvailability();
  }, [hotelId]);

  // Helper to generate a date range array [YYYY-MM-DD, ...]
  const getDatesInRange = (startStr: string, endStr: string): string[] => {
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date(startStr);
    const dates: string[] = [];

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handleAddBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !startDate) return;

    setSubmitting(true);
    const datesToBlock = getDatesInRange(startDate, endDate || startDate);

    const payload = datesToBlock.map((d) => ({
      hotel_id: hotelId,
      date: d,
      is_available: false,
      note: note.trim() || 'Blackout Period',
    }));

    await supabase.from('hotel_availability').upsert(payload, { onConflict: 'hotel_id,date' });

    setStartDate('');
    setEndDate('');
    setNote('');
    setSubmitting(false);
    loadAvailability();
  };

  const handleQuickPreset = (daysAhead: number) => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + daysAhead);

    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(future.toISOString().split('T')[0]);
  };

  const removeBlackout = async (id: string) => {
    // Optimistic UI update
    setItems((prev) => prev.filter((item) => item.id !== id));
    await supabase.from('hotel_availability').delete().eq('id', id);
    loadAvailability();
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.date.includes(q) || (item.note && item.note.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Room Availability & Blackouts" 
        subtitle="Manage calendar restrictions, maintenance blocks, and sold-out dates" 
      />

      {/* QUICK PRESETS & FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Ban size={16} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-900 text-base">Set Blackout Dates</h3>
              <p className="text-2xs text-slate-500">Block single dates or date ranges from being booked.</p>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-2xs font-semibold text-slate-400 mr-1">Quick Select:</span>
            <button
              type="button"
              onClick={() => handleQuickPreset(2)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs font-semibold rounded-md transition-colors"
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(6)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs font-semibold rounded-md transition-colors"
            >
              +7 Days
            </button>
          </div>
        </div>

        <form onSubmit={handleAddBlackout} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="label text-xs font-semibold text-slate-700">Start Date</label>
            <input
              type="date"
              className="input text-xs"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-xs font-semibold text-slate-700">End Date (Optional)</label>
            <input
              type="date"
              className="input text-xs"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Same as start if empty"
            />
          </div>

          <div>
            <label className="label text-xs font-semibold text-slate-700">Blackout Reason / Note</label>
            <input
              className="input text-xs"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Renovation, Private Event"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5 w-full"
          >
            {submitting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            <span>{submitting ? 'Updating...' : 'Add Blackout Period'}</span>
          </button>
        </form>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input text-xs pl-9 pr-4 py-2 w-full"
            placeholder="Search blackout dates or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium self-end sm:self-auto">
          <span>Total Blackouts: </span>
          <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md">
            {filteredItems.length}
          </span>
        </div>
      </div>

      {/* BLACKOUT DATES TABLE LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading availability calendar...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CalendarIcon size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No blackout dates found.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? 'Try matching a different search keyword.' : 'All dates are currently available for client reservations.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((a) => (
              <div
                key={a.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{a.date}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {a.note || 'No reason specified'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                    Unavailable
                  </span>
                  <button
                    onClick={() => removeBlackout(a.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove blackout"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}