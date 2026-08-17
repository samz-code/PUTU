import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Upload, 
  Search, 
  Truck, 
  Sparkles, 
  X, 
  Check, 
  Eye, 
  EyeOff, 
  Loader2,
  Users,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface Vehicle {
  id?: string;
  name: string;
  type: string;
  capacity: string;
  price_per_day?: number;
  image_url: string;
  description: string;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
}

const VEHICLE_TYPES = ['Sedan', 'SUV', 'G-Wagon', 'Van', 'Luxury Bus', 'Limousine'];
const AVAILABLE_FEATURES = [
  'Air Conditioning', 'Same Driver', 'Airport Pickup', 'Shopping Stops', 
  'Night Transfers', 'Restaurant Transfers', 'Waiting Service', 'Wi-Fi Onboard'
];

const INITIAL_FORM: Vehicle = {
  name: 'Mercedes-Benz E-Class',
  type: 'Sedan',
  capacity: '4 passengers',
  price_per_day: 150,
  image_url: '',
  description: 'Comfortable and discreet for city transfers and VIP airport drops.',
  features: ['Air Conditioning', 'Airport Pickup', 'Same Driver'],
  is_active: true,
  is_featured: false,
};

export default function AdminTransfers() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Vehicle>(INITIAL_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingItem(vehicle);
    setFormData(vehicle);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `vehicle-images/${fileName}`;

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
        const { error } = await supabase
          .from('vehicles')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([formData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      alert('Error saving vehicle: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, field: 'is_active' | 'is_featured', currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ [field]: !currentValue })
        .eq('id', id);

      if (error) throw error;
      setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: !currentValue } : v));
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vehicle "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (err: any) {
      alert('Error deleting vehicle: ' + err.message);
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => {
      const exists = prev.features.includes(feature);
      return {
        ...prev,
        features: exists 
          ? prev.features.filter(f => f !== feature)
          : [...prev.features, feature]
      };
    });
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || v.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-3 sm:p-6 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="text-teal-600 shrink-0" /> Transfers & Fleet Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage transfer vehicles, passenger capacities, pricing, and amenities.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto justify-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all"
        >
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col gap-3">
        <div className="relative w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vehicles or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Filter size={12} /> Category:
          </span>
          {['All', ...VEHICLE_TYPES].map((type) => (
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
          <span className="text-sm font-medium">Loading vehicles...</span>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-500">
          <p className="font-semibold text-base sm:text-lg text-slate-700">No vehicles found</p>
          <p className="text-xs sm:text-sm mt-1">Try adjusting your filters or add a new vehicle.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex gap-3 items-start">
                  <img 
                    src={vehicle.image_url || 'https://via.placeholder.com/150'} 
                    alt={vehicle.name} 
                    className="w-16 h-16 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-md">
                      {vehicle.type}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 truncate">{vehicle.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Users size={12} className="text-slate-400" /> {vehicle.capacity}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100 text-slate-600">
                  <span className="font-semibold text-teal-700">
                    {vehicle.price_per_day ? `$${vehicle.price_per_day} / day` : 'Custom Pricing'}
                  </span>
                  <div className="flex flex-wrap gap-1 max-w-[180px] justify-end">
                    {vehicle.features?.slice(0, 2).map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-[10px] rounded text-slate-600">{f}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleStatus(vehicle.id!, 'is_active', vehicle.is_active)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 ${
                        vehicle.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {vehicle.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                      {vehicle.is_active ? 'Active' : 'Hidden'}
                    </button>

                    <button
                      onClick={() => toggleStatus(vehicle.id!, 'is_featured', vehicle.is_featured)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 ${
                        vehicle.is_featured 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Sparkles size={12} />
                      {vehicle.is_featured ? 'Featured' : 'Standard'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(vehicle)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(vehicle.id!, vehicle.name)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
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
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Category & Capacity</th>
                    <th className="p-4">Pricing</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={vehicle.image_url || 'https://via.placeholder.com/150'} 
                            alt={vehicle.name} 
                            className="w-12 h-12 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{vehicle.name}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{vehicle.description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-md">
                            {vehicle.type}
                          </span>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Users size={12} className="text-slate-400" /> {vehicle.capacity}
                          </p>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-900 text-xs">
                        {vehicle.price_per_day ? `$${vehicle.price_per_day} / day` : 'On Request'}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatus(vehicle.id!, 'is_active', vehicle.is_active)}
                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold transition-colors ${
                              vehicle.is_active 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            {vehicle.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                            <span>{vehicle.is_active ? 'Active' : 'Hidden'}</span>
                          </button>

                          <button
                            onClick={() => toggleStatus(vehicle.id!, 'is_featured', vehicle.is_featured)}
                            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold transition-colors ${
                              vehicle.is_featured 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            <Sparkles size={14} />
                            <span>{vehicle.is_featured ? 'Featured' : 'Standard'}</span>
                          </button>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(vehicle)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id!, vehicle.name)}
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
                {editingItem ? 'Edit Vehicle' : 'Add New Vehicle'}
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
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Vehicle Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Mercedes-Benz G-Wagon"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Vehicle Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  >
                    {VEHICLE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Passenger Capacity</label>
                  <input
                    type="text"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g. 5 passengers"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Price Per Day ($)</label>
                  <input
                    type="number"
                    value={formData.price_per_day || ''}
                    onChange={(e) => setFormData({ ...formData, price_per_day: Number(e.target.value) })}
                    placeholder="150"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comfortable and discreet for city transfers..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Vehicle Image</label>
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
                          <span>Click to upload vehicle photo</span>
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

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Vehicle Amenities / Features</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_FEATURES.map((feature) => {
                    const checked = formData.features?.includes(feature);
                    return (
                      <button
                        type="button"
                        key={feature}
                        onClick={() => toggleFeature(feature)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                          checked
                            ? 'bg-teal-50 border-teal-300 text-teal-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{feature}</span>
                        {checked && <Check size={14} className="text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
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
                  <span>{editingItem ? 'Update Vehicle' : 'Create Vehicle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}