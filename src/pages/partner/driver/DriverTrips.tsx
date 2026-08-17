import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { Navigation } from 'lucide-react';

interface Trip {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string | null;
  customer_contact: string;
  status: string;
  fare: number | null;
}

const statuses = ['Assigned', 'En Route', 'Picked Up', 'Completed', 'Cancelled'];

export default function DriverTrips() {
  const { user } = useAuth();
  const [items, setItems] = useState<Trip[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('drivers').select('id').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      if (data) {
        const { data: tripData } = await supabase.from('driver_trips').select('*').eq('driver_id', data.id).order('pickup_time', { ascending: true });
        setItems((tripData as Trip[]) ?? []);
      }
    });
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('driver_trips').update({ status }).eq('id', id);
    setItems((t) => t.map((x) => x.id === id ? { ...x, status } : x));
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Assigned: 'badge-warning', 'En Route': 'badge-teal', 'Picked Up': 'badge-teal', Completed: 'badge-success', Cancelled: 'badge-error' };
    return map[s] ?? 'badge-slate';
  };

  return (
    <div>
      <PageHeader title="Trips" subtitle="Your assigned trips" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 ? (
          <div className="card p-10 text-center md:col-span-2">
            <Navigation size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-base text-slate-500">No trips assigned yet.</p>
          </div>
        ) : (
          items.map((t) => (
            <div key={t.id} className="card-md p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-base font-medium text-cocoa-700">{t.pickup_location} to {t.dropoff_location}</div>
                  <div className="text-xs text-slate-500 mt-1">{t.pickup_time ? new Date(t.pickup_time).toLocaleString() : 'Time TBD'}</div>
                </div>
                <span className={statusBadge(t.status)}>{t.status}</span>
              </div>
              <div className="text-sm text-slate-600 mb-3">Customer: {t.customer_contact}</div>
              {t.fare != null && <div className="text-sm font-medium text-slate-700 mb-3">Fare: ${t.fare}</div>}
              <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="text-xs border border-slate-200 rounded px-3 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-coral-500">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
