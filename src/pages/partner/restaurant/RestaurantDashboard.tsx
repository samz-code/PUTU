import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { Utensils, Calendar, Clock } from 'lucide-react';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('restaurants').select('*').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      setRestaurant(data);
      if (data) {
        const { data: resData } = await supabase.from('restaurant_reservations').select('*').eq('restaurant_id', data.id).order('created_at', { ascending: false });
        setReservations(resData ?? []);
      }
      setLoading(false);
    });
  }, [user]);

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;

  if (!restaurant) {
    return (
      <div>
        <PageHeader title="Restaurant Dashboard" />
        <div className="card p-10 text-center">
          <Utensils size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-base text-slate-500">Your restaurant profile is not set up yet. Please contact Putu Travels to complete your partner registration.</p>
        </div>
      </div>
    );
  }

  const pending = reservations.filter((r) => r.status === 'Pending').length;
  const today = new Date().toISOString().split('T')[0];
  const todayRes = reservations.filter((r) => r.reservation_date === today);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={restaurant.name} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5"><Calendar size={18} className="text-coral-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{pending}</div><div className="text-xs text-slate-500">Pending Requests</div></div>
        <div className="card p-5"><Clock size={18} className="text-teal-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{todayRes.length}</div><div className="text-xs text-slate-500">Today</div></div>
        <div className="card p-5"><Calendar size={18} className="text-coral-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{reservations.length}</div><div className="text-xs text-slate-500">Total</div></div>
      </div>
      <div className="card-md p-6">
        <h2 className="font-serif text-lg font-semibold text-cocoa-700 mb-4">Recent Requests</h2>
        {reservations.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No reservation requests yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reservations.slice(0, 5).map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-base font-medium text-cocoa-700">{r.reservation_date} at {r.reservation_time}</div>
                  <div className="text-xs text-slate-500">{r.party_size} guests{r.occasion ? ` - ${r.occasion}` : ''}</div>
                </div>
                <span className="badge-slate">{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
