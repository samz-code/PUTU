import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface JourneyBrief {
  id: string;
  title: string;
  client_name: string;
  client_email: string;
  destination: string;
  start_date: string;
  end_date: string;
  traveler_count: number;
  accommodation_tier: 'budget' | 'mid-range' | 'luxury' | 'ultra-luxury';
  budget_range: string;
  preferred_activities: string[];
  special_requests: string;
  status: 'submitted' | 'under_review' | 'approved' | 'changes_requested' | 'archived';
  created_at: string;
  updated_at: string;
}

export const AdminJourneybriefs: React.FC = () => {
  const [briefs, setBriefs] = useState<JourneyBrief[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal / Editing states
  const [selectedBrief, setSelectedBrief] = useState<JourneyBrief | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<JourneyBrief>>({});
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchJourneyBriefs();
  }, []);

  const fetchJourneyBriefs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('journey_briefs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBriefs(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch journey briefs.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrief) return;

    try {
      setSaving(true);
      const updatedFields = {
        ...editFormData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('journey_briefs')
        .update(updatedFields)
        .eq('id', selectedBrief.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state array
      setBriefs(briefs.map((b) => (b.id === selectedBrief.id ? data : b)));
      setSelectedBrief(data);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update journey brief.');
    } finally {
      setSaving(false);
    }
  };

  const filteredBriefs = briefs.filter((brief) => {
    const matchesSearch =
      brief.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brief.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brief.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || brief.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: JourneyBrief['status']) => {
    const styles: Record<JourneyBrief['status'], string> = {
      submitted: 'bg-blue-100 text-blue-800 border-blue-200',
      under_review: 'bg-amber-100 text-amber-800 border-amber-200',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      changes_requested: 'bg-purple-100 text-purple-800 border-purple-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const label = status ? status.replace('_', ' ') : 'submitted';
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border uppercase tracking-wider ${styles[status] || styles.submitted}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journey Planner Submissions</h1>
          <p className="text-sm text-gray-500">Review detailed customer requirements, traveler preferences, and update records.</p>
        </div>
        <button
          onClick={fetchJourneyBriefs}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          Refresh Records
        </button>
      </div>

      {/* Controls: Search and Status Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by title, client, or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="archived">Archived</option>
          </select>
          <div className="text-sm text-gray-500 whitespace-nowrap">
            Count: <span className="font-semibold text-gray-900">{filteredBriefs.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Brief Title / Destination</th>
                <th className="py-3.5 px-6">Client Details</th>
                <th className="py-3.5 px-6">Dates & Travelers</th>
                <th className="py-3.5 px-6">Tier & Budget</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Loading customer journey preferences...
                  </td>
                </tr>
              ) : filteredBriefs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No journey planner records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBriefs.map((brief) => (
                  <tr key={brief.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{brief.title || 'Untitled Brief'}</div>
                      <div className="text-xs text-indigo-600 font-medium">{brief.destination || 'No destination specified'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{brief.client_name}</div>
                      <div className="text-xs text-gray-500">{brief.client_email}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      <div className="text-xs font-medium text-gray-900">
                        {brief.start_date ? new Date(brief.start_date).toLocaleDateString() : 'TBD'} ➔ {brief.end_date ? new Date(brief.end_date).toLocaleDateString() : 'TBD'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{brief.traveler_count || 1} Traveler(s)</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="capitalize text-xs font-medium bg-gray-100 text-gray-800 px-2 py-0.5 rounded inline-block">
                        {brief.accommodation_tier || 'Standard'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{brief.budget_range || 'Flexible'}</div>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(brief.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedBrief(brief);
                          setEditFormData(brief);
                          setIsEditing(false);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium text-xs rounded-lg transition-colors"
                      >
                        Review / Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Review & Edit Modal */}
      {selectedBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Edit Journey Brief' : selectedBrief.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Submitted by {selectedBrief.client_name} ({selectedBrief.client_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedBrief(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* View Mode vs Edit Mode Form */}
            {!isEditing ? (
              <div className="space-y-6 text-sm">
                {/* Status and Destination banner */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <span className="block text-xs font-medium text-gray-400 uppercase">Destination</span>
                    <span className="font-semibold text-gray-900">{selectedBrief.destination || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 uppercase">Current Status</span>
                    <div className="mt-1">{getStatusBadge(selectedBrief.status)}</div>
                  </div>
                </div>

                {/* Logistics grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="block text-xs text-gray-400">Travel Dates</span>
                    <span className="font-medium text-gray-800 text-xs mt-1 block">
                      {selectedBrief.start_date} to {selectedBrief.end_date}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="block text-xs text-gray-400">Group Size</span>
                    <span className="font-medium text-gray-800 text-xs mt-1 block">
                      {selectedBrief.traveler_count} Guests
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="block text-xs text-gray-400">Accommodation Tier</span>
                    <span className="font-medium text-gray-800 text-xs mt-1 block capitalize">
                      {selectedBrief.accommodation_tier}
                    </span>
                  </div>
                </div>

                {/* Budget & Activities */}
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Target Budget:</span>
                    <p className="text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200 mt-1">
                      {selectedBrief.budget_range || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Preferred Activities / Interests:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedBrief.preferred_activities && selectedBrief.preferred_activities.length > 0 ? (
                        selectedBrief.preferred_activities.map((act, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                            {act}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs italic">No specific activities chosen.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Special Requests / Notes:</span>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1 whitespace-pre-wrap">
                      {selectedBrief.special_requests || 'None provided.'}
                    </p>
                  </div>
                </div>

                {/* Action buttons inside modal */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Edit Record & Status
                  </button>
                  <button
                    onClick={() => setSelectedBrief(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Editing Form (Database Mutating) */
              <form onSubmit={handleUpdateBrief} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Brief Title</label>
                    <input
                      type="text"
                      value={editFormData.title || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Destination</label>
                    <input
                      type="text"
                      value={editFormData.destination || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={editFormData.start_date || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={editFormData.end_date || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Travelers Count</label>
                    <input
                      type="number"
                      min={1}
                      value={editFormData.traveler_count || 1}
                      onChange={(e) => setEditFormData({ ...editFormData, traveler_count: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Accommodation Tier</label>
                    <select
                      value={editFormData.accommodation_tier || 'mid-range'}
                      onChange={(e: any) => setEditFormData({ ...editFormData, accommodation_tier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="budget">Budget</option>
                      <option value="mid-range">Mid-Range</option>
                      <option value="luxury">Luxury</option>
                      <option value="ultra-luxury">Ultra-Luxury</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Workflow Status</label>
                    <select
                      value={editFormData.status || 'submitted'}
                      onChange={(e: any) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="changes_requested">Changes Requested</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Budget Range Description</label>
                  <input
                    type="text"
                    value={editFormData.budget_range || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, budget_range: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Special Requests / Itinerary Notes</label>
                  <textarea
                    rows={3}
                    value={editFormData.special_requests || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, special_requests: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving to Database...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJourneybriefs;