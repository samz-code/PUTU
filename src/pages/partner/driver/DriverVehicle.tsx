import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { Car } from 'lucide-react';

export default function DriverVehicle() {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('drivers').select('id').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      if (data) {
        const { data: vData } = await supabase.from('vehicles').select('*').eq('driver_id', data.id).maybeSingle();
        setVehicle(vData);
      }
      setLoading(false);
    });
  }, [user]);

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Vehicle" />
        <div className="card p-10 text-center">
          <Car size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-base text-slate-500">No vehicle assigned to you yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Vehicle" subtitle="Your assigned vehicle" />
      <div className="card-md p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-lg bg-coral-50 flex items-center justify-center">
            <Car size={24} className="text-coral-600" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-cocoa-700">{vehicle.plate_number}</h2>
            <p className="text-base text-slate-500">{vehicle.vehicle_type} - {[vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Unspecified'}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div><dt className="text-slate-400">Capacity</dt><dd className="font-medium text-slate-700">{vehicle.capacity}</dd></div>
          <div><dt className="text-slate-400">Mileage</dt><dd className="font-medium text-slate-700">{vehicle.current_mileage.toLocaleString()} km</dd></div>
          <div><dt className="text-slate-400">Fuel</dt><dd className="font-medium text-slate-700">{vehicle.fuel_level}%</dd></div>
          <div><dt className="text-slate-400">AC</dt><dd className="font-medium text-slate-700">{vehicle.has_ac ? 'Yes' : 'No'}</dd></div>
          <div><dt className="text-slate-400">Insurance</dt><dd className="font-medium text-slate-700">{vehicle.insurance_expiry ?? 'N/A'}</dd></div>
          <div><dt className="text-slate-400">Status</dt><dd><span className="badge-slate">{vehicle.status}</span></dd></div>
        </dl>
      </div>
    </div>
  );
}
