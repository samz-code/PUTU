import { useEffect, useState } from 'react';
import { FolderOpen, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Doc {
  id: string;
  type: string;
  file_name: string;
  status: string;
  uploaded_at: string;
}

const docTypes = ['Passport', 'Ticket', 'Invoice', 'Contract', 'Receipt', 'Travel Insurance', 'Visa', 'Other'];

export default function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('Passport');
  const [fileName, setFileName] = useState('');

  const load = () => {
    if (!user) return;
    supabase.from('documents').select('*').eq('user_id', user.id).order('uploaded_at', { ascending: false }).then(({ data }) => {
      setDocs((data as Doc[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await supabase.from('documents').insert({ user_id: user.id, type, file_name: fileName || `${type} document` });
    setShowForm(false);
    setFileName('');
    load();
  };

  return (
    <div>
      <PageHeader title="Travel Documents" subtitle="Your passports, tickets, and contracts" action={<button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs"><Upload size={14} /> Upload</button>} />
      {showForm && (
        <form onSubmit={handleAdd} className="card-md p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {docTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">File Name</label>
            <input className="input" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="passport.pdf" />
          </div>
          <button type="submit" className="btn-primary text-xs">Save</button>
        </form>
      )}
      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : docs.length === 0 ? (
        <div className="card p-10 text-center">
          <FolderOpen size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-base text-slate-500">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((d) => (
            <div key={d.id} className="card p-5 flex items-center justify-between">
              <div>
                <div className="font-medium text-cocoa-700 text-sm">{d.file_name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{d.type} - {new Date(d.uploaded_at).toLocaleDateString()}</div>
              </div>
              <span className="badge-slate">{d.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
