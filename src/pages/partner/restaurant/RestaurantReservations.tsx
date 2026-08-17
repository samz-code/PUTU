import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Res {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  occasion: string | null;
  special_requests: string | null;
  status: string;
}

const statuses = ['Pending', 'Confirmed', 'Declined', 'Completed', 'Cancelled'];

export default function RestaurantReservations() {
  const { user } = useAuth();
  const [items, setItems] = useState<Res[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('restaurants').select('id').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      if (data) {
        const { data: resData } = await supabase.from('restaurant_reservations').select('*').eq('restaurant_id', data.id).order('created_at', { ascending: false });
        setItems((resData as Res[]) ?? []);
      }
    });
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('restaurant_reservations').update({ status }).eq('id', id);
    setItems((r) => r.map((x) => x.id === id ? { ...x, status } : x));
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Pending: 'badge-warning', Confirmed: 'badge-success', Declined: 'badge-error', Completed: 'badge-slate', Cancelled: 'badge-slate' };
    return map[s] ?? 'badge-slate';
  };

  return (
    <div>
      <PageHeader title="Reservations" subtitle="Manage booking requests" />
      <div className="card-md overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No reservation requests yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Party</th>
                <th className="px-5 py-3 font-medium">Occasion</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-600">{r.reservation_date}</td>
                  <td className="px-5 py-3 text-slate-600">{r.reservation_time}</td>
                  <td className="px-5 py-3 text-slate-600">{r.party_size}</td>
                  <td className="px-5 py-3 text-slate-600">{r.occasion ?? '-'}</td>
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
