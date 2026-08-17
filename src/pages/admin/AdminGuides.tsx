import { useEffect, useState } from 'react';
import { Plus, X, Pencil, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Guide {
  id: string;
  full_name: string;
  phone: string | null;
  languages: string[] | null;
  rating: number;
  is_available: boolean;
}

export default function AdminGuides() {
  const { user } = useAuth();
  const [items, setItems] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: '', phone: '', languages: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    supabase.from('tour_guides').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError('Unable to load guides.');
      else setItems((data as Guide[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ full_name: '', phone: '', languages: '' }); setEditId(null); setShowForm(true); };
  const openEdit = (g: Guide) => { setForm({ full_name: g.full_name, phone: g.phone ?? '', languages: (g.languages ?? []).join(', ') }); setEditId(g.id); setShowForm(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const langArr = form.languages.split(',').map((s) => s.trim()).filter(Boolean);
    if (editId) {
      await supabase.from('tour_guides').update({ full_name: form.full_name, phone: form.phone, languages: langArr }).eq('id', editId);
    } else {
      await supabase.from('tour_guides').insert({ full_name: form.full_name, phone: form.phone, languages: langArr, partner_user_id: user?.id });
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const toggleAvailability = async (g: Guide) => {
    await supabase.from('tour_guides').update({ is_available: !g.is_available }).eq('id', g.id);
    setItems((prev) => prev.map((x) => (x.id === g.id ? { ...x, is_available: !x.is_available } : x)));
  };

  return (
    <div>
      <PageHeader title="Tour Guides" subtitle="Guide partner management" action={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={16} /> Add Guide</button>} />

      {showForm && (
        <form onSubmit={save} className="card-md p-5 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-cocoa-700">{editId ? 'Edit Guide' : 'New Guide'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="label">Full Name</label><input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">Languages (comma-separated)</label><input className="input" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="English, Swahili, French" /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      <div className="card-md overflow-hidden">
        {loading ? <div className="p-6 text-sm text-slate-400">Loading...</div>
        : error ? <div className="flex items-center gap-2 text-coral-600 p-6"><AlertCircle size={18} /><span>{error}</span></div>
        : items.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No guides registered yet.</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Languages</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Availability</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-cocoa-700">{g.full_name}</td>
                  <td className="px-5 py-3 text-slate-600">{g.phone ?? '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{(g.languages ?? []).join(', ') || '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{g.rating.toFixed(1)}</td>
                  <td className="px-5 py-3"><button onClick={() => toggleAvailability(g)}><span className={g.is_available ? 'badge-success' : 'badge-slate'}>{g.is_available ? 'Available' : 'Unavailable'}</span></button></td>
                  <td className="px-5 py-3 text-right"><button onClick={() => openEdit(g)} className="text-slate-400 hover:text-cocoa-700"><Pencil size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
