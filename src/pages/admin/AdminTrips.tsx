import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X, 
  RefreshCw, 
  Compass, 
  CheckCircle,
  AlertCircle,
  Eye,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Trip } from '../portal/Trips';

export const AdminTrips: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'safari-beach',
    destination: '',
    duration_days: 7,
    price: 3500,
    tagline: '',
    description: '',
    image_url: '',
    is_featured: false,
    is_active: true,
    inclusives: '',
    exclusives: '',
    user_id: '',
    status: 'upcoming' as Trip['status'],
    start_date: ''
  });

  const fetchAllTrips = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (err: any) {
      console.error('Error fetching admin trips:', err);
      alert(`Error loading trips: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTrips();
  }, []);

  const handleOpenModal = (trip?: Trip) => {
    if (trip) {
      setEditingTrip(trip);
      setFormData({
        title: trip.title || '',
        slug: trip.slug || '',
        category: trip.category || 'safari-beach',
        destination: trip.destination || '',
        duration_days: trip.duration_days || 1,
        price: trip.price || 0,
        tagline: trip.tagline || '',
        description: trip.description || '',
        image_url: trip.image_url || '',
        is_featured: trip.is_featured || false,
        is_active: trip.is_active ?? true,
        inclusives: trip.inclusives ? trip.inclusives.join(', ') : '',
        exclusives: trip.exclusives ? trip.exclusives.join(', ') : '',
        user_id: trip.user_id || '',
        status: trip.status || 'upcoming',
        start_date: trip.start_date || ''
      });
    } else {
      setEditingTrip(null);
      setFormData({
        title: '',
        slug: '',
        category: 'safari-beach',
        destination: '',
        duration_days: 7,
        price: 3500,
        tagline: '',
        description: '',
        image_url: '',
        is_featured: false,
        is_active: true,
        inclusives: '',
        exclusives: '',
        user_id: '',
        status: 'upcoming',
        start_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert comma-delimited strings to Postgres text[] arrays
    const inclusivesArray = formData.inclusives
      ? formData.inclusives.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const exclusivesArray = formData.exclusives
      ? formData.exclusives.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const autoSlug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const payload = {
      title: formData.title,
      slug: autoSlug,
      category: formData.category,
      destination: formData.destination,
      duration_days: Number(formData.duration_days),
      price: Number(formData.price),
      tagline: formData.tagline,
      description: formData.description,
      image_url: formData.image_url,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      inclusives: inclusivesArray,
      exclusives: exclusivesArray,
      user_id: formData.user_id ? formData.user_id.trim() : null,
      status: formData.status,
      start_date: formData.start_date ? formData.start_date : null
    };

    try {
      if (editingTrip) {
        const { error } = await supabase
          .from('trips')
          .update(payload)
          .eq('id', editingTrip.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trips')
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchAllTrips();
    } catch (err: any) {
      alert(`Operation failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this trip record?')) return;
    try {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
      fetchAllTrips();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const filteredTrips = trips.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase()) ||
      (t.user_id && t.user_id.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 font-bold">Trip Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Create, edit, and assign custom journeys and travel quotes across customer accounts.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-slate-800 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Trip
        </button>
      </div>

      {/* Control Panel: Search & Status Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, destination, or User ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button 
            onClick={fetchAllTrips}
            className="p-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="p-4">Trip Info</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned User UUID</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading database records...
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-400">
                    No matching trip records found.
                  </td>
                </tr>
              ) : (
                filteredTrips.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <img 
                          src={trip.image_url || 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=100&q=80'} 
                          alt="" 
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{trip.title}</p>
                          <p className="text-xs text-slate-400">{trip.duration_days} Days • {trip.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{trip.destination}</td>
                    <td className="p-4 font-bold text-slate-900">${Number(trip.price).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        trip.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        trip.status === 'upcoming' ? 'bg-amber-100 text-amber-700' :
                        trip.status === 'pending' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {trip.user_id ? (
                        <span className="bg-slate-100 px-2 py-1 rounded text-[11px]">{trip.user_id}</span>
                      ) : (
                        <span className="text-amber-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(trip)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Trip"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(trip.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Upsert Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold font-serif text-slate-900">
                {editingTrip ? 'Edit Trip Record' : 'Create New Trip Record'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Trip Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={e => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={formData.duration_days}
                    onChange={e => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assign User UUID</label>
                  <input
                    type="text"
                    placeholder="95c1bcc2-dab6-4fb5-80ec-ea22599ee419"
                    value={formData.user_id}
                    onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tagline / Brief Summary</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Inclusives (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Private flight, Safari drives, All meals"
                  value={formData.inclusives}
                  onChange={e => setFormData({ ...formData, inclusives: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Exclusives (Comma separated)</label>
                <input
                  type="text"
                  placeholder="International flights, Tips, Travel insurance"
                  value={formData.exclusives}
                  onChange={e => setFormData({ ...formData, exclusives: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 text-xs shadow-sm"
                >
                  {editingTrip ? 'Save Changes' : 'Create Trip Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrips;