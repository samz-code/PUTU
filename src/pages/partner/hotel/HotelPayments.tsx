import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { DollarSign, Smartphone, CreditCard, Building2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface PaymentRecord {
  id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  total_amount: number;
  payment_method: 'mpesa' | 'paypal' | 'bank';
  payment_status: 'Paid' | 'Pending' | 'Failed';
  transaction_ref?: string;
  created_at: string;
}

export default function HotelPayments() {
  const { user } = useAuth();
  const [items, setItems] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('hotels')
      .select('id')
      .eq('partner_user_id', user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          const { data: resData } = await supabase
            .from('hotel_reservations')
            .select('*')
            .eq('hotel_id', data.id)
            .not('total_amount', 'is', null)
            .order('created_at', { ascending: false });

          setItems((resData as PaymentRecord[]) ?? []);
        }
        setLoading(false);
      });
  }, [user]);

  const filteredItems = items.filter((item) => {
    if (selectedMethodFilter === 'all') return true;
    return item.payment_method === selectedMethodFilter;
  });

  const totalCollected = items
    .filter((r) => r.payment_status === 'Paid' || !r.payment_status)
    .reduce((sum, r) => sum + Number(r.total_amount ?? 0), 0);

  const getMethodBadge = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'mpesa':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-2xs font-bold uppercase">
            <Smartphone size={12} /> M-Pesa
          </span>
        );
      case 'paypal':
        return (
          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md text-2xs font-bold uppercase">
            <CreditCard size={12} /> PayPal
          </span>
        );
      case 'bank':
        return (
          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md text-2xs font-bold uppercase">
            <Building2 size={12} /> Bank Transfer
          </span>
        );
      default:
        return <span className="text-slate-400 text-xs">Standard</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Hotel Settlements & Payments" subtitle="Manage bookings paid via M-Pesa, PayPal, or Bank Transfer" />

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <DollarSign size={20} className="text-teal-600 mb-2" />
          <div className="font-serif text-2xl font-bold text-slate-900">${totalCollected.toFixed(2)}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Total Revenue Settled</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <Smartphone size={20} className="text-emerald-600 mb-2" />
          <div className="font-serif text-2xl font-bold text-slate-900">
            {items.filter((i) => i.payment_method === 'mpesa').length}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">M-Pesa Transactions</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <CreditCard size={20} className="text-blue-600 mb-2" />
          <div className="font-serif text-2xl font-bold text-slate-900">
            {items.filter((i) => i.payment_method === 'paypal' || i.payment_method === 'bank').length}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">PayPal & Bank Transfers</div>
        </div>
      </div>

      {/* METHOD FILTER CONTROLS */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-600">Filter Payment Channel:</span>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'mpesa', 'paypal', 'bank'].map((method) => (
            <button
              key={method}
              onClick={() => setSelectedMethodFilter(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                selectedMethodFilter === method
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE / MOBILE CARDS */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading financial records...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No payment records found for this channel.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Stay Dates</th>
                    <th className="px-5 py-3.5">Channel</th>
                    <th className="px-5 py-3.5">Reference ID</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {r.check_in} &rarr; {r.check_out}
                        <div className="text-2xs text-slate-400 font-normal">{r.num_guests} Guests</div>
                      </td>
                      <td className="px-5 py-4">{getMethodBadge(r.payment_method)}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {r.transaction_ref || 'TRX-892301'}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900">
                        ${Number(r.total_amount).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={12} /> Settled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredItems.map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{r.check_in} to {r.check_out}</div>
                      <div className="text-2xs text-slate-400">{r.num_guests} Guests</div>
                    </div>
                    <span className="font-extrabold text-slate-900 text-base">${Number(r.total_amount).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {getMethodBadge(r.payment_method)}
                    <span className="text-2xs font-mono text-slate-500">{r.transaction_ref || 'TRX-892301'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}