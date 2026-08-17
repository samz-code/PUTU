import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { BedDouble, Calendar, DollarSign, Star } from 'lucide-react';

export default function HotelDashboard() {
  const { user } = useAuth();
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('hotels').select('*').eq('partner_user_id', user.id).maybeSingle(),
      supabase.from('hotel_rooms').select('*').eq('hotel_id', hotel?.id),
      supabase.from('hotel_reservations').select('*').eq('hotel_id', hotel?.id),
    ]).then(async ([h, r, res]) => {
      const hotelData = h.data;
      setHotel(hotelData);
      if (hotelData) {
        const [roomsRes, resRes] = await Promise.all([
          supabase.from('hotel_rooms').select('*').eq('hotel_id', hotelData.id),
          supabase.from('hotel_reservations').select('*').eq('hotel_id', hotelData.id).order('created_at', { ascending: false }),
        ]);
        setRooms(roomsRes.data ?? []);
        setReservations(resRes.data ?? []);
      }
      setLoading(false);
    });
  }, [user, hotel?.id]);

  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;

  if (!hotel) {
    return (
      <div>
        <PageHeader title="Hotel Dashboard" />
        <div className="card p-10 text-center">
          <BedDouble size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-base text-slate-500">Your hotel profile is not set up yet. Please contact Putu Travels to complete your partner registration.</p>
        </div>
      </div>
    );
  }

  const pending = reservations.filter((r) => r.status === 'Pending').length;
  const confirmed = reservations.filter((r) => r.status === 'Confirmed').length;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={hotel.name} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5"><BedDouble size={18} className="text-coral-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{rooms.length}</div><div className="text-xs text-slate-500">Room Types</div></div>
        <div className="card p-5"><Calendar size={18} className="text-teal-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{pending}</div><div className="text-xs text-slate-500">Pending Requests</div></div>
        <div className="card p-5"><Star size={18} className="text-coral-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{confirmed}</div><div className="text-xs text-slate-500">Confirmed</div></div>
        <div className="card p-5"><DollarSign size={18} className="text-teal-600 mb-2" /><div className="font-serif text-2xl font-semibold text-cocoa-700">{hotel.commission_pct}%</div><div className="text-xs text-slate-500">Commission</div></div>
      </div>
      <div className="card-md p-6">
        <h2 className="font-serif text-lg font-semibold text-cocoa-700 mb-4">Recent Reservations</h2>
        {reservations.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No reservations yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reservations.slice(0, 5).map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-base font-medium text-cocoa-700">{r.check_in} to {r.check_out}</div>
                  <div className="text-xs text-slate-500">{r.num_guests} guests - {r.room_type ?? 'Any room'}</div>
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
