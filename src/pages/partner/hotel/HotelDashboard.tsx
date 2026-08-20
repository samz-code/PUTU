import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { BedDouble, Calendar, DollarSign, Star, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Hotel {
  id: string;
  name: string;
  commission_pct: number;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  price_per_night: number;
}

interface Reservation {
  id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  room_type?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  total_amount?: number;
  created_at: string;
}

export default function HotelDashboard() {
  const { user } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);

        // 1. Fetch Partner's Hotel Profile
        const { data: hotelData, error: hotelError } = await supabase
          .from('hotels')
          .select('*')
          .eq('partner_user_id', user.id)
          .maybeSingle();

        if (hotelError) throw hotelError;

        if (hotelData && isMounted) {
          setHotel(hotelData);

          // 2. Fetch Rooms & Reservations in parallel once Hotel ID is known
          const [roomsRes, reservationsRes] = await Promise.all([
            supabase.from('hotel_rooms').select('*').eq('hotel_id', hotelData.id),
            supabase
              .from('hotel_reservations')
              .select('*')
              .eq('hotel_id', hotelData.id)
              .order('created_at', { ascending: false }),
          ]);

          setRooms((roomsRes.data as Room[]) ?? []);
          setReservations((reservationsRes.data as Reservation[]) ?? []);
        }
      } catch (err) {
        console.error('Error loading hotel dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
        Loading dashboard metrics...
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="space-y-6">
        <PageHeader title="Hotel Dashboard" />
        <div className="card-md p-10 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <BedDouble size={36} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-serif text-lg font-bold text-slate-800 mb-1">No Associated Hotel Account</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your hotel profile is not set up yet. Please contact Putu Travels to complete your partner registration.
          </p>
        </div>
      </div>
    );
  }

  // Derived Metrics
  const pendingCount = reservations.filter((r) => r.status === 'Pending').length;
  const confirmedCount = reservations.filter((r) => r.status === 'Confirmed').length;
  const totalRevenue = reservations
    .filter((r) => r.status === 'Confirmed')
    .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 size={12} /> Confirmed
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            <Clock size={12} /> Pending
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
            <AlertCircle size={12} /> Cancelled
          </span>
        );
      default:
        return <span className="badge-slate">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={hotel.name} />

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <BedDouble size={20} className="text-coral-600 mb-2" />
          <div className="font-serif text-2xl font-bold text-slate-900">{rooms.length}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Room Types Configured</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <Calendar size={20} className="text-amber-500 mb-2" />
          <div className="font-serif text-2xl font-bold text-slate-900">{pendingCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Pending Requests</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <Star size={20} className="text-teal-600 mb-2" />
          <div className="font-serif text-2xl font-bold text-slate-900">{confirmedCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Confirmed Stays</div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <DollarSign size={20} className="text-emerald-600 mb-2" />
          <div className="font-serif text-2xl font-bold text-slate-900">
            ${totalRevenue.toFixed(0)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            Confirmed Revenue ({hotel.commission_pct}% Comm.)
          </div>
        </div>
      </div>

      {/* RECENT RESERVATIONS TABLE / LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-lg font-bold text-slate-900">Recent Reservations</h2>
          <span className="text-xs text-slate-400 font-medium">Showing latest 5 bookings</span>
        </div>

        {reservations.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No reservations recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reservations.slice(0, 5).map((r) => (
              <div key={r.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {r.check_in} &rarr; {r.check_out}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {r.num_guests} Guest{r.num_guests > 1 ? 's' : ''} &bull; {r.room_type ?? 'Standard Booking'}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {r.total_amount && (
                    <span className="hidden sm:inline-block font-mono text-sm font-semibold text-slate-700">
                      ${Number(r.total_amount).toFixed(2)}
                    </span>
                  )}
                  {getStatusBadge(r.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}