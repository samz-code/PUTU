import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Res {
  id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  room_type: string | null;
  status: string;
  notes: string | null;
}

const statuses = ['Pending', 'Confirmed', 'Declined', 'Checked In', 'Checked Out', 'Cancelled'];

export default function HotelReservations() {
  const { user } = useAuth();
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [items, setItems] = useState<Res[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('hotels').select('id').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      if (data) {
        setHotelId(data.id);
        const { data: resData } = await supabase.from('hotel_reservations').select('*').eq('hotel_id', data.id).order('created_at', { ascending: false });
        setItems((resData as Res[]) ?? []);
      }
    });
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('hotel_reservations').update({ status }).eq('id', id);
    setItems((r) => r.map((x) => x.id === id ? { ...x, status } : x));
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Pending: 'badge-warning', Confirmed: 'badge-success', Declined: 'badge-error', 'Checked In': 'badge-teal', 'Checked Out': 'badge-slate', Cancelled: 'badge-slate' };
    return map[s] ?? 'badge-slate';
  };

  return (
    <div>
      <PageHeader title="Reservations" subtitle="Booking requests from Putu Travels" />
      <div className="card-md overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No reservation requests yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Check In</th>
                <th className="px-5 py-3 font-medium">Check Out</th>
                <th className="px-5 py-3 font-medium">Guests</th>
                <th className="px-5 py-3 font-medium">Room</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-600">{r.check_in}</td>
                  <td className="px-5 py-3 text-slate-600">{r.check_out}</td>
                  <td className="px-5 py-3 text-slate-600">{r.num_guests}</td>
                  <td className="px-5 py-3 text-slate-600">{r.room_type ?? 'Any'}</td>
                  <td className="px-5 py-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td className="px-5 py-3">
                    <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-coral-500">
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
