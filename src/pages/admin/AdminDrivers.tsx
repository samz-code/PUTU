import { useEffect, useState } from 'react';
import { Plus, X, Pencil, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Driver {
  id: string;
  full_name: string;
  phone: string | null;
  license_number: string | null;
  rating: number;
  is_available: boolean;
}

export default function AdminDrivers() {
  const { user } = useAuth();
  const [items, setItems] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: '', phone: '', license_number: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    supabase.from('drivers').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError('Unable to load drivers.');
      else setItems((data as Driver[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ full_name: '', phone: '', license_number: '' }); setEditId(null); setShowForm(true); };
  const openEdit = (d: Driver) => { setForm({ full_name: d.full_name, phone: d.phone ?? '', license_number: d.license_number ?? '' }); setEditId(d.id); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editId) {
      await supabase.from('drivers').update({ full_name: form.full_name, phone: form.phone, license_number: form.license_number }).eq('id', editId);
    } else {
      await supabase.from('drivers').insert({ full_name: form.full_name, phone: form.phone, license_number: form.license_number, partner_user_id: user?.id });
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const toggleAvailability = async (d: Driver) => {
    await supabase.from('drivers').update({ is_available: !d.is_available }).eq('id', d.id);
    setItems((prev) => prev.map((x) => (x.id === d.id ? { ...x, is_available: !x.is_available } : x)));
  };

  return (
    <div>
      <PageHeader title="Drivers" subtitle="Driver partner management" action={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={16} /> Add Driver</button>} />

      {showForm && (
        <form onSubmit={save} className="card-md p-5 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-cocoa-700">{editId ? 'Edit Driver' : 'New Driver'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="label">Full Name</label><input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">License Number</label><input className="input" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      <div className="card-md overflow-hidden">
        {loading ? <div className="p-6 text-sm text-slate-400">Loading...</div>
        : error ? <div className="flex items-center gap-2 text-coral-600 p-6"><AlertCircle size={18} /><span>{error}</span></div>
        : items.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No drivers registered yet.</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">License</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Availability</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-cocoa-700">{d.full_name}</td>
                  <td className="px-5 py-3 text-slate-600">{d.phone ?? '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{d.license_number ?? '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{d.rating.toFixed(1)}</td>
                  <td className="px-5 py-3"><button onClick={() => toggleAvailability(d)}><span className={d.is_available ? 'badge-success' : 'badge-slate'}>{d.is_available ? 'Available' : 'Unavailable'}</span></button></td>
                  <td className="px-5 py-3 text-right"><button onClick={() => openEdit(d)} className="text-slate-400 hover:text-cocoa-700"><Pencil size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
