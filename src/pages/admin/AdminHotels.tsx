import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import { 
  Plus, Search, Edit3, Trash2, Building2, MapPin, 
  CheckCircle2, XCircle, X, RefreshCw, Star, Upload, 
  Clock, Phone, ShieldAlert, Check
} from 'lucide-react';

interface PartnerUser {
  id: string;
  email: string;
  full_name?: string;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  address: string | null;
  description: string | null;
  star_rating: number;
  check_in_time: string;
  check_out_time: string;
  contact_email: string | null;
  contact_phone: string | null;
  amenities: string[];
  commission_pct: number;
  partner_user_id: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
}

const AVAILABLE_AMENITIES = [
  'Free WiFi',
  'Swimming Pool',
  'Airport Shuttle',
  'Fitness Center',
  'Restaurant',
  'Room Service',
  'Bar & Lounge',
  'Free Parking',
  'Spa & Wellness',
  '24-Hour Front Desk',
];

const DEFAULT_FORM_STATE = {
  id: '',
  name: '',
  location: '',
  address: '',
  description: '',
  star_rating: 4,
  check_in_time: '14:00',
  check_out_time: '11:00',
  contact_email: '',
  contact_phone: '',
  amenities: [] as string[],
  commission_pct: 15,
  partner_user_id: '',
  image_url: '',
  is_active: true,
};

export default function AdminHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);

  // Drag & Drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hotelsRes, partnersRes] = await Promise.all([
        supabase.from('hotels').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, email, full_name').eq('role', 'partner'),
      ]);

      setHotels((hotelsRes.data as Hotel[]) ?? []);
      setPartners((partnersRes.data as PartnerUser[]) ?? []);
    } catch (err) {
      console.error('Failed to load hotel management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData(DEFAULT_FORM_STATE);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (hotel: Hotel) => {
    setFormData({
      id: hotel.id,
      name: hotel.name,
      location: hotel.location || '',
      address: hotel.address || '',
      description: hotel.description || '',
      star_rating: hotel.star_rating || 4,
      check_in_time: hotel.check_in_time || '14:00',
      check_out_time: hotel.check_out_time || '11:00',
      contact_email: hotel.contact_email || '',
      contact_phone: hotel.contact_phone || '',
      amenities: hotel.amenities || [],
      commission_pct: hotel.commission_pct || 15,
      partner_user_id: hotel.partner_user_id || '',
      image_url: hotel.image_url || '',
      is_active: hotel.is_active ?? true,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Drag & Drop Image Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImageFile(e.target.files[0]);
    }
  };

  const uploadImageFile = async (file: File) => {
    try {
      setSubmitting(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `hotel-${Date.now()}.${fileExt}`;
      const filePath = `hotels/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, image_url: data.publicUrl }));
    } catch (err) {
      console.error('Image upload failed:', err);
      const mockPreview = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, image_url: mockPreview }));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name,
      location: formData.location,
      address: formData.address || null,
      description: formData.description || null,
      star_rating: formData.star_rating,
      check_in_time: formData.check_in_time,
      check_out_time: formData.check_out_time,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      amenities: formData.amenities,
      commission_pct: Number(formData.commission_pct),
      partner_user_id: formData.partner_user_id || null,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
    };

    if (isEditing) {
      const { error } = await supabase.from('hotels').update(payload).eq('id', formData.id);
      if (!error) {
        setHotels((prev) => prev.map((h) => (h.id === formData.id ? { ...h, ...payload } : h)));
      }
    } else {
      const { data, error } = await supabase.from('hotels').insert([payload]).select().single();
      if (!error && data) {
        setHotels((prev) => [data as Hotel, ...prev]);
      }
    }

    setSubmitting(false);
    setIsModalOpen(false);
  };

  const toggleStatus = async (hotel: Hotel) => {
    const updatedStatus = !hotel.is_active;
    setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, is_active: updatedStatus } : h)));
    await supabase.from('hotels').update({ is_active: updatedStatus }).eq('id', hotel.id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setHotels((prev) => prev.filter((h) => h.id !== deleteTarget.id));
    await supabase.from('hotels').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
  };

  const filteredHotels = hotels.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && h.is_active) ||
      (statusFilter === 'inactive' && !h.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Hotel Listings & Property Partners"
          subtitle="Configure hotel profiles, availability rules, amenities, and commission rates"
        />
        <button
          onClick={openCreateModal}
          className="btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 w-full sm:w-auto"
        >
          <Plus size={16} />
          <span>Add New Property</span>
        </button>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input text-xs pl-10 pr-4 py-2 w-full"
            placeholder="Search by hotel name, city, or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2">
          {(['all', 'active', 'inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`capitalize text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex-1 sm:flex-none text-center ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* PROPERTIES LISTINGS */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading properties database...</div>
        ) : filteredHotels.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Building2 size={36} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Hotel Properties Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Get started by registering a new property partner or adjusting your search filters.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Property</th>
                    <th className="px-5 py-4">Location & Contact</th>
                    <th className="px-5 py-4">Check-In / Out</th>
                    <th className="px-5 py-4">Partner Manager</th>
                    <th className="px-5 py-4">Commission</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredHotels.map((h) => {
                    const manager = partners.find((p) => p.id === h.partner_user_id);
                    return (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3.5">
                            {h.image_url ? (
                              <img
                                src={h.image_url}
                                alt={h.name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                                <Building2 size={20} />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <span>{h.name}</span>
                                <div className="flex text-amber-400">
                                  {Array.from({ length: h.star_rating || 4 }).map((_, i) => (
                                    <Star key={i} size={11} fill="currentColor" />
                                  ))}
                                </div>
                              </div>
                              <div className="text-2xs text-slate-400 mt-0.5">
                                <span>{h.amenities?.length || 0} Amenities Configured</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <MapPin size={12} className="text-teal-600 shrink-0" />
                            <span>{h.location}</span>
                          </div>
                          {h.contact_phone && (
                            <div className="text-2xs text-slate-400 flex items-center gap-1">
                              <Phone size={10} /> {h.contact_phone}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <div className="flex items-center gap-1 text-2xs font-mono font-semibold">
                            <Clock size={12} className="text-slate-400" />
                            <span>In: {h.check_in_time || '14:00'}</span>
                            <span className="text-slate-300">|</span>
                            <span>Out: {h.check_out_time || '11:00'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {manager ? (
                            <div>
                              <div className="font-bold text-slate-800 text-xs">{manager.full_name || 'Partner Account'}</div>
                              <div className="text-2xs text-slate-400">{manager.email}</div>
                            </div>
                          ) : (
                            <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-extrabold text-slate-900 text-sm">
                          {h.commission_pct}%
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => toggleStatus(h)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold border transition-colors ${
                              h.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {h.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            <span>{h.is_active ? 'Active' : 'Offline'}</span>
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(h)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Property"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(h)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Property"
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

            {/* Mobile Responsive Cards View */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredHotels.map((h) => (
                <div key={h.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {h.image_url ? (
                        <img
                          src={h.image_url}
                          alt={h.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Building2 size={22} />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{h.name}</h4>
                        <div className="flex text-amber-400 my-0.5">
                          {Array.from({ length: h.star_rating || 4 }).map((_, i) => (
                            <Star key={i} size={10} fill="currentColor" />
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-2xs text-slate-500">
                          <MapPin size={12} />
                          <span>{h.location}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleStatus(h)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        h.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {h.is_active ? 'Active' : 'Offline'}
                    </button>
                  </div>

                  {h.amenities && h.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {h.amenities.slice(0, 3).map((a) => (
                        <span key={a} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {a}
                        </span>
                      ))}
                      {h.amenities.length > 3 && (
                        <span className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-md">
                          +{h.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-2xs text-slate-400 block">Commission</span>
                      <span className="font-bold text-slate-900">{h.commission_pct}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(h)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(h)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-2xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CREATE / EDIT PROPERTY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5 border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-base sm:text-lg">
                  {isEditing ? 'Edit Hotel Profile' : 'Register Booking.com Hotel Listing'}
                </h3>
                <p className="text-2xs text-slate-400">Configure property visual assets, availability rules, and parameters.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* DRAG & DROP COVER IMAGE UPLOADER PLACED AT THE VERY TOP */}
              <div>
                <label className="label text-xs font-semibold text-slate-700 mb-1.5 block">Property Cover Image (Drag & Drop)</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all relative ${
                    isDragging ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {formData.image_url ? (
                    <div className="relative group max-h-40 overflow-hidden rounded-xl">
                      <img src={formData.image_url} alt="Preview" className="w-full h-32 sm:h-36 object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                        <Upload size={16} /> Click or Drag to replace cover photo
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
                        <Upload size={18} />
                      </div>
                      <div className="text-xs font-medium text-slate-700">
                        <span className="text-teal-600 font-bold">Click to upload</span> or drag and drop image here
                      </div>
                      <p className="text-[10px] text-slate-400">PNG, JPG, or WEBP up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* GENERAL INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-semibold text-slate-700">Hotel Name</label>
                  <input
                    type="text"
                    required
                    className="input text-xs"
                    placeholder="e.g. Solai Grand Safari Lodge"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700">City / Destination</label>
                  <input
                    type="text"
                    required
                    className="input text-xs"
                    placeholder="e.g. Naivasha, Kenya"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              {/* STAR RATING & PARTNER USER LINK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-semibold text-slate-700">Star Rating</label>
                  <select
                    className="input text-xs"
                    value={formData.star_rating}
                    onChange={(e) => setFormData({ ...formData, star_rating: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <option key={s} value={s}>
                        {s} Star{s > 1 ? 's' : ''} Property
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700">Assigned Partner Manager</label>
                  <select
                    className="input text-xs"
                    value={formData.partner_user_id}
                    onChange={(e) => setFormData({ ...formData, partner_user_id: e.target.value })}
                  >
                    <option value="">-- No Assigned Partner --</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || p.email} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CHECK-IN WINDOW & COMMISSION */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs font-semibold text-slate-700">Check-In Time</label>
                  <input
                    type="time"
                    className="input text-xs"
                    value={formData.check_in_time}
                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700">Check-Out Time</label>
                  <input
                    type="time"
                    className="input text-xs"
                    value={formData.check_out_time}
                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700">Commission %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input text-xs"
                    value={formData.commission_pct}
                    onChange={(e) => setFormData({ ...formData, commission_pct: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* AMENITIES SELECTION GRID */}
              <div>
                <label className="label text-xs font-semibold text-slate-700 mb-2 block">Property Amenities</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_AMENITIES.map((amenity) => {
                    const isSelected = formData.amenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-3 py-2 rounded-xl text-2xs font-semibold flex items-center justify-between border transition-all ${
                          isSelected
                            ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{amenity}</span>
                        {isSelected && <Check size={14} className="text-teal-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CONTACT DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label text-xs font-semibold text-slate-700">Frontdesk Phone</label>
                  <input
                    type="text"
                    className="input text-xs"
                    placeholder="+254 700 000 000"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700">Reservations Email</label>
                  <input
                    type="email"
                    className="input text-xs"
                    placeholder="bookings@hotel.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs font-semibold text-slate-700">Property Description</label>
                <textarea
                  rows={3}
                  className="input text-xs py-2"
                  placeholder="Summarize property highlights, view, neighborhood, and unique guest offerings..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active_check"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="is_active_check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Publish Property as Active for Guest Reservations
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-xs w-full sm:w-auto">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-5 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>{isEditing ? 'Save Changes' : 'Create Listing'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-xl space-y-4 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-900 text-base">Delete Listing?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <span className="font-bold text-slate-800">{deleteTarget.name}</span>? This will permanently erase associated availability rules and room records.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-xs flex-1">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 rounded-xl flex-1 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}