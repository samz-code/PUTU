import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Compass, 
  X, 
  Eye, 
  EyeOff, 
  Loader2,
  UploadCloud
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface AdminDestination {
  id?: string;
  name: string;
  region: string;
  image_url: string;
  description: string;
  highlights: string[];
  display_order: number;
  is_active: boolean;
}

const INITIAL_FORM: AdminDestination = {
  name: '',
  region: 'South Coast',
  image_url: '',
  description: '',
  highlights: [],
  display_order: 0,
  is_active: true,
};

export default function AdminDestinations() {
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminDestination | null>(null);
  const [formData, setFormData] = useState<AdminDestination>(INITIAL_FORM);
  const [highlightInput, setHighlightInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Drag and drop / upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setDestinations(data || []);
    } catch (err: any) {
      console.error('Error fetching destinations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setHighlightInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (destination: AdminDestination) => {
    setEditingItem(destination);
    setFormData(destination);
    setHighlightInput('');
    setIsModalOpen(true);
  };

  const handleAddHighlight = () => {
    if (!highlightInput.trim()) return;
    setFormData({
      ...formData,
      highlights: [...(formData.highlights || []), highlightInput.trim()]
    });
    setHighlightInput('');
  };

  const handleRemoveHighlight = (index: number) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((_, i) => i !== index)
    });
  };

  // Handle file upload to Supabase Storage
  const uploadImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `destinations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      alert('Error uploading image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingItem?.id) {
        const { id, ...updatePayload } = formData;
        const { error } = await supabase
          .from('destinations')
          .update(updatePayload)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { id, ...insertPayload } = formData;
        const { error } = await supabase
          .from('destinations')
          .insert([insertPayload]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchDestinations();
    } catch (err: any) {
      alert('Error saving destination: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('destinations')
        .update({ is_active: !currentValue })
        .eq('id', id);

      if (error) throw error;
      setDestinations(destinations.map(d => d.id === id ? { ...d, is_active: !currentValue } : d));
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete destination "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDestinations(destinations.filter(d => d.id !== id));
    } catch (err: any) {
      alert('Error deleting destination: ' + err.message);
    }
  };

  const filteredDestinations = destinations.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.region.toLowerCase().includes(search.toLowerCase()) ||
    d.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="text-teal-600 shrink-0" /> Destinations Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage coastal regions, descriptions, highlight tags, and visual media displayed on the public site.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto justify-center px-4 py-3 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} /> Add Destination
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
        <div className="relative w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search destinations by name, region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 size={24} className="animate-spin text-teal-600" />
          <span className="text-sm font-medium">Loading destinations...</span>
        </div>
      ) : filteredDestinations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-500">
          <p className="font-semibold text-base sm:text-lg text-slate-700">No destinations found</p>
          <p className="text-xs sm:text-sm mt-1">Try adjusting your search or add a new destination.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards Stack (< 768px) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredDestinations.map((dest) => (
              <div key={dest.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <img 
                    src={dest.image_url} 
                    alt={dest.name} 
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-base truncate">{dest.name}</h3>
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-md text-[11px] font-semibold shrink-0">
                        {dest.region}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{dest.description}</p>
                  </div>
                </div>

                {dest.highlights && dest.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {dest.highlights.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium">
                        {h}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStatus(dest.id!, dest.is_active)}
                      className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 font-semibold transition-colors ${
                        dest.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {dest.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{dest.is_active ? 'Active' : 'Hidden'}</span>
                    </button>
                    <span className="text-slate-400 font-medium">Order: {dest.display_order}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(dest)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(dest.id!, dest.name)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet View: Table (>= 768px) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4">Destination</th>
                    <th className="p-4">Region</th>
                    <th className="p-4">Highlights</th>
                    <th className="p-4">Order</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDestinations.map((dest) => (
                    <tr key={dest.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={dest.image_url} 
                            alt={dest.name} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" 
                          />
                          <div>
                            <p className="font-bold text-slate-900">{dest.name}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{dest.description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-md text-xs font-semibold">
                          {dest.region}
                        </span>
                      </td>

                      <td className="p-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {dest.highlights?.slice(0, 2).map((h, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">
                              {h}
                            </span>
                          ))}
                          {dest.highlights?.length > 2 && (
                            <span className="text-[10px] text-slate-400 self-center">+{dest.highlights.length - 2} more</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-xs font-semibold text-slate-600">
                        {dest.display_order}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => toggleStatus(dest.id!, dest.is_active)}
                          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold transition-colors ${
                            dest.is_active 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {dest.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span>{dest.is_active ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(dest)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(dest.id!, dest.name)}
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

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-20">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {editingItem ? 'Edit Destination' : 'Add Destination'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Destination Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Diani Beach"
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Region *</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none"
                  >
                    <option value="South Coast">South Coast</option>
                    <option value="North Coast">North Coast</option>
                    <option value="Coast">Coast (Mombasa/Central)</option>
                    <option value="Far North">Far North (Lamu)</option>
                  </select>
                </div>
              </div>

              {/* Drag and Drop / Touch Upload Zone */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Destination Image *</label>
                
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center transition-all relative flex flex-col items-center justify-center bg-slate-50/50 ${
                    isDragging ? 'border-teal-500 bg-teal-50/30' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />

                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 size={24} className="animate-spin text-teal-600" />
                      <span className="text-xs font-medium text-slate-500">Uploading image...</span>
                    </div>
                  ) : formData.image_url ? (
                    <div className="flex items-center gap-3 w-full">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0" 
                      />
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="text-xs font-bold text-slate-700 truncate">Image uploaded successfully</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{formData.image_url}</p>
                        <p className="text-[10px] text-teal-600 font-semibold mt-1">Tap or drag to replace</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Tap to browse or drag & drop image
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WebP up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="Or paste direct image URL..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none text-slate-600"
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
                  placeholder="Detailed overview of the destination..."
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none resize-none"
                />
              </div>

              {/* Highlights Manager */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Key Highlights</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    placeholder="e.g. Fort Jesus Museum"
                    className="flex-1 px-3.5 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="px-4 py-2.5 sm:py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-700 shrink-0"
                  >
                    Add Tag
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {formData.highlights?.map((h, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg shadow-sm">
                      {h}
                      <button type="button" onClick={() => handleRemoveHighlight(i)} className="text-slate-400 hover:text-rose-600 p-0.5">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {(!formData.highlights || formData.highlights.length === 0) && (
                    <span className="text-xs text-slate-400 italic self-center">No highlights added yet.</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="flex items-center pt-2 sm:pt-6">
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
                  disabled={submitting || uploadingImage}
                  className="px-6 py-3 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 active:scale-95"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{editingItem ? 'Update Destination' : 'Create Destination'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}