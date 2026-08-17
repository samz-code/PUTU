import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { Route, Car, DollarSign, User } from 'lucide-react';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [driver, setDriver] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('drivers').select('*').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      setDriver(data);
      if (data) {
        const [tripsRes, vehicleRes] = await Promise.all([
          supabase.from('driver_trips').select('*').eq('driver_id', data.id).order('pickup_time', { ascending: true }),
          supabase.from('vehicles').select('*').eq('driver_id', data.id).maybeSingle(),
        ]);
        setTrips(tripsRes.data ?? []);
        setVehicle(vehicleRes.data);
      }
      setLoading(false);
    });
  }, [user]);

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;

  if (!driver) {
    return (
      <div>
        <PageHeader title="Driver Dashboard" />
        <div className="card p-10 text-center">
          <Car size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-base text-slate-500">Your driver profile is not set up yet. Please contact Putu Travels to complete your partner registration.</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayTrips = trips.filter((t) => t.pickup_time && t.pickup_time.startsWith(today));
  const activeTrip = trips.find((t) => ['Assigned', 'En Route', 'Picked Up'].includes(t.status));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={driver.full_name} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5"><Route size={18} className="text-coral-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{todayTrips.length}</div><div className="text-xs text-slate-500">Today's Trips</div></div>
        <div className="card p-5"><User size={18} className="text-teal-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{driver.rating.toFixed(1)}</div><div className="text-xs text-slate-500">Rating</div></div>
        <div className="card p-5"><Car size={18} className="text-coral-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{vehicle ? vehicle.plate_number : 'None'}</div><div className="text-xs text-slate-500">Vehicle</div></div>
        <div className="card p-5"><DollarSign size={18} className="text-teal-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{driver.is_available ? 'Yes' : 'No'}</div><div className="text-xs text-slate-500">Available</div></div>
      </div>

      {activeTrip && (
        <div className="card-md p-6 mb-6 border-coral-200">
          <h2 className="font-serif text-lg font-semibold text-cocoa-700 mb-3">Active Trip</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">From:</span> <span className="font-medium text-slate-700">{activeTrip.pickup_location}</span></div>
            <div><span className="text-slate-400">To:</span> <span className="font-medium text-slate-700">{activeTrip.dropoff_location}</span></div>
            <div><span className="text-slate-400">Customer:</span> <span className="font-medium text-slate-700">{activeTrip.customer_contact}</span></div>
            <div><span className="text-slate-400">Status:</span> <span className="badge-teal">{activeTrip.status}</span></div>
          </div>
        </div>
      )}

      <div className="card-md p-6">
        <h2 className="font-serif text-lg font-semibold text-cocoa-700 mb-4">Today's Trips</h2>
        {todayTrips.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No trips scheduled for today.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayTrips.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-base font-medium text-cocoa-700">{t.pickup_location} to {t.dropoff_location}</div>
                  <div className="text-xs text-slate-500">{t.pickup_time ? new Date(t.pickup_time).toLocaleTimeString() : 'Time TBD'} - {t.customer_contact}</div>
                </div>
                <span className="badge-slate">{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
