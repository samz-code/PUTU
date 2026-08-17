import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { Plus } from 'lucide-react';

interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  capacity: number;
  status: string;
  current_mileage: number;
  fuel_level: number;
}

const vehicleTypes = ['Sedan', 'SUV', 'G-Wagon', 'Van'];
const vehicleStatuses = ['Available', 'On Trip', 'Maintenance', 'Retired'];

export default function AdminFleet() {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ plate_number: string; vehicle_type: string; make: string; model: string; year: string; capacity: string }>({ plate_number: '', vehicle_type: 'Sedan', make: '', model: '', year: '', capacity: '4' });

  const load = () => {
    supabase.from('vehicles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setItems((data as Vehicle[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('vehicles').insert({
      plate_number: form.plate_number,
      vehicle_type: form.vehicle_type,
      make: form.make || null,
      model: form.model || null,
      year: form.year ? Number(form.year) : null,
      capacity: Number(form.capacity),
    });
    setShowForm(false);
    setForm({ plate_number: '', vehicle_type: 'Sedan', make: '', model: '', year: '', capacity: '4' });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('vehicles').update({ status }).eq('id', id);
    setItems((v) => v.map((x) => x.id === id ? { ...x, status } : x));
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Available: 'badge-success', 'On Trip': 'badge-teal', Maintenance: 'badge-warning', Retired: 'badge-slate' };
    return map[s] ?? 'badge-slate';
  };

  return (
    <div>
      <PageHeader title="Fleet Management" subtitle="Vehicles, maintenance, and availability" action={<button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs"><Plus size={14} /> Add Vehicle</button>} />
      {showForm && (
        <form onSubmit={add} className="card-md p-5 mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div><label className="label">Plate Number</label><input className="input" required value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} /></div>
          <div><label className="label">Type</label><select className="input" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>{vehicleTypes.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className="label">Make</label><input className="input" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></div>
          <div><label className="label">Model</label><input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
          <div><label className="label">Year</label><input type="number" className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
          <div><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
          <div className="col-span-2 flex gap-2"><button type="submit" className="btn-primary text-xs">Add</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs">Cancel</button></div>
        </form>
      )}
      <div className="card-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No vehicles in the fleet yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Plate</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Make/Model</th>
                <th className="px-5 py-3 font-medium">Mileage</th>
                <th className="px-5 py-3 font-medium">Fuel</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-cocoa-700">{v.plate_number}</td>
                  <td className="px-5 py-3 text-slate-600">{v.vehicle_type}</td>
                  <td className="px-5 py-3 text-slate-600">{[v.make, v.model].filter(Boolean).join(' ') || '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{v.current_mileage.toLocaleString()} km</td>
                  <td className="px-5 py-3 text-slate-600">{v.fuel_level}%</td>
                  <td className="px-5 py-3">
                    <select value={v.status} onChange={(e) => updateStatus(v.id, e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-coral-500">
                      {vehicleStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
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
