import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Upload, 
  Search, 
  Building2, 
  X, 
  Eye, 
  EyeOff, 
  Loader2,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface PartnerOffering {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  portal_name: string;
  category_key: string;
  is_active: boolean;
  display_order: number;
}

const CATEGORY_OPTIONS = [
  { key: 'hotel', label: 'Hotel' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'driver', label: 'Driver' },
  { key: 'guide', label: 'Tour Guide' },
];

const INITIAL_FORM: PartnerOffering = {
  title: 'Hotel Partners',
  description: 'Manage availability, rooms, prices, photos, blackout dates, commissions, and reservations.',
  image_url: '',
  portal_name: 'Hotel Portal',
  category_key: 'hotel',
  is_active: true,
  display_order: 0,
};

export default function AdminPartners() {
  const [partners, setPartners] = useState<PartnerOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PartnerOffering | null>(null);
  const [formData, setFormData] = useState<PartnerOffering>(INITIAL_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_offerings')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (err: any) {
      console.error('Error fetching partner offerings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (partner: PartnerOffering) => {
    setEditingItem(partner);
    setFormData(partner);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `partner-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fleet')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('fleet')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
    } catch (err: any) {
      alert('Error uploading image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingItem?.id) {
        // Strip out 'id' to prevent PostgREST primary key update errors
        const { id, ...updatePayload } = formData;

        const { error } = await supabase
          .from('partner_offerings')
          .update(updatePayload)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { id, ...insertPayload } = formData;

        const { error } = await supabase
          .from('partner_offerings')
          .insert([insertPayload]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchPartners();
    } catch (err: any) {
      alert('Error saving partner offering: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('partner_offerings')
        .update({ is_active: !currentValue })
        .eq('id', id);

      if (error) throw error;
      setPartners(partners.map(p => p.id === id ? { ...p, is_active: !currentValue } : p));
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete partner offering "${title}"?`)) return;

    try {
      const { error } = await supabase
        .from('partner_offerings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPartners(partners.filter(p => p.id !== id));
    } catch (err: any) {
      alert('Error deleting partner offering: ' + err.message);
    }
  };

  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.portal_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category_key === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-3 sm:p-6 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-teal-600 shrink-0" /> Partners & Portals Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage partner network offerings, category portals, descriptions, and active statuses.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto justify-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus size={18} /> Add Partner Program
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col gap-3">
        <div className="relative w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search partner programs or portals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Filter size={12} /> Category:
          </span>
          {['All', ...CATEGORY_OPTIONS.map(c => c.key)].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 capitalize ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 size={24} className="animate-spin text-teal-600" />
          <span className="text-sm font-medium">Loading partner offerings...</span>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-500">
          <p className="font-semibold text-base sm:text-lg text-slate-700">No partner programs found</p>
          <p className="text-xs sm:text-sm mt-1">Try adjusting your filters or add a new partner program.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex gap-3 items-start">
                  <img 
                    src={partner.image_url || 'https://via.placeholder.com/150'} 
                    alt={partner.title} 
                    className="w-16 h-16 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-md uppercase">
                      {partner.category_key}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 truncate">{partner.title}</h3>
                    <p className="text-xs text-teal-700 font-semibold mt-0.5">{partner.portal_name}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{partner.description}</p>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleStatus(partner.id!, partner.is_active)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 ${
                        partner.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {partner.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                      {partner.is_active ? 'Active' : 'Hidden'}
                    </button>
                    <span className="text-[11px] text-slate-400 font-medium">Order: {partner.display_order}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(partner)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(partner.id!, partner.title)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4">Program & Portal</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Display Order</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={partner.image_url || 'https://via.placeholder.com/150'} 
                            alt={partner.title} 
                            className="w-12 h-12 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{partner.title}</p>
                            <p className="text-xs text-teal-700 font-semibold mt-0.5">{partner.portal_name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-md uppercase">
                          {partner.category_key}
                        </span>
                      </td>

                      <td className="p-4 text-xs font-semibold text-slate-600">
                        {partner.display_order}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => toggleStatus(partner.id!, partner.is_active)}
                          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold transition-colors ${
                            partner.is_active 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {partner.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span>{partner.is_active ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(partner)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(partner.id!, partner.title)}
                            className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Partner Program' : 'Add New Partner Program'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Program Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Hotel Partners"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Portal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.portal_name}
                    onChange={(e) => setFormData({ ...formData, portal_name: e.target.value })}
                    placeholder="e.g. Hotel Portal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category Type</label>
                  <select
                    value={formData.category_key}
                    onChange={(e) => setFormData({ ...formData, category_key: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none capitalize"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Manage availability, rooms, prices..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Partner Image</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="w-full sm:w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0" />
                  )}
                  <div className="flex-1 w-full">
                    <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      {uploadingImage ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 size={16} className="animate-spin text-teal-600" />
                          Uploading...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <Upload size={16} className="text-teal-600" />
                          <span>Click to upload partner photo</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Or paste image URL..."
                      className="w-full px-3 py-1.5 mt-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Is Active / Published</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingItem ? 'Update Program' : 'Create Program'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}