import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { DollarSign } from 'lucide-react';

export default function DriverPayments() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('drivers').select('id').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      if (data) {
        const { data: tripData } = await supabase.from('driver_trips').select('*').eq('driver_id', data.id).not('fare', 'is', null);
        setItems(tripData ?? []);
      }
    });
  }, [user]);

  const total = items.reduce((s, t) => s + Number(t.fare ?? 0), 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Your earnings" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card p-5"><DollarSign size={18} className="text-coral-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">${total.toFixed(2)}</div><div className="text-xs text-slate-500">Total Earnings</div></div>
        <div className="card p-5"><DollarSign size={18} className="text-teal-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{items.length}</div><div className="text-xs text-slate-500">Paid Trips</div></div>
      </div>
      <div className="card-md overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No earnings recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Fare</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-3 text-slate-600">{t.pickup_location} to {t.dropoff_location}</td>
                  <td className="px-5 py-3 text-slate-500">{t.pickup_time ? new Date(t.pickup_time).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-700">${t.fare}</td>
                  <td className="px-5 py-3"><span className={t.status === 'Completed' ? 'badge-success' : 'badge-slate'}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
