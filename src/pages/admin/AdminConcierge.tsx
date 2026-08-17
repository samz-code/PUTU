import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Sparkles, 
  X, 
  Eye, 
  EyeOff, 
  Loader2,
  Utensils,
  Heart,
  Cake,
  Camera,
  Flower2,
  CalendarCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface ConciergeService {
  id?: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

const ICON_OPTIONS = [
  { key: 'Utensils', label: 'Utensils (Restaurant)' },
  { key: 'Heart', label: 'Heart (Romantic)' },
  { key: 'Cake', label: 'Cake (Celebration)' },
  { key: 'Camera', label: 'Camera (Proposal/Photo)' },
  { key: 'Flower2', label: 'Flower (Decorations)' },
  { key: 'CalendarCheck', label: 'Calendar Check (Diet/Schedule)' },
];

const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Heart,
  Cake,
  Camera,
  Flower2,
  CalendarCheck,
};

const INITIAL_FORM: ConciergeService = {
  title: '',
  description: '',
  icon_name: 'Utensils',
  display_order: 0,
  is_active: true,
};

export default function AdminConcierge() {
  const [services, setServices] = useState<ConciergeService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConciergeService | null>(null);
  const [formData, setFormData] = useState<ConciergeService>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('concierge_services')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      console.error('Error fetching concierge services:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: ConciergeService) => {
    setEditingItem(service);
    setFormData(service);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingItem?.id) {
        const { id, ...updatePayload } = formData;
        const { error } = await supabase
          .from('concierge_services')
          .update(updatePayload)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { id, ...insertPayload } = formData;
        const { error } = await supabase
          .from('concierge_services')
          .insert([insertPayload]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      alert('Error saving concierge service: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('concierge_services')
        .update({ is_active: !currentValue })
        .eq('id', id);

      if (error) throw error;
      setServices(services.map(s => s.id === id ? { ...s, is_active: !currentValue } : s));
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete concierge service "${title}"?`)) return;

    try {
      const { error } = await supabase
        .from('concierge_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setServices(services.filter(s => s.id !== id));
    } catch (err: any) {
      alert('Error deleting service: ' + err.message);
    }
  };

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-teal-600 shrink-0" /> Concierge Services Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage special guest requests, dining packages, celebrations, and concierge offerings.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto justify-center px-4 py-3 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} /> Add Service
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
        <div className="relative w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search concierge services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 size={24} className="animate-spin text-teal-600" />
          <span className="text-sm font-medium">Loading concierge services...</span>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-500">
          <p className="font-semibold text-base sm:text-lg text-slate-700">No concierge services found</p>
          <p className="text-xs sm:text-sm mt-1">Try adjusting your search or add a new service.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards Stack (< 768px) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredServices.map((service) => {
              const IconComponent = iconMap[service.icon_name] || Utensils;
              return (
                <div key={service.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-teal-600 shadow-sm">
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-base truncate">{service.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{service.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleStatus(service.id!, service.is_active)}
                        className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 font-semibold transition-colors ${
                          service.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {service.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span>{service.is_active ? 'Active' : 'Hidden'}</span>
                      </button>
                      <span className="text-slate-400 font-medium">Order: {service.display_order}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(service)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id!, service.title)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet View: Table (>= 768px) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4">Service</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Display Order</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredServices.map((service) => {
                    const IconComponent = iconMap[service.icon_name] || Utensils;
                    return (
                      <tr key={service.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-teal-600">
                              <IconComponent size={18} />
                            </div>
                            <p className="font-bold text-slate-900">{service.title}</p>
                          </div>
                        </td>

                        <td className="p-4 text-xs text-slate-600 max-w-md">
                          <p className="line-clamp-2">{service.description}</p>
                        </td>

                        <td className="p-4 text-xs font-semibold text-slate-600">
                          {service.display_order}
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => toggleStatus(service.id!, service.is_active)}
                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold transition-colors ${
                              service.is_active 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            {service.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                            <span>{service.is_active ? 'Active' : 'Hidden'}</span>
                          </button>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(service)}
                              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(service.id!, service.title)}
                              className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-20">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {editingItem ? 'Edit Concierge Service' : 'Add Concierge Service'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Service Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Romantic Dinner"
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Icon Type</label>
                  <select
                    value={formData.icon_name}
                    onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none"
                  >
                    {ICON_OPTIONS.map(icon => (
                      <option key={icon.key} value={icon.key}>{icon.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the service..."
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Is Active / Published</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur py-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 sm:py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 active:scale-95"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingItem ? 'Update Service' : 'Create Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}