import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export interface Experience {
  id: string;
  title: string;
  category: string;
  description: string | null;
  price: number | null;
  duration: string | null;
  image_url: string | null;
  is_active: boolean;
  inclusives: string[] | null;
  exclusives: string[] | null;
}

export default function AdminExperiences() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('coastal');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [inclusivesText, setInclusivesText] = useState('');
  const [exclusivesText, setExclusivesText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Fetch experiences
  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .order('title', { ascending: true }); // Querying 'title' instead of 'name'

      if (error) throw error;
      setExperiences(data || []);
    } catch (err: any) {
      alert('Error fetching experiences: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  // Category filter list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(experiences.map((i) => i.category))).filter(Boolean);
    return ['All', ...cats.sort()];
  }, [experiences]);

  // Filtered experiences
  const filteredExperiences = useMemo(() => {
    return experiences.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch =
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [experiences, selectedCategory, searchQuery]);

  // Open Modal for Create or Edit
  const openModal = (exp?: Experience) => {
    if (exp) {
      setEditingExperience(exp);
      setTitle(exp.title || '');
      setCategory(exp.category || 'coastal');
      setPrice(exp.price ? String(exp.price) : '');
      setDuration(exp.duration || '');
      setDescription(exp.description || '');
      setInclusivesText(exp.inclusives ? exp.inclusives.join(', ') : '');
      setExclusivesText(exp.exclusives ? exp.exclusives.join(', ') : '');
      setIsActive(exp.is_active);
      setPreviewUrl(exp.image_url || '');
    } else {
      setEditingExperience(null);
      setTitle('');
      setCategory('coastal');
      setPrice('');
      setDuration('');
      setDescription('');
      setInclusivesText('');
      setExclusivesText('');
      setIsActive(true);
      setPreviewUrl('');
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExperience(null);
    setImageFile(null);
    setPreviewUrl('');
  };

  // Upload image handler
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('experience-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('experience-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Handle Form Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalImageUrl = previewUrl;

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      // Convert comma-separated string inputs to PostgreSQL array arrays
      const inclusives = inclusivesText
        ? inclusivesText.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const exclusives = exclusivesText
        ? exclusivesText.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title,
        category,
        price: price ? parseFloat(price) : null,
        duration: duration || null,
        description: description || null,
        image_url: finalImageUrl || null,
        is_active: isActive,
        inclusives,
        exclusives,
      };

      if (editingExperience) {
        const { error } = await supabase
          .from('experiences')
          .update(payload)
          .eq('id', editingExperience.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('experiences')
          .insert([payload]);
        if (error) throw error;
      }

      closeModal();
      fetchExperiences();
    } catch (err: any) {
      alert('Error saving experience: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active status directly from table
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('experiences')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchExperiences();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Delete experience
  const handleDelete = async (id: string, expTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${expTitle}"?`)) return;

    try {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchExperiences();
    } catch (err: any) {
      alert('Error deleting experience: ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Experiences</h1>
          <p className="text-sm text-slate-500">Create, edit, and organize public experiences and cover media.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Experience
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <input
          type="text"
          placeholder="Search by title, description, category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-80 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
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

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading experiences...</div>
        ) : filteredExperiences.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No experiences found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Cover</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Inclusions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExperiences.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      {exp.image_url ? (
                        <img
                          src={exp.image_url}
                          alt={exp.title}
                          className="w-12 h-10 object-cover rounded border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-[10px]">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{exp.title}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-medium uppercase">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      ${exp.price ? Number(exp.price).toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3">{exp.duration || '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {exp.inclusives?.length || 0} items
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(exp.id, exp.is_active)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          exp.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {exp.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openModal(exp)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id, exp.title)}
                        className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingExperience ? 'Edit Experience' : 'Add New Experience'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 hours / Full day"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setImageFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mt-2 w-full h-36 object-cover rounded-lg border border-slate-200"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Inclusions (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Guided tour, Drinks, Lunch"
                  value={inclusivesText}
                  onChange={(e) => setInclusivesText(e.target.value)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Exclusions (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gratuities, Hotel Transfer"
                  value={exclusivesText}
                  onChange={(e) => setExclusivesText(e.target.value)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  Visible / Active on Public Site
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}