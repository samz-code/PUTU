import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { Calendar as CalIcon } from 'lucide-react';

interface Booking {
  id: string;
  reference: string;
  full_name: string;
  arrival_date: string | null;
  departure_date: string | null;
  status: string;
}

export default function AdminCalendar() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    supabase.from('bookings').select('*').order('arrival_date', { ascending: true }).then(({ data }) => {
      setBookings((data as Booking[]) ?? []);
      setLoading(false);
    });
  }, []);

  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const lastDay = new Date(year, m + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const bookingsForDay = (day: number) => {
    const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter((b) => b.arrival_date === dateStr || b.departure_date === dateStr);
  };

  const monthName = month.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Bookings, arrivals, and departures" />
      <div className="card-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-lg font-semibold text-cocoa-700">{monthName}</h2>
          <div className="flex gap-2">
            <button onClick={() => setMonth(new Date(year, m - 1, 1))} className="btn-secondary py-1.5 px-3 text-xs">Previous</button>
            <button onClick={() => setMonth(new Date(year, m + 1, 1))} className="btn-secondary py-1.5 px-3 text-xs">Next</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <div key={i} className="min-h-[80px] p-1.5 rounded border border-slate-100 bg-white">
              {day && (
                <>
                  <div className="text-xs font-medium text-slate-700">{day}</div>
                  <div className="mt-1 space-y-1">
                    {bookingsForDay(day).slice(0, 2).map((b) => (
                      <div key={b.id} className="text-2xs px-1.5 py-0.5 rounded bg-coral-50 text-coral-700 truncate">{b.reference}</div>
                    ))}
                    {bookingsForDay(day).length > 2 && <div className="text-2xs text-slate-400">+{bookingsForDay(day).length - 2} more</div>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        {loading && bookings.length === 0 && (
          <div className="text-center py-6 text-sm text-slate-400"><CalIcon className="mx-auto mb-2 text-slate-300" size={24} /> Loading calendar...</div>
        )}
      </div>
    </div>
  );
}
