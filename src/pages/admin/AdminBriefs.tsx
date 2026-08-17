import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

interface Brief {
  id: string;
  full_name: string;
  email: string;
  arrival_date: string | null;
  occasion: string | null;
  status: string;
  created_at: string;
  num_guests: number;
}

export default function AdminBriefs() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Brief | null>(null);

  useEffect(() => {
    supabase.from('journey_briefs').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setBriefs((data as Brief[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader title="Journey Briefs" subtitle="Customer submissions from the journey planner" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-md overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading...</div>
          ) : briefs.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No journey briefs submitted yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Guest</th>
                  <th className="px-5 py-3 font-medium">Arrival</th>
                  <th className="px-5 py-3 font-medium">Guests</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {briefs.map((b) => (
                  <tr key={b.id} onClick={() => setSelected(b)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-5 py-3 font-medium text-cocoa-700">{b.full_name}</td>
                    <td className="px-5 py-3 text-slate-600">{b.arrival_date ?? 'TBD'}</td>
                    <td className="px-5 py-3 text-slate-600">{b.num_guests}</td>
                    <td className="px-5 py-3"><span className="badge-slate">{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card-md p-6">
          {selected ? (
            <div>
              <h3 className="font-serif text-lg font-semibold text-cocoa-700">{selected.full_name}</h3>
              <p className="text-base text-slate-500">{selected.email}</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div><dt className="text-slate-400">Arrival</dt><dd className="text-slate-700">{selected.arrival_date ?? 'TBD'}</dd></div>
                <div><dt className="text-slate-400">Guests</dt><dd className="text-slate-700">{selected.num_guests}</dd></div>
                <div><dt className="text-slate-400">Occasion</dt><dd className="text-slate-700">{selected.occasion ?? 'Not specified'}</dd></div>
                <div><dt className="text-slate-400">Submitted</dt><dd className="text-slate-700">{new Date(selected.created_at).toLocaleString()}</dd></div>
              </dl>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">Select a brief to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
