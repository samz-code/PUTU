import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { DollarSign } from 'lucide-react';

export default function HotelPayments() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('hotels').select('id').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      if (data) {
        const { data: resData } = await supabase.from('hotel_reservations').select('*').eq('hotel_id', data.id).not('total_amount', 'is', null);
        setItems(resData ?? []);
      }
    });
  }, [user]);

  const total = items.reduce((s, r) => s + Number(r.total_amount ?? 0), 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Commission and settlement" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card p-5"><DollarSign size={18} className="text-coral-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">${total.toFixed(2)}</div><div className="text-xs text-slate-500">Total Billed</div></div>
        <div className="card p-5"><DollarSign size={18} className="text-teal-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{items.length}</div><div className="text-xs text-slate-500">Paid Reservations</div></div>
      </div>
      <div className="card-md overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No payments recorded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Check In</th>
                <th className="px-5 py-3 font-medium">Guests</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 text-slate-600">{r.check_in}</td>
                  <td className="px-5 py-3 text-slate-600">{r.num_guests}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-700">${r.total_amount}</td>
                  <td className="px-5 py-3"><span className="badge-slate">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
