import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { TrendingUp, DollarSign, FileText, Users } from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState({ revenue: 0, bookings: 0, customers: 0, avgValue: 0 });
  const [monthlyData, setMonthlyData] = useState<number[]>(Array(12).fill(0));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('payments').select('amount, status, paid_at'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
    ]).then(([p, b, c]) => {
      const payments = (p.data as any[]) ?? [];
      const completed = payments.filter((x) => x.status === 'Completed');
      const revenue = completed.reduce((s, x) => s + Number(x.amount), 0);
      const bookings = b.count ?? 0;

      const months = Array(12).fill(0);
      completed.forEach((x) => {
        const date = new Date(x.paid_at ?? x.created_at);
        if (!isNaN(date.getTime())) months[date.getMonth()] += Number(x.amount);
      });

      setStats({ revenue, bookings, customers: c.count ?? 0, avgValue: bookings > 0 ? revenue / bookings : 0 });
      setMonthlyData(months);
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-coral-600' },
    { label: 'Total Bookings', value: stats.bookings, icon: FileText, color: 'text-teal-600' },
    { label: 'Customers', value: stats.customers, icon: Users, color: 'text-cocoa-600' },
    { label: 'Avg Booking Value', value: `$${stats.avgValue.toFixed(0)}`, icon: TrendingUp, color: 'text-coral-600' },
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxVal = Math.max(...monthlyData, 1);

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Revenue, bookings, and performance" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="w-9 h-9 rounded-lg bg-coral-50 flex items-center justify-center mb-3">
              <c.icon size={18} className={c.color} />
            </div>
            <div className="font-serif text-2xl font-semibold text-cocoa-700">{loading ? '-' : c.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="card-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-lg font-semibold text-cocoa-700">Monthly Revenue</h2>
          <span className="text-sm text-slate-500">Based on completed payments</span>
        </div>
        <div className="flex items-end gap-2 h-48">
          {monthlyData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-coral-100 rounded-t" style={{ height: `${(v / maxVal) * 100}%`, minHeight: v > 0 ? '4px' : '0' }}>
                <div className="w-full bg-coral-500 rounded-t h-full opacity-80" />
              </div>
              <span className="text-xs text-slate-400">{months[i]}</span>
            </div>
          ))}
        </div>
        {monthlyData.every((v) => v === 0) && !loading && (
          <p className="text-center text-sm text-slate-400 mt-4">No payment data yet for this year.</p>
        )}
      </div>
    </div>
  );
}
