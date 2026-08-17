import React, { useEffect, useState, useMemo } from 'react';
import { 
  Compass, 
  CheckCircle, 
  CreditCard, 
  Search, 
  RefreshCw, 
  Plus, 
  Calendar, 
  MapPin, 
  Clock, 
  Tag,
  Check,
  X,
  ChevronRight,
  Send,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface Trip {
  id: string;
  title: string;
  slug: string;
  category: string;
  destination: string;
  duration_days: number;
  price: number;
  tagline?: string;
  description?: string;
  image_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
  inclusives?: string[];
  exclusives?: string[];
  user_id?: string;
  status: 'upcoming' | 'confirmed' | 'pending' | 'completed' | 'cancelled';
  start_date?: string;
  created_at?: string;
}

export const Trips: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'pending' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [submittingPlan, setSubmittingPlan] = useState<boolean>(false);
  const [planFormData, setPlanFormData] = useState({
    title: '',
    destination: '',
    category: 'safari-beach',
    duration_days: 7,
    estimated_budget: 3500,
    start_date: '',
    notes: ''
  });

  const fetchUserTrips = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setTrips([]);
        return;
      }

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setTrips(data || []);
    } catch (err) {
      console.error('Error fetching user trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTrips();
  }, []);

  useEffect(() => {
    const shouldLock = isPlanModalOpen || !!selectedTrip;
    const original = document.body.style.overflow;
    if (shouldLock) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [isPlanModalOpen, selectedTrip]);

  const stats = useMemo(() => {
    const upcoming = trips.filter(t => t.status === 'upcoming').length;
    const confirmed = trips.filter(t => t.status === 'confirmed').length;
    const balanceDue = trips
      .filter(t => t.status === 'upcoming' || t.status === 'pending')
      .reduce((acc, curr) => acc + Number(curr.price || 0), 0);

    return { upcoming, confirmed, balanceDue };
  }, [trips]);

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesTab = 
        activeTab === 'all' ? true :
        activeTab === 'upcoming' ? trip.status === 'upcoming' :
        activeTab === 'pending' ? trip.status === 'pending' :
        activeTab === 'past' ? (trip.status === 'completed' || trip.status === 'cancelled') : true;

      const matchesSearch = 
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [trips, activeTab, searchQuery]);

  const handlePlanTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPlan(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in to submit a trip request.');
        setSubmittingPlan(false);
        return;
      }

      const autoSlug = (planFormData.title || planFormData.destination)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now()}`;

      const payload = {
        title: planFormData.title,
        slug: autoSlug,
        category: planFormData.category,
        destination: planFormData.destination,
        duration_days: Number(planFormData.duration_days),
        price: Number(planFormData.estimated_budget),
        description: planFormData.notes || 'Custom trip request submitted by client.',
        tagline: `Custom requested itinerary for ${planFormData.destination}`,
        status: 'pending',
        user_id: user.id,
        is_active: true,
        start_date: planFormData.start_date || null,
        image_url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
        inclusives: ['Tailored Itinerary Design', 'Dedicated Concierge', 'Luxury Accommodations'],
        exclusives: ['International Airfare', 'Personal Expenses']
      };

      const { error } = await supabase.from('trips').insert([payload]);

      if (error) throw error;

      setPlanFormData({
        title: '',
        destination: '',
        category: 'safari-beach',
        duration_days: 7,
        estimated_budget: 3500,
        start_date: '',
        notes: ''
      });
      setIsPlanModalOpen(false);
      setActiveTab('pending');
      await fetchUserTrips();
    } catch (err: any) {
      console.error('Error submitting trip request:', err);
      alert(`Could not submit trip request: ${err.message}`);
    } finally {
      setSubmittingPlan(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-10 mx-auto space-y-5 sm:space-y-8 font-sans lg:max-w-7xl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-serif text-slate-900 font-bold">My Journeys</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Track upcoming adventures, review quotes, check payment balances, and plan custom trips.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={fetchUserTrips}
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm shrink-0"
            title="Refresh Trips"
            aria-label="Refresh trips"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsPlanModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#F06553] text-white px-4 sm:px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-[#e05442] active:bg-[#d14a38] transition-colors text-xs sm:text-sm whitespace-nowrap min-w-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">Plan New Trip</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 min-w-0">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">Upcoming</p>
            <p className="text-xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2">{stats.upcoming}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-50 rounded-2xl text-amber-600 shrink-0">
            <Compass className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">Confirmed</p>
            <p className="text-xl sm:text-3xl font-bold text-emerald-600 mt-1 sm:mt-2">{stats.confirmed}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
            <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between col-span-2 lg:col-span-1 min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">Balance Due</p>
            <p className="text-xl sm:text-3xl font-bold text-slate-900 mt-1 sm:mt-2 truncate">${stats.balanceDue.toLocaleString()}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-rose-50 rounded-2xl text-rose-500 shrink-0">
            <CreditCard className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm min-w-0">
        
        {/* Horizontal Scrollable Tabs (edge-to-edge bleed on mobile, with right breathing room) */}
        <div className="-mx-3 sm:mx-0 min-w-0 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 pl-3 pr-6 sm:px-0 scrollbar-none w-full lg:w-auto">
            {[
              { id: 'all', label: 'All Trips' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'pending', label: 'Pending & Quotes' },
              { id: 'past', label: 'Past & Cancelled' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {/* Spacer so the last tab never sits flush against the scroll edge */}
            <div className="shrink-0 w-1" aria-hidden="true" />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72 min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search destination or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
          />
        </div>
      </div>

      {/* Responsive Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-10 sm:p-16 text-center border border-slate-100">
          <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-[#F06553] animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Fetching your tailored itineraries...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-16 text-center border border-slate-100 space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
            <Compass className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-serif font-bold text-slate-800">No trips found</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">You have no scheduled journeys matching this filter.</p>
          </div>
          <button 
            onClick={() => setIsPlanModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#F06553] text-white px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm hover:bg-[#e05442] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Start Planning
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
          {filteredTrips.map(trip => (
            <div 
              key={trip.id} 
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group min-w-0"
            >
              {/* Aspect-Ratio Image Container */}
              <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                <img 
                  src={trip.image_url || 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80'} 
                  alt={trip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                  trip.status === 'confirmed' ? 'bg-emerald-500 text-white' :
                  trip.status === 'upcoming' ? 'bg-amber-500 text-white' :
                  trip.status === 'pending' ? 'bg-sky-500 text-white' : 'bg-slate-500 text-white'
                }`}>
                  {trip.status}
                </span>
              </div>

              {/* Content Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 sm:space-y-4 min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-[#F06553] uppercase tracking-wider">
                    <Tag className="w-3 h-3 shrink-0" />
                    <span className="truncate">{trip.category}</span>
                  </div>
                  <h3 className="text-sm sm:text-lg font-bold text-slate-900 font-serif leading-snug line-clamp-1">{trip.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{trip.tagline || trip.description}</p>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-[11px] sm:text-xs text-slate-600 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="flex items-center gap-1.5 text-slate-400 shrink-0"><MapPin className="w-3.5 h-3.5" /> Destination:</span>
                    <span className="font-semibold text-slate-800 line-clamp-1 text-right min-w-0">{trip.destination}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="flex items-center gap-1.5 text-slate-400 shrink-0"><Clock className="w-3.5 h-3.5" /> Duration:</span>
                    <span className="font-semibold text-slate-800">{trip.duration_days} Days</span>
                  </div>
                  {trip.start_date && (
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="flex items-center gap-1.5 text-slate-400 shrink-0"><Calendar className="w-3.5 h-3.5" /> Start Date:</span>
                      <span className="font-semibold text-slate-800 text-right">{new Date(trip.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                {/* Card Action Footer — wraps on very narrow cards instead of squeezing */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2 flex-wrap min-w-0">
                  <div className="min-w-0">
                    <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Package</span>
                    <span className="text-sm sm:text-lg font-bold text-slate-900">${Number(trip.price).toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedTrip(trip)}
                    className="flex items-center gap-1 px-3.5 py-2 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-slate-800 active:bg-slate-700 transition-colors shrink-0"
                  >
                    View Itinerary
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PLAN NEW TRIP MODAL — bottom sheet on mobile, centered dialog on larger screens */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full sm:mx-4 p-4 sm:p-7 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl space-y-4 sm:space-y-5 border border-slate-100">
            {/* Mobile drag-handle affordance */}
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-[#F06553]/10 text-[#F06553] rounded-xl shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-bold font-serif text-slate-900 truncate">Request Custom Journey</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">Tell us your trip preferences to curate an itinerary.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlanTripSubmit} className="space-y-3.5 text-xs sm:text-sm min-w-0">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trip / Experience Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masai Mara Safari & Diani Coastal Retreat"
                  value={planFormData.title}
                  onChange={e => setPlanFormData({ ...planFormData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kenya & Zanzibar"
                    value={planFormData.destination}
                    onChange={e => setPlanFormData({ ...planFormData, destination: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={planFormData.category}
                    onChange={e => setPlanFormData({ ...planFormData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                  >
                    <option value="safari-beach">Safari & Beach</option>
                    <option value="mountain-trek">Mountain Trek & Hiking</option>
                    <option value="cultural-safari">Cultural Expedition</option>
                    <option value="luxury-escape">Luxury Villa Escape</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={planFormData.duration_days}
                    onChange={e => setPlanFormData({ ...planFormData, duration_days: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    required
                    value={planFormData.estimated_budget}
                    onChange={e => setPlanFormData({ ...planFormData, estimated_budget: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Start Date</label>
                  <input
                    type="date"
                    value={planFormData.start_date}
                    onChange={e => setPlanFormData({ ...planFormData, start_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Special Requests & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Mention preferred accommodations, dietary requests, or group sizes..."
                  value={planFormData.notes}
                  onChange={e => setPlanFormData({ ...planFormData, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#F06553]/20 focus:border-[#F06553]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 bg-[#F06553] text-white rounded-xl font-medium hover:bg-[#e05442] text-xs shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingPlan ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRIP DETAIL DRAWER / OVERLAY — bottom sheet on mobile, centered dialog on larger screens */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-xl w-full sm:mx-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl space-y-4 sm:space-y-5 p-4 sm:p-7">
            {/* Mobile drag-handle affordance */}
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-2 min-w-0">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#F06553] uppercase tracking-wider">{selectedTrip.category}</span>
                <h2 className="text-lg sm:text-2xl font-serif font-bold text-slate-900 mt-0.5 break-words">{selectedTrip.title}</h2>
              </div>
              <button onClick={() => setSelectedTrip(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 shrink-0" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
              <img src={selectedTrip.image_url} alt="" className="w-full h-full object-cover" />
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{selectedTrip.description}</p>

            {/* Inclusives */}
            {selectedTrip.inclusives && selectedTrip.inclusives.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-900">What's Included</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedTrip.inclusives.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-700 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/50">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exclusives */}
            {selectedTrip.exclusives && selectedTrip.exclusives.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-900">What's Excluded</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedTrip.exclusives.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Package</span>
                <span className="text-lg sm:text-xl font-bold text-slate-900">${Number(selectedTrip.price).toLocaleString()}</span>
              </div>
              <button onClick={() => setSelectedTrip(null)} className="px-4 sm:px-5 py-2.5 sm:py-2 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-slate-800 transition-colors shrink-0">
                Close Itinerary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;