import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { Calendar, Star, Users, Compass } from 'lucide-react';

export default function GuideDashboard() {
  const { user } = useAuth();
  const [guide, setGuide] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('tour_guides').select('*').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      setGuide(data);
      if (data) {
        const { data: aData } = await supabase.from('guide_assignments').select('*').eq('guide_id', data.id).order('scheduled_date', { ascending: true });
        setAssignments(aData ?? []);
      }
      setLoading(false);
    });
  }, [user]);

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;

  if (!guide) {
    return (
      <div>
        <PageHeader title="Guide Dashboard" />
        <div className="card p-10 text-center">
          <Compass size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-base text-slate-500">Your guide profile is not set up yet. Please contact Putu Travels to complete your partner registration.</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAssign = assignments.filter((a) => a.scheduled_date === today);
  const upcoming = assignments.filter((a) => a.status === 'Assigned' || a.status === 'Confirmed');

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={guide.full_name} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5"><Calendar size={18} className="text-coral-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{todayAssign.length}</div><div className="text-xs text-slate-500">Today</div></div>
        <div className="card p-5"><Calendar size={18} className="text-teal-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{upcoming.length}</div><div className="text-xs text-slate-500">Upcoming</div></div>
        <div className="card p-5"><Star size={18} className="text-coral-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{guide.rating.toFixed(1)}</div><div className="text-xs text-slate-500">Rating</div></div>
        <div className="card p-5"><Users size={18} className="text-teal-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{guide.is_available ? 'Yes' : 'No'}</div><div className="text-xs text-slate-500">Available</div></div>
      </div>
      <div className="card-md p-6">
        <h2 className="font-serif text-lg font-semibold text-cocoa-700 mb-4">Upcoming Assignments</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No upcoming assignments.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.map((a) => (
              <div key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-base font-medium text-cocoa-700">{a.scheduled_date ?? 'Date TBD'}</div>
                  <div className="text-xs text-slate-500">{a.num_guests} guests</div>
                </div>
                <span className="badge-slate">{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
