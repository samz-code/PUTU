import { useEffect, useState } from 'react';
import { FolderOpen, Calendar, Users, MapPin, Edit3, X, DollarSign, Compass, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Brief {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  title?: string;
  destination: string;
  arrival_date: string | null;
  departure_date: string | null;
  traveler_count: number;
  accommodation_tier: 'budget' | 'mid-range' | 'luxury' | 'ultra-luxury';
  budget_range: string;
  preferred_activities: string[];
  special_requests: string;
  admin_notes?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'changes_requested' | 'archived';
  created_at: string;
  updated_at?: string;
}

const AVAILABLE_ACTIVITIES = [
  'Wildlife Safaris',
  'Cultural Tours',
  'Mountain Trekking',
  'Beach & Coastal Leisure',
  'Photography Excursions',
  'Luxury Wellness & Spa',
  'Historical Heritage Sites'
];

export default function Itineraries() {
  const { user } = useAuth();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal & Editing states
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Brief>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchBriefs();
  }, [user]);

  const fetchBriefs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('journey_briefs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBriefs((data as Brief[]) ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load your itineraries.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrief) return;

    try {
      setSaving(true);
      setError(null);
      const updatedFields = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('journey_briefs')
        .update(updatedFields)
        .eq('id', selectedBrief.id)
        .select()
        .single();

      if (error) throw error;

      // Update state locally and notify user
      setBriefs(briefs.map((b) => (b.id === selectedBrief.id ? data : b)));
      setSelectedBrief(data);
      setIsEditing(false);
      setSuccessMessage('Itinerary brief successfully updated in the database!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update itinerary brief.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActivitySelection = (activity: string) => {
    const current = formData.preferred_activities || [];
    const updated = current.includes(activity)
      ? current.filter((a) => a !== activity)
      : [...current, activity];
    setFormData({ ...formData, preferred_activities: updated });
  };

  const getStatusBadge = (status: Brief['status']) => {
    const styles: Record<Brief['status'], string> = {
      submitted: 'bg-blue-100 text-blue-800 border-blue-200',
      under_review: 'bg-amber-100 text-amber-800 border-amber-200',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      changes_requested: 'bg-purple-100 text-purple-800 border-purple-200',
      archived: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    const label = status ? status.replace('_', ' ') : 'submitted';
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border uppercase tracking-wider ${styles[status] || styles.submitted}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader title="Saved Itineraries" subtitle="Review your full journey plans, traveler requirements, and preferences." />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading your itineraries...</p>
      ) : briefs.length === 0 ? (
        <div className="card p-12 text-center bg-white rounded-xl shadow-sm border border-slate-100">
          <FolderOpen size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-base text-slate-600 font-medium">No saved itineraries yet.</p>
          <p className="text-xs text-slate-400 mt-1">Submit a new journey brief through the planner to track it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {briefs.map((b) => (
            <div 
              key={b.id} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all p-6 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{b.title || b.full_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium mt-1">
                    <MapPin size={13} />
                    <span>{b.destination || 'Destination TBD'}</span>
                  </div>
                </div>
                {getStatusBadge(b.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>{b.arrival_date || 'TBD'} ➔ {b.departure_date || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-slate-400" />
                  <span>{b.traveler_count || 1} Travelers</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="capitalize text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                  Tier: {b.accommodation_tier || 'Standard'}
                </span>
                <button
                  onClick={() => {
                    setSelectedBrief(b);
                    setFormData(b);
                    setIsEditing(false);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium rounded-lg transition-colors"
                >
                  <Edit3 size={13} />
                  <span>View Details & Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comprehensive Details & Live Edit Modal */}
      {selectedBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {isEditing ? 'Edit Your Journey Brief' : (selectedBrief.title || selectedBrief.full_name)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Destination: <span className="font-semibold text-indigo-600">{selectedBrief.destination}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedBrief(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {!isEditing ? (
              <div className="space-y-5 text-sm text-slate-700">
                {/* Status and Admin Feedback Banner */}
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="block text-xs text-slate-400 font-medium uppercase">Current Status</span>
                    <div className="mt-1">{getStatusBadge(selectedBrief.status)}</div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-slate-400 font-medium uppercase">Last Updated</span>
                    <span className="text-xs font-semibold text-slate-700 mt-1 block">
                      {selectedBrief.updated_at ? new Date(selectedBrief.updated_at).toLocaleDateString() : new Date(selectedBrief.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Admin Review Notes (if provided) */}
                {selectedBrief.admin_notes && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs uppercase tracking-wide">
                      <MessageSquare size={14} />
                      <span>Note from Journey Specialist</span>
                    </div>
                    <p className="text-amber-900 text-xs leading-relaxed">{selectedBrief.admin_notes}</p>
                  </div>
                )}

                {/* Core Logistics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="block text-xs text-slate-400">Travel Dates</span>
                    <span className="font-medium text-slate-800 text-xs mt-1 block">
                      {selectedBrief.arrival_date || 'TBD'} ➔ {selectedBrief.departure_date || 'TBD'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="block text-xs text-slate-400">Travelers</span>
                    <span className="font-medium text-slate-800 text-xs mt-1 block">
                      {selectedBrief.traveler_count || 1} Guests
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="block text-xs text-slate-400">Accommodation</span>
                    <span className="font-medium text-slate-800 text-xs mt-1 block capitalize">
                      {selectedBrief.accommodation_tier || 'Standard'}
                    </span>
                  </div>
                </div>

                {/* Budget and Activities */}
                <div className="space-y-4">
                  <div>
                    <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1">
                      <DollarSign size={13} className="text-indigo-500" /> Target Budget Range
                    </span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1 text-xs">
                      {selectedBrief.budget_range || 'Flexible'}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1">
                      <Compass size={13} className="text-indigo-500" /> Preferred Activities & Interests
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedBrief.preferred_activities && selectedBrief.preferred_activities.length > 0 ? (
                        selectedBrief.preferred_activities.map((act, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                            {act}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">No specific activities selected.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Special Requests & Dietary Notes</span>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-1 whitespace-pre-wrap text-xs">
                      {selectedBrief.special_requests || 'No special requests provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
                  >
                    Edit Brief Requirements
                  </button>
                  <button
                    onClick={() => setSelectedBrief(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Live Database Update Form */
              <form onSubmit={handleUpdateBrief} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Brief Title / Name</label>
                    <input
                      type="text"
                      value={formData.full_name || ''}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                    <input
                      type="text"
                      value={formData.destination || ''}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Arrival Date</label>
                    <input
                      type="date"
                      value={formData.arrival_date || ''}
                      onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Date</label>
                    <input
                      type="date"
                      value={formData.departure_date || ''}
                      onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Travelers Count</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.traveler_count || 1}
                      onChange={(e) => setFormData({ ...formData, traveler_count: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Accommodation Tier</label>
                    <select
                      value={formData.accommodation_tier || 'mid-range'}
                      onChange={(e: any) => setFormData({ ...formData, accommodation_tier: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="budget">Budget</option>
                      <option value="mid-range">Mid-Range</option>
                      <option value="luxury">Luxury</option>
                      <option value="ultra-luxury">Ultra-Luxury</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Range Description</label>
                    <input
                      type="text"
                      value={formData.budget_range || ''}
                      onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. $3,000 - $5,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Preferred Activities</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {AVAILABLE_ACTIVITIES.map((act) => {
                      const isSelected = (formData.preferred_activities || []).includes(act);
                      return (
                        <button
                          type="button"
                          key={act}
                          onClick={() => toggleActivitySelection(act)}
                          className={`text-xs px-3 py-2 rounded-lg border text-left font-medium transition-all ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {act}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Special Requests & Dietary Notes</label>
                  <textarea
                    rows={3}
                    value={formData.special_requests || ''}
                    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? 'Syncing to Database...' : 'Save & Sync Updates'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}