import { useEffect, useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

interface Setting {
  key: string;
  value: any;
  description: string | null;
}

export default function AdminSettings() {
  const [items, setItems] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    supabase.from('settings').select('*').order('key').then(({ data, error }) => {
      if (error) setError('Unable to load settings.');
      else setItems((data as Setting[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openEdit = (s: Setting) => {
    setEditKey(s.key);
    setEditValue(typeof s.value === 'object' ? JSON.stringify(s.value, null, 2) : String(s.value));
  };

  const save = async () => {
    if (!editKey) return;
    setSaving(true);
    let parsedValue: any = editValue;
    try { parsedValue = JSON.parse(editValue); } catch { parsedValue = editValue; }
    await supabase.from('settings').update({ value: parsedValue, updated_at: new Date().toISOString() }).eq('key', editKey);
    setSaving(false);
    setEditKey(null);
    load();
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration" />

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : error ? (
        <div className="flex items-center gap-2 text-coral-600"><AlertCircle size={18} /><span>{error}</span></div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center"><p className="text-base text-slate-500">No settings configured yet.</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.key} className="card p-4">
              {editKey === s.key ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-cocoa-700">{s.key}</span>
                    <button onClick={() => setEditKey(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                  </div>
                  {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                  <textarea className="input font-mono text-sm" rows={3} value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                  <button onClick={save} disabled={saving} className="btn-primary text-sm"><Save size={14} /> {saving ? 'Saving...' : 'Save'}</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-cocoa-700">{s.key}</div>
                    {s.description && <div className="text-xs text-slate-500">{s.description}</div>}
                    <div className="text-sm text-slate-600 font-mono truncate mt-1">{typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)}</div>
                  </div>
                  <button onClick={() => openEdit(s)} className="text-sm text-coral-600 font-medium hover:text-coral-700 ml-4">Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
