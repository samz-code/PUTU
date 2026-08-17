import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { ShieldCheck, ScrollText, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entity: string | null;
  details: any;
  created_at: string;
}

export default function AdminSuper() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
      setLogs((data as AuditLog[]) ?? []);
      setLoading(false);
    });
  }, []);

  const roles = ['Super Admin', 'Founder / CEO', 'Operations Manager', 'Concierge Consultant', 'Finance Officer', 'Customer Support', 'Driver', 'Tour Guide', 'Hotel Partner', 'Restaurant Partner', 'Customer'];

  return (
    <div>
      <PageHeader title="Super Admin" subtitle="Roles, permissions, and audit logs" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={20} className="text-coral-600" />
            <h2 className="font-serif text-lg font-semibold text-cocoa-700">User Roles</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roles.map((r) => (
              <div key={r} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-sm text-slate-700">{r}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={20} className="text-coral-600" />
            <h2 className="font-serif text-lg font-semibold text-cocoa-700">System Status</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <span className="text-base text-slate-600">Database</span>
              <span className="badge-success">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <span className="text-base text-slate-600">Authentication</span>
              <span className="badge-success">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <span className="text-base text-slate-600">Edge Functions</span>
              <span className="badge-success">Operational</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <ScrollText size={20} className="text-coral-600" />
          <h2 className="font-serif text-lg font-semibold text-cocoa-700">Audit Logs</h2>
        </div>
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No audit logs recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((l) => (
              <div key={l.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-base font-medium text-cocoa-700">{l.action}</span>
                  {l.entity && <span className="text-base text-slate-500"> on {l.entity}</span>}
                </div>
                <span className="text-xs text-slate-400">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
