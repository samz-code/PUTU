import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Assign {
  id: string;
  scheduled_date: string | null;
  num_guests: number;
  status: string;
}

const statuses = ['Assigned', 'Confirmed', 'Completed', 'Cancelled'];

export default function GuideAssignments() {
  const { user } = useAuth();
  const [items, setItems] = useState<Assign[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('tour_guides').select('id').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      if (data) {
        const { data: aData } = await supabase.from('guide_assignments').select('*').eq('guide_id', data.id).order('scheduled_date', { ascending: true });
        setItems((aData as Assign[]) ?? []);
      }
    });
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('guide_assignments').update({ status }).eq('id', id);
    setItems((a) => a.map((x) => x.id === id ? { ...x, status } : x));
  };

  return (
    <div>
      <PageHeader title="Assignments" subtitle="Your activity assignments" />
      <div className="card-md overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No assignments yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Guests</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-600">{a.scheduled_date ?? 'TBD'}</td>
                  <td className="px-5 py-3 text-slate-600">{a.num_guests}</td>
                  <td className="px-5 py-3"><span className="badge-slate">{a.status}</span></td>
                  <td className="px-5 py-3">
                    <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-coral-500">
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
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
