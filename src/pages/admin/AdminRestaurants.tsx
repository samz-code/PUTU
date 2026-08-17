import { useEffect, useState } from 'react';
import { Plus, X, Pencil, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string | null;
  location: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
}

const emptyForm = { name: '', cuisine: '', location: '', contact_email: '', contact_phone: '' };

export default function AdminRestaurants() {
  const { user } = useAuth();
  const [items, setItems] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    supabase.from('restaurants').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError('Unable to load restaurants.');
      else setItems((data as Restaurant[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (r: Restaurant) => {
    setForm({ name: r.name, cuisine: r.cuisine ?? '', location: r.location ?? '', contact_email: r.contact_email ?? '', contact_phone: r.contact_phone ?? '' });
    setEditId(r.id); setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editId) {
      await supabase.from('restaurants').update(form).eq('id', editId);
    } else {
      await supabase.from('restaurants').insert({ ...form, partner_user_id: user?.id });
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const toggleActive = async (r: Restaurant) => {
    await supabase.from('restaurants').update({ is_active: !r.is_active }).eq('id', r.id);
    setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: !x.is_active } : x)));
  };

  return (
    <div>
      <PageHeader title="Restaurants" subtitle="Restaurant partner management" action={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={16} /> Add Restaurant</button>} />

      {showForm && (
        <form onSubmit={save} className="card-md p-5 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-cocoa-700">{editId ? 'Edit Restaurant' : 'New Restaurant'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Restaurant Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Cuisine</label><input className="input" value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} placeholder="Italian, Seafood, etc." /></div>
            <div><label className="label">Location</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className="label">Contact Email</label><input className="input" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div><label className="label">Contact Phone</label><input className="input" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      <div className="card-md overflow-hidden">
        {loading ? <div className="p-6 text-sm text-slate-400">Loading...</div>
        : error ? <div className="flex items-center gap-2 text-coral-600 p-6"><AlertCircle size={18} /><span>{error}</span></div>
        : items.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No restaurants registered yet.</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Cuisine</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-cocoa-700">{r.name}</td>
                  <td className="px-5 py-3 text-slate-600">{r.cuisine ?? '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{r.location ?? '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{r.contact_phone ?? r.contact_email ?? '-'}</td>
                  <td className="px-5 py-3"><button onClick={() => toggleActive(r)}><span className={r.is_active ? 'badge-success' : 'badge-slate'}>{r.is_active ? 'Active' : 'Inactive'}</span></button></td>
                  <td className="px-5 py-3 text-right"><button onClick={() => openEdit(r)} className="text-slate-400 hover:text-cocoa-700"><Pencil size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
