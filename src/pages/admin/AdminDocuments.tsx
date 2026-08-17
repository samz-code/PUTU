import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

interface Doc {
  id: string;
  type: string;
  file_name: string;
  status: string;
  uploaded_at: string;
}

export default function AdminDocuments() {
  const [items, setItems] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('documents').select('*').order('uploaded_at', { ascending: false }).then(({ data }) => {
      setItems((data as Doc[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader title="Document Center" subtitle="All uploaded documents across the system" />
      <div className="card-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No documents uploaded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-sm uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-cocoa-700">{d.file_name}</td>
                  <td className="px-5 py-3 text-slate-600">{d.type}</td>
                  <td className="px-5 py-3"><span className="badge-slate">{d.status}</span></td>
                  <td className="px-5 py-3 text-slate-500">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
