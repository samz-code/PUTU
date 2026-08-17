import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { Plus, Trash2 } from 'lucide-react';

interface Avail {
  id: string;
  date: string;
  is_available: boolean;
  note: string | null;
}

export default function HotelAvailability() {
  const { user } = useAuth();
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [items, setItems] = useState<Avail[]>([]);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('hotels').select('id').eq('partner_user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) setHotelId(data.id);
    });
  }, [user]);

  const load = () => {
    if (!hotelId) return;
    supabase.from('hotel_availability').select('*').eq('hotel_id', hotelId).order('date', { ascending: false }).then(({ data }) => {
      setItems((data as Avail[]) ?? []);
    });
  };

  useEffect(() => { load(); }, [hotelId]);

  const addBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !date) return;
    await supabase.from('hotel_availability').upsert({ hotel_id: hotelId, date, is_available: false, note });
    setDate('');
    setNote('');
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('hotel_availability').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <PageHeader title="Availability" subtitle="Manage blackout dates" />
      <form onSubmit={addBlackout} className="card-md p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div><label className="label">Date</label><input type="date" className="input" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><label className="label">Note</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for blackout" /></div>
        <button type="submit" className="btn-primary text-xs"><Plus size={14} /> Add Blackout</button>
      </form>
      <div className="card-md p-6">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No blackout dates set.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((a) => (
              <div key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-base font-medium text-cocoa-700">{a.date}</span>
                  {a.note && <span className="text-sm text-slate-500 ml-2">- {a.note}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge-error">Unavailable</span>
                  <button onClick={() => remove(a.id)} className="text-slate-400 hover:text-error-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
