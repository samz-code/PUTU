import { useEffect, useState } from 'react';
import { FileSpreadsheet, Send, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

interface Quote {
  id: string;
  reference: string;
  brief_id: string;
  total: number;
  status: string;
  created_at: string;
}

interface Brief {
  id: string;
  full_name: string;
  email: string;
}

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [form, setForm] = useState<{ briefId: string; accommodation: string; transport: string; activities: string; dining: string; other: string; discount: string; validUntil: string; notes: string }>({ briefId: '', accommodation: '0', transport: '0', activities: '0', dining: '0', other: '0', discount: '0', validUntil: '', notes: '' });

  const load = () => {
    Promise.all([
      supabase.from('quotes').select('*').order('created_at', { ascending: false }),
      supabase.from('journey_briefs').select('id, full_name, email').order('created_at', { ascending: false }),
    ]).then(([q, b]) => {
      setQuotes((q.data as Quote[]) ?? []);
      setBriefs((b.data as Brief[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const subtotal = Number(form.accommodation) + Number(form.transport) + Number(form.activities) + Number(form.dining) + Number(form.other);
  const total = subtotal - Number(form.discount);

  const createQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    const brief = briefs.find((b) => b.id === form.briefId);
    if (!brief) return;
    await supabase.from('quotes').insert({
      brief_id: form.briefId,
      accommodation_total: Number(form.accommodation),
      transport_total: Number(form.transport),
      activities_total: Number(form.activities),
      dining_total: Number(form.dining),
      other_total: Number(form.other),
      subtotal,
      discount: Number(form.discount),
      total,
      valid_until: form.validUntil || null,
      notes: form.notes,
      status: 'Pending',
    });
    setShowBuilder(false);
    setForm({ briefId: '', accommodation: '0', transport: '0', activities: '0', dining: '0', other: '0', discount: '0', validUntil: '', notes: '' });
    load();
  };

  const sendQuote = async (id: string) => {
    await supabase.from('quotes').update({ status: 'Sent' }).eq('id', id);
    load();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Pending: 'badge-slate', Sent: 'badge-teal', Approved: 'badge-success', Rejected: 'badge-error', Expired: 'badge-slate', Converted: 'badge-success' };
    return map[s] ?? 'badge-slate';
  };

  return (
    <div>
      <PageHeader title="Quotation Builder" subtitle="Prepare professional proposals from journey briefs" action={<button onClick={() => setShowBuilder(!showBuilder)} className="btn-primary text-xs"><FileSpreadsheet size={14} /> New Quote</button>} />

      {showBuilder && (
        <form onSubmit={createQuote} className="card-md p-6 mb-6 space-y-5">
          <h3 className="font-serif text-lg font-semibold text-cocoa-700">Build Quote</h3>
          <div>
            <label className="label">From Journey Brief</label>
            <select className="input" required value={form.briefId} onChange={(e) => setForm({ ...form, briefId: e.target.value })}>
              <option value="">Select a brief...</option>
              {briefs.map((b) => <option key={b.id} value={b.id}>{b.full_name} - {b.email}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="label">Accommodation</label><input type="number" step="0.01" className="input" value={form.accommodation} onChange={(e) => setForm({ ...form, accommodation: e.target.value })} /></div>
            <div><label className="label">Transport</label><input type="number" step="0.01" className="input" value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value })} /></div>
            <div><label className="label">Activities</label><input type="number" step="0.01" className="input" value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} /></div>
            <div><label className="label">Dining</label><input type="number" step="0.01" className="input" value={form.dining} onChange={(e) => setForm({ ...form, dining: e.target.value })} /></div>
            <div><label className="label">Other</label><input type="number" step="0.01" className="input" value={form.other} onChange={(e) => setForm({ ...form, other: e.target.value })} /></div>
            <div><label className="label">Discount</label><input type="number" step="0.01" className="input" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-base text-slate-600">Subtotal</span>
            <span className="font-medium text-cocoa-700">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-coral-50 rounded-lg">
            <span className="text-sm font-medium text-coral-700">Total</span>
            <span className="font-serif text-xl font-semibold text-coral-700">${total.toFixed(2)}</span>
          </div>
          <div><label className="label">Valid Until</label><input type="date" className="input" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></div>
          <div><label className="label">Notes</label><textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary text-xs"><Check size={14} /> Create Quote</button>
            <button type="button" onClick={() => setShowBuilder(false)} className="btn-secondary text-xs">Cancel</button>
          </div>
        </form>
      )}

      <div className="card-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Loading...</div>
        ) : quotes.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No quotes yet. Build one from a journey brief.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-cocoa-700">{q.reference}</td>
                  <td className="px-5 py-3 font-medium text-slate-700">${q.total}</td>
                  <td className="px-5 py-3"><span className={statusBadge(q.status)}>{q.status}</span></td>
                  <td className="px-5 py-3 text-slate-500">{new Date(q.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    {q.status === 'Pending' && (
                      <button onClick={() => sendQuote(q.id)} className="text-xs font-medium text-coral-600 inline-flex items-center gap-1"><Send size={12} /> Send</button>
                    )}
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
