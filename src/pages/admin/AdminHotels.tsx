import { useEffect, useState } from 'react';
import { Plus, X, Pencil, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Hotel {
  id: string;
  name: string;
  property_type: string | null;
  location: string | null;
  star_rating: number | null;
  commission_pct: number;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
}

const emptyForm = { name: '', property_type: 'Hotel', location: '', star_rating: 4, commission_pct: 10, contact_email: '', contact_phone: '' };

export default function AdminHotels() {
  const { user } = useAuth();
  const [items, setItems] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    supabase.from('hotels').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError('Unable to load hotels.');
      else setItems((data as Hotel[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (h: Hotel) => {
    setForm({ name: h.name, property_type: h.property_type ?? 'Hotel', location: h.location ?? '', star_rating: h.star_rating ?? 4, commission_pct: h.commission_pct, contact_email: h.contact_email ?? '', contact_phone: h.contact_phone ?? '' });
    setEditId(h.id); setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, star_rating: Number(form.star_rating), commission_pct: Number(form.commission_pct) };
    if (editId) {
      await supabase.from('hotels').update(payload).eq('id', editId);
    } else {
      await supabase.from('hotels').insert({ ...payload, partner_user_id: user?.id });
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const toggleActive = async (h: Hotel) => {
    await supabase.from('hotels').update({ is_active: !h.is_active }).eq('id', h.id);
    setItems((prev) => prev.map((x) => (x.id === h.id ? { ...x, is_active: !x.is_active } : x)));
  };

  return (
    <div>
      <PageHeader title="Hotels" subtitle="Hotel partner management" action={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={16} /> Add Hotel</button>} />

      {showForm && (
        <form onSubmit={save} className="card-md p-5 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-cocoa-700">{editId ? 'Edit Hotel' : 'New Hotel'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Hotel Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Property Type</label>
              <select className="input" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
                {['Hotel', 'Resort', 'Villa', 'Apartment', 'Boutique Hotel'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Location</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className="label">Star Rating</label>
              <select className="input" value={form.star_rating} onChange={(e) => setForm({ ...form, star_rating: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} Stars</option>)}
              </select>
            </div>
            <div><label className="label">Commission %</label><input type="number" step="0.5" className="input" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: Number(e.target.value) })} /></div>
            <div><label className="label">Contact Email</label><input className="input" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div><label className="label">Contact Phone</label><input className="input" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      <div className="card-md overflow-hidden">
        {loading ? <div className="p-6 text-sm text-slate-400">Loading...</div>
        : error ? <div className="flex items-center gap-2 text-coral-600 p-6"><AlertCircle size={18} /><span>{error}</span></div>
        : items.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No hotels registered yet.</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Stars</th>
                <th className="px-5 py-3 font-medium">Commission</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-cocoa-700">{h.name}</td>
                  <td className="px-5 py-3 text-slate-600">{h.property_type ?? '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{h.location ?? '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{h.star_rating ?? '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{h.commission_pct}%</td>
                  <td className="px-5 py-3 text-slate-600">{h.contact_phone ?? h.contact_email ?? '-'}</td>
                  <td className="px-5 py-3"><button onClick={() => toggleActive(h)}><span className={h.is_active ? 'badge-success' : 'badge-slate'}>{h.is_active ? 'Active' : 'Inactive'}</span></button></td>
                  <td className="px-5 py-3 text-right"><button onClick={() => openEdit(h)} className="text-slate-400 hover:text-cocoa-700"><Pencil size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
