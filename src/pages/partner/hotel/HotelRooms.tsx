import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

export default function HotelRooms() {
  const { user } = useAuth();
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ name: string; capacity: string; price: string; amenities: string }>({ name: '', capacity: '2', price: '', amenities: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('hotels').select('id').eq('partner_user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) setHotelId(data.id);
    });
  }, [user]);

  const load = () => {
    if (!hotelId) return;
    supabase.from('hotel_rooms').select('*').eq('hotel_id', hotelId).order('created_at', { ascending: false }).then(({ data }) => {
      setRooms(data ?? []);
    });
  };

  useEffect(() => { load(); }, [hotelId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    await supabase.from('hotel_rooms').insert({
      hotel_id: hotelId,
      name: form.name,
      capacity: Number(form.capacity),
      price_per_night: form.price ? Number(form.price) : null,
      amenities: form.amenities ? form.amenities.split(',').map((s) => s.trim()) : [],
    });
    setShowForm(false);
    setForm({ name: '', capacity: '2', price: '', amenities: '' });
    load();
  };

  return (
    <div>
      <PageHeader title="Rooms" subtitle="Manage your room types" action={<button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs">Add Room</button>} />
      {showForm && (
        <form onSubmit={add} className="card-md p-5 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
          <div><label className="label">Price/Night</label><input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div><label className="label">Amenities (comma)</label><input className="input" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} /></div>
          <div className="sm:col-span-4 flex gap-2"><button type="submit" className="btn-primary text-xs">Save</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs">Cancel</button></div>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((r) => (
          <div key={r.id} className="card p-5">
            <h3 className="font-serif text-lg font-semibold text-cocoa-700">{r.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{r.capacity} guests</p>
            {r.price_per_night && <p className="text-sm font-medium text-coral-600 mt-2">${r.price_per_night}/night</p>}
            {r.amenities && r.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {r.amenities.map((a: string) => <span key={a} className="badge-slate text-2xs">{a}</span>)}
              </div>
            )}
          </div>
        ))}
        {rooms.length === 0 && <p className="text-sm text-slate-400 col-span-full text-center py-6">No rooms added yet.</p>}
      </div>
    </div>
  );
}
