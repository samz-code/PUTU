import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Upload, 
  Search, 
  Building2, 
  Sparkles, 
  Star, 
  X, 
  Check, 
  MapPin, 
  Eye, 
  EyeOff, 
  Loader2,
  Bed,
  Users,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface AccommodationItem {
  id?: string;
  slug: string;
  name: string;
  type: string;
  location: string;
  address?: string;
  price_range: string;
  price_per_night?: number;
  rating: number;
  reviews_count: number;
  image_url: string;
  tagline: string;
  description: string;
  capacity: string;
  bedrooms: string;
  bathrooms?: string;
  amenities: string[];
  highlights: string[];
  contact_email?: string;
  contact_phone?: string;
  is_featured: boolean;
  is_active: boolean;
}

const PROPERTY_TYPES = ['Resort', 'Villa', 'Boutique Hotel', 'Apartment', 'Hotel', 'Cottage', 'Glamping'];
const AVAILABLE_AMENITIES = [
  'Beachfront', 'Ocean View', 'Swimming Pool', 'Spa', 'WiFi', 'Gym', 'Meal Plan', 'Accessibility', 'Air Conditioning', 'Free Parking', 'Kitchen'
];

const INITIAL_FORM: AccommodationItem = {
  slug: '',
  name: '',
  type: 'Resort',
  location: 'Diani Beach',
  address: '',
  price_range: '$250 - $500 / night',
  price_per_night: 250,
  rating: 5.0,
  reviews_count: 0,
  image_url: '',
  tagline: '',
  description: '',
  capacity: '2 - 4 Guests',
  bedrooms: '2 Bedrooms',
  bathrooms: '2 Baths',
  amenities: ['Beachfront', 'WiFi', 'Swimming Pool'],
  highlights: [],
  contact_email: '',
  contact_phone: '',
  is_featured: false,
  is_active: true,
};

export default function AccommodationsAdmin() {
  const [items, setItems] = useState<AccommodationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  
  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AccommodationItem | null>(null);
  const [formData, setFormData] = useState<AccommodationItem>(INITIAL_FORM);
  const [newHighlight, setNewHighlight] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching accommodations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AccommodationItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `property-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('accommodations')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('accommodations')
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
      const slugValue = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      // Clean payload for columns in database
      const { price_per_night, address, bathrooms, contact_email, contact_phone, ...payload } = formData;
      const finalPayload = { ...payload, slug: slugValue };

      if (editingItem?.id) {
        const { error } = await supabase
          .from('accommodations')
          .update(finalPayload)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accommodations')
          .insert([finalPayload]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchAccommodations();
    } catch (err: any) {
      alert('Error saving property: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, field: 'is_active' | 'is_featured', currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('accommodations')
        .update({ [field]: !currentValue })
        .eq('id', id);

      if (error) throw error;
      setItems(items.map(item => item.id === id ? { ...item, [field]: !currentValue } : item));
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('accommodations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
    } catch (err: any) {
      alert('Error deleting accommodation: ' + err.message);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, newHighlight.trim()]
    }));
    setNewHighlight('');
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-3 sm:p-6 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-teal-600 shrink-0" /> Accommodation Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage coastal stays, room details, and storage media.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto justify-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus size={18} /> Add Property
        </button>
      </div>

      {/* Search & Mobile Filter Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col gap-3">
        <div className="relative w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search properties or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Filter size={12} /> Type:
          </span>
          {['All', ...PROPERTY_TYPES].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedType === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 size={24} className="animate-spin text-teal-600" />
          <span className="text-sm font-medium">Loading accommodations...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-500">
          <p className="font-semibold text-base sm:text-lg text-slate-700">No properties found</p>
          <p className="text-xs sm:text-sm mt-1">Try adjusting your filters or create a new property.</p>
        </div>
      ) : (
        <>
          {/* MOBILE CARD VIEW (Hidden on md and larger screens) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex gap-3 items-start">
                  <img 
                    src={item.image_url || 'https://via.placeholder.com/150'} 
                    alt={item.name} 
                    className="w-16 h-16 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-md">
                        {item.type}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0">
                        <Star size={12} className="fill-amber-500" /> {item.rating}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 truncate">{item.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin size={12} className="text-slate-400 shrink-0" /> {item.location}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 text-slate-600">
                  <div className="flex items-center gap-1">
                    <Bed size={13} className="text-slate-400" /> {item.bedrooms}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={13} className="text-slate-400" /> {item.capacity}
                  </div>
                  <div className="col-span-2 font-semibold text-slate-900 mt-1">
                    {item.price_range}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleStatus(item.id!, 'is_active', item.is_active)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                        item.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {item.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                      {item.is_active ? 'Active' : 'Hidden'}
                    </button>

                    <button
                      onClick={() => toggleStatus(item.id!, 'is_featured', item.is_featured)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                        item.is_featured 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Sparkles size={12} />
                      {item.is_featured ? 'Featured' : 'Standard'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id!, item.name)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW (Visible on md and larger screens) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4">Property</th>
                    <th className="p-4">Location & Type</th>
                    <th className="p-4">Capacity & Rooms</th>
                    <th className="p-4">Price Range</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.image_url || 'https://via.placeholder.com/150'} 
                            alt={item.name} 
                            className="w-12 h-12 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                              <span className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star size={12} className="fill-amber-500" /> {item.rating}
                              </span>
                              <span>({item.reviews_count} reviews)</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-md">
                            {item.type}
                          </span>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin size={12} className="text-slate-400" /> {item.location}
                          </p>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1">
                            <Bed size={13} className="text-slate-400" /> {item.bedrooms}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={13} className="text-slate-400" /> {item.capacity}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-900 text-xs">
                        {item.price_range}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatus(item.id!, 'is_active', item.is_active)}
                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold transition-colors ${
                              item.is_active 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            {item.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                            <span>{item.is_active ? 'Active' : 'Hidden'}</span>
                          </button>

                          <button
                            onClick={() => toggleStatus(item.id!, 'is_featured', item.is_featured)}
                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold transition-colors ${
                              item.is_featured 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            <Sparkles size={14} />
                            <span>{item.is_featured ? 'Featured' : 'Standard'}</span>
                          </button>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id!, item.name)}
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

      {/* CREATE / EDIT RESPONSIVE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Accommodation' : 'Add New Accommodation'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Swahili Beach Luxury Resort"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="swahili-beach-resort"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Property Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {PROPERTY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Diani Beach, Watamu, Lamu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Price Range Display
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price_range}
                    onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                    placeholder="e.g. $280 - $550 / night"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="text"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      placeholder="e.g. 2 Bedrooms"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                      Capacity
                    </label>
                    <input
                      type="text"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="e.g. 4 Guests"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Short catchy summary..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Full Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed property overview..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                  Cover Image
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 w-full">
                    <label className="flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      {uploadingImage ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 size={16} className="animate-spin text-teal-600" />
                          Uploading...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <Upload size={16} className="text-teal-600" />
                          <span>Click to upload new image</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Or paste image URL directly..."
                      className="w-full px-3 py-1.5 mt-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                  Property Amenities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {AVAILABLE_AMENITIES.map((amenity) => {
                    const checked = formData.amenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                          checked
                            ? 'bg-teal-50 border-teal-300 text-teal-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{amenity}</span>
                        {checked && <Check size={14} className="text-teal-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                  Key Highlights
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    placeholder="e.g. Private butler service"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } }}
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-3 py-1.5 bg-slate-800 text-white font-semibold text-xs rounded-xl hover:bg-slate-900"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.highlights.map((h, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200"
                    >
                      <span>{h}</span>
                      <button
                        type="button"
                        onClick={() => removeHighlight(index)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Mark as Featured</span>
                </label>

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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 sm:gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 sm:flex-none px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingItem ? 'Update Property' : 'Create Property'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}