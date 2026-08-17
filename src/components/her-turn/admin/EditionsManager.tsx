import { useState, useEffect, useRef, DragEvent } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  HerTurnEdition,
  HerTurnTicketTier,
  HerTurnItineraryItem,
  HerTurnSpeaker,
  HerTurnPartner,
} from '@/types/herTurn';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Copy,
  Archive,
  Image as ImageIcon,
  Users,
  Globe,
  AlertTriangle,
  Upload,
} from 'lucide-react';

function slugify(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const EMPTY_EDITION = {
  title: '',
  slug: '',
  subtitle: '',
  status: 'draft' as 'draft' | 'published' | 'archived',
  edition_type: 'retreat' as HerTurnEdition['edition_type'],
  start_date: '',
  end_date: '',
  start_time: '',
  venue_name: '',
  venue_address: '',
  venue_map_url: '',
  hero_image_url: '',
  gallery_urls: [] as string[],
  themes: [] as string[],
  dress_code: '',
  description: '',
  itinerary: [] as HerTurnItineraryItem[],
  keynote_speakers: [] as HerTurnSpeaker[],
  partners: [] as HerTurnPartner[],
  registration_open: true,
  meta_title: '',
  meta_description: '',
};

interface DraftTier extends Partial<HerTurnTicketTier> {
  _localId: string;
  name: string;
  price: number;
  currency: string;
  stock_total: number;
}

export default function EditionsManager() {
  const [editions, setEditions] = useState<HerTurnEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(EMPTY_EDITION);
  const [tiers, setTiers] = useState<DraftTier[]>([]);
  const [themeInput, setThemeInput] = useState('');

  useEffect(() => {
    fetchEditions();
  }, []);

  async function fetchEditions() {
    try {
      const { data, error } = await supabase
        .from('her_turn_editions')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      setEditions(data || []);
    } catch (err) {
      console.error('Error fetching editions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTiersFor(editionId: string): Promise<DraftTier[]> {
    const { data, error } = await supabase
      .from('her_turn_ticket_tiers')
      .select('*')
      .eq('edition_id', editionId)
      .order('display_order');
    if (error) {
      console.error('Error fetching tiers:', error);
      return [];
    }
    return (data || []).map((t) => ({ ...t, _localId: t.id }));
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_EDITION);
    setTiers([
      {
        _localId: crypto.randomUUID(),
        name: 'Standard',
        price: 0,
        currency: 'USD',
        stock_total: 20,
        perks: [],
      },
    ]);
    setSaveError('');
    setIsModalOpen(true);
  }

  async function openEdit(edition: HerTurnEdition) {
    setEditingId(edition.id);
    setForm({
      title: edition.title,
      slug: edition.slug,
      subtitle: edition.subtitle || '',
      status: edition.status,
      edition_type: edition.edition_type,
      start_date: edition.start_date,
      end_date: edition.end_date,
      start_time: edition.start_time || '',
      venue_name: edition.venue_name || '',
      venue_address: edition.venue_address || '',
      venue_map_url: edition.venue_map_url || '',
      hero_image_url: edition.hero_image_url || '',
      gallery_urls: edition.gallery_urls || [],
      themes: edition.themes || [],
      dress_code: edition.dress_code || '',
      description: edition.description || '',
      itinerary: edition.itinerary || [],
      keynote_speakers: edition.keynote_speakers || [],
      partners: edition.partners || [],
      registration_open: edition.registration_open,
      meta_title: edition.meta_title || '',
      meta_description: edition.meta_description || '',
    });
    setSaveError('');
    setIsModalOpen(true);
    setTiers(await fetchTiersFor(edition.id));
  }

  async function handleClone(edition: HerTurnEdition) {
    try {
      const clonedSlug = `${edition.slug}-copy-${Date.now().toString().slice(-5)}`;
      const { data: newEdition, error } = await supabase
        .from('her_turn_editions')
        .insert([
          {
            title: `${edition.title} (Copy)`,
            slug: clonedSlug,
            subtitle: edition.subtitle,
            status: 'draft',
            edition_type: edition.edition_type,
            start_date: edition.start_date,
            end_date: edition.end_date,
            start_time: edition.start_time,
            venue_name: edition.venue_name,
            venue_address: edition.venue_address,
            venue_map_url: edition.venue_map_url,
            hero_image_url: edition.hero_image_url,
            gallery_urls: edition.gallery_urls,
            themes: edition.themes,
            dress_code: edition.dress_code,
            description: edition.description,
            itinerary: edition.itinerary,
            keynote_speakers: edition.keynote_speakers,
            partners: edition.partners,
            registration_open: edition.registration_open,
            meta_title: edition.meta_title,
            meta_description: edition.meta_description,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const existingTiers = await fetchTiersFor(edition.id);
      if (existingTiers.length > 0) {
        await supabase.from('her_turn_ticket_tiers').insert(
          existingTiers.map((t) => ({
            edition_id: newEdition.id,
            name: t.name,
            description: t.description,
            price: t.price,
            currency: t.currency,
            early_bird_price: t.early_bird_price,
            early_bird_deadline: t.early_bird_deadline,
            stock_total: t.stock_total,
            stock_sold: 0,
            perks: t.perks,
            display_order: t.display_order,
            is_active: t.is_active,
          }))
        );
      }
      fetchEditions();
    } catch (err) {
      console.error('Error cloning edition:', err);
      alert('Failed to clone edition.');
    }
  }

  async function handleArchive(edition: HerTurnEdition) {
    try {
      const { error } = await supabase
        .from('her_turn_editions')
        .update({ status: 'archived' })
        .eq('id', edition.id);
      if (error) throw error;
      fetchEditions();
    } catch (err) {
      console.error('Error archiving edition:', err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this edition permanently? This also removes its ticket tiers.')) return;
    try {
      const { error } = await supabase.from('her_turn_editions').delete().eq('id', id);
      if (error) throw error;
      setEditions((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Error deleting edition:', err);
      alert('Failed to delete edition.');
    }
  }

  function handleTitleChange(val: string) {
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: editingId ? prev.slug : slugify(val),
      meta_title: prev.meta_title || val,
    }));
  }

  // Hero Image Upload Logic
  async function handleHeroUpload(file: File) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `edition-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `her-turn/editions/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('public-bucket').upload(filePath, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('public-bucket').getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, hero_image_url: publicUrl }));
    } catch (err: any) {
      alert(`Upload failed: ${err?.message || 'Check storage bucket permissions'}`);
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  }

  // Drag & Drop Handlers for Hero Image
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleHeroUpload(e.dataTransfer.files[0]);
    }
  }

  // Tier Helpers
  function addTier() {
    setTiers((prev) => [
      ...prev,
      {
        _localId: crypto.randomUUID(),
        name: '',
        price: 0,
        currency: 'USD',
        stock_total: 10,
        perks: [],
      },
    ]);
  }
  function updateTier(localId: string, patch: Partial<DraftTier>) {
    setTiers((prev) => prev.map((t) => (t._localId === localId ? { ...t, ...patch } : t)));
  }
  function removeTier(localId: string) {
    setTiers((prev) => prev.filter((t) => t._localId !== localId));
  }

  // Itinerary Helpers
  function addItineraryRow() {
    setForm((prev) => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        { day: `Day ${prev.itinerary.length + 1}`, time: '', activity: '' },
      ],
    }));
  }
  function updateItineraryRow(idx: number, patch: Partial<HerTurnItineraryItem>) {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    }));
  }
  function removeItineraryRow(idx: number) {
    setForm((prev) => ({ ...prev, itinerary: prev.itinerary.filter((_, i) => i !== idx) }));
  }

  // Speaker Helpers
  function addSpeakerRow() {
    setForm((prev) => ({
      ...prev,
      keynote_speakers: [
        ...prev.keynote_speakers,
        { name: '', title: '', bio: '', image_url: '' },
      ],
    }));
  }
  function updateSpeakerRow(idx: number, patch: Partial<HerTurnSpeaker>) {
    setForm((prev) => ({
      ...prev,
      keynote_speakers: prev.keynote_speakers.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  }
  function removeSpeakerRow(idx: number) {
    setForm((prev) => ({
      ...prev,
      keynote_speakers: prev.keynote_speakers.filter((_, i) => i !== idx),
    }));
  }

  // Partner Helpers
  function addPartnerRow() {
    setForm((prev) => ({
      ...prev,
      partners: [...prev.partners, { name: '', logo_url: '', url: '' }],
    }));
  }
  function updatePartnerRow(idx: number, patch: Partial<HerTurnPartner>) {
    setForm((prev) => ({
      ...prev,
      partners: prev.partners.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));
  }
  function removePartnerRow(idx: number) {
    setForm((prev) => ({ ...prev, partners: prev.partners.filter((_, i) => i !== idx) }));
  }

  // Theme Helpers
  function addTheme() {
    const t = themeInput.trim();
    if (!t) return;
    setForm((prev) => ({ ...prev, themes: [...prev.themes, t] }));
    setThemeInput('');
  }
  function removeTheme(idx: number) {
    setForm((prev) => ({ ...prev, themes: prev.themes.filter((_, i) => i !== idx) }));
  }

  // Save Form
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (!form.title || !form.slug || !form.start_date || !form.end_date) {
        setSaveError('Title, slug, start date, and end date are required.');
        setSaving(false);
        return;
      }
      if (tiers.length === 0) {
        setSaveError('Add at least one ticket tier.');
        setSaving(false);
        return;
      }

      const payload = {
        ...form,
        slug: slugify(form.slug),
        meta_title: form.meta_title || form.title,
        meta_description: form.meta_description || form.subtitle,
      };

      let editionId = editingId;
      if (editingId) {
        const { error } = await supabase.from('her_turn_editions').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('her_turn_editions').insert([payload]).select().single();
        if (error) throw error;
        editionId = data.id;
      }

      const existingTiers = editingId ? await fetchTiersFor(editingId) : [];
      const existingIds = new Set(existingTiers.map((t) => t.id));
      const keptIds = new Set(tiers.filter((t) => t.id).map((t) => t.id));
      const toDelete = [...existingIds].filter((id) => !keptIds.has(id));

      if (toDelete.length > 0) {
        await supabase.from('her_turn_ticket_tiers').delete().in('id', toDelete as string[]);
      }

      for (let i = 0; i < tiers.length; i++) {
        const t = tiers[i];
        const tierPayload = {
          edition_id: editionId,
          name: t.name,
          description: t.description || null,
          price: t.price,
          currency: t.currency,
          early_bird_price: t.early_bird_price || null,
          early_bird_deadline: t.early_bird_deadline || null,
          stock_total: t.stock_total,
          perks: t.perks || [],
          display_order: i,
          is_active: t.is_active ?? true,
        };
        if (t.id) {
          const { error } = await supabase.from('her_turn_ticket_tiers').update(tierPayload).eq('id', t.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('her_turn_ticket_tiers').insert([{ ...tierPayload, stock_sold: 0 }]);
          if (error) throw error;
        }
      }

      setIsModalOpen(false);
      fetchEditions();
    } catch (err: any) {
      console.error('Error saving edition:', err);
      setSaveError(err?.message || 'Error saving edition. The slug may already be in use.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = editions.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-sm flex items-center gap-3 flex-1">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search editions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm focus:outline-none bg-transparent"
          />
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={16} /> New Edition
        </button>
      </div>

      {/* Editions Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading editions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-sand-200 text-slate-500">
          No editions found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((edition) => (
            <div key={edition.id} className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm">
              <div className="relative h-36">
                <img src={edition.hero_image_url} alt="" className="w-full h-full object-cover bg-sand-100" />
                <span
                  className={`absolute top-3 left-3 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    edition.status === 'published'
                      ? 'bg-emerald-600 text-white'
                      : edition.status === 'archived'
                      ? 'bg-slate-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {edition.status}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-serif font-bold text-cocoa-700 text-sm line-clamp-1">{edition.title}</h3>
                <p className="text-xs text-slate-500">
                  {edition.start_date} → {edition.end_date}
                </p>
                <div className="flex items-center gap-1.5 pt-2">
                  <button
                    onClick={() => openEdit(edition)}
                    className="flex-1 p-2 bg-sand-100 hover:bg-sand-200 text-cocoa-700 rounded-lg cursor-pointer"
                    title="Edit"
                  >
                    <Pencil size={14} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleClone(edition)}
                    className="flex-1 p-2 bg-sand-100 hover:bg-sand-200 text-cocoa-700 rounded-lg cursor-pointer"
                    title="Clone"
                  >
                    <Copy size={14} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleArchive(edition)}
                    className="flex-1 p-2 bg-sand-100 hover:bg-sand-200 text-cocoa-700 rounded-lg cursor-pointer"
                    title="Archive"
                  >
                    <Archive size={14} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(edition.id)}
                    className="flex-1 p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={14} className="mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Edition Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 sm:p-8 relative shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold font-serif text-cocoa-700">
              {editingId ? 'Edit Edition' : 'New Her Turn Edition'}
            </h2>

            <form onSubmit={handleSave} className="space-y-8">
              {/* Basics Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-cocoa-700 uppercase">Basics</h3>
                <input
                  required
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Edition title"
                  className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-coral-600"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs font-mono">
                    <span className="text-slate-400 mr-1">/her-turn/</span>
                    <input
                      required
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                      className="w-full bg-transparent focus:outline-none text-teal-700 font-bold"
                    />
                  </div>
                  <select
                    value={form.edition_type}
                    onChange={(e) => setForm({ ...form, edition_type: e.target.value as any })}
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                  >
                    <option value="retreat">Retreat</option>
                    <option value="dhow_cruise">Dhow Cruise</option>
                    <option value="networking">Networking</option>
                    <option value="workshop">Workshop</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Short subtitle"
                  className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                />
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Full description"
                  className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Start Date</label>
                    <input
                      required
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">End Date</label>
                    <input
                      required
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Start Time</label>
                    <input
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      placeholder="4:00 PM"
                      className="w-full bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      className="w-full bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-sm focus:outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={form.venue_name}
                    onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                    placeholder="Venue name"
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-sm focus:outline-none"
                  />
                  <input
                    value={form.dress_code}
                    onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
                    placeholder="Dress code"
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-sm focus:outline-none"
                  />
                  <input
                    value={form.venue_address}
                    onChange={(e) => setForm({ ...form, venue_address: e.target.value })}
                    placeholder="Venue address"
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-sm focus:outline-none"
                  />
                  <input
                    value={form.venue_map_url}
                    onChange={(e) => setForm({ ...form, venue_map_url: e.target.value })}
                    placeholder="Google Maps URL"
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-sm focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="registration_open"
                    checked={form.registration_open}
                    onChange={(e) => setForm({ ...form, registration_open: e.target.checked })}
                    className="w-4 h-4 text-coral-600 rounded border-sand-300"
                  />
                  <label htmlFor="registration_open" className="text-sm font-medium text-cocoa-700">
                    Registration open
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {form.themes.map((theme, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {theme}
                      <button type="button" onClick={() => removeTheme(idx)} className="cursor-pointer">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      value={themeInput}
                      onChange={(e) => setThemeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTheme();
                        }
                      }}
                      placeholder="Add theme + Enter"
                      className="bg-sand-50 border border-sand-200 rounded-full px-3 py-1 text-xs focus:outline-none w-36"
                    />
                  </div>
                </div>

                {/* Hero Image Drag & Drop and URL Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-cocoa-700 uppercase">Hero Image Upload / URL</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => heroFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                      isDragging ? 'border-coral-500 bg-coral-50/50' : 'border-sand-300 bg-sand-50 hover:bg-sand-100/50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={heroFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => e.target.files && e.target.files[0] && handleHeroUpload(e.target.files[0])}
                    />
                    {uploading ? (
                      <p className="text-coral-600 text-sm font-semibold animate-pulse">Uploading Image...</p>
                    ) : form.hero_image_url ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={form.hero_image_url} alt="Hero Preview" className="h-32 rounded-lg object-cover shadow-sm" />
                        <p className="text-xs text-slate-500">Drag & drop or click to replace hero image</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload size={28} className="mx-auto text-slate-400" />
                        <p className="text-sm text-slate-600 font-medium">
                          Drag and drop hero image here, or <span className="text-coral-600 underline">browse</span>
                        </p>
                        <p className="text-[10px] text-slate-400">Supports PNG, JPG, WEBP</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <ImageIcon size={14} className="text-slate-400 shrink-0" />
                    <input
                      type="url"
                      value={form.hero_image_url}
                      onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                      placeholder="Or paste direct Image URL (https://...)"
                      className="w-full bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-coral-600"
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Tiers */}
              <div className="space-y-3 border-t border-sand-200 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cocoa-700 uppercase flex items-center gap-1.5">
                    <Users size={14} className="text-coral-600" /> Ticket Tiers
                  </h3>
                  <button type="button" onClick={addTier} className="text-xs font-semibold text-teal-700 cursor-pointer">
                    + Add Tier
                  </button>
                </div>
                {tiers.map((tier) => (
                  <div key={tier._localId} className="bg-sand-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-6 gap-2 items-start">
                    <input
                      value={tier.name}
                      onChange={(e) => updateTier(tier._localId, { name: e.target.value })}
                      placeholder="Tier name"
                      className="col-span-2 bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={tier.price}
                      onChange={(e) => updateTier(tier._localId, { price: parseFloat(e.target.value) || 0 })}
                      placeholder="Price"
                      className="bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                    <select
                      value={tier.currency}
                      onChange={(e) => updateTier(tier._localId, { currency: e.target.value })}
                      className="bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option>USD</option>
                      <option>KES</option>
                      <option>EUR</option>
                      <option>GBP</option>
                    </select>
                    <input
                      type="number"
                      value={tier.stock_total}
                      onChange={(e) => updateTier(tier._localId, { stock_total: parseInt(e.target.value) || 0 })}
                      placeholder="Stock"
                      className="bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(tier._localId)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer justify-self-end"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Itinerary */}
              <div className="space-y-3 border-t border-sand-200 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cocoa-700 uppercase">Itinerary</h3>
                  <button type="button" onClick={addItineraryRow} className="text-xs font-semibold text-teal-700 cursor-pointer">
                    + Add Row
                  </button>
                </div>
                {form.itinerary.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                    <input
                      value={item.day}
                      onChange={(e) => updateItineraryRow(idx, { day: e.target.value })}
                      placeholder="Day 1"
                      className="bg-sand-50 border border-sand-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                    <input
                      value={item.time}
                      onChange={(e) => updateItineraryRow(idx, { time: e.target.value })}
                      placeholder="Time"
                      className="bg-sand-50 border border-sand-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                    <input
                      value={item.activity}
                      onChange={(e) => updateItineraryRow(idx, { activity: e.target.value })}
                      placeholder="Activity"
                      className="sm:col-span-3 bg-sand-50 border border-sand-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeItineraryRow(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer justify-self-end"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Keynote Speakers Section */}
              <div className="space-y-3 border-t border-sand-200 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cocoa-700 uppercase">Keynote Speakers</h3>
                  <button
                    type="button"
                    onClick={addSpeakerRow}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    + Add Speaker
                  </button>
                </div>

                {form.keynote_speakers.map((s, idx) => (
                  <div key={idx} className="bg-sand-50/50 border border-sand-200 rounded-xl p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        value={s.name}
                        onChange={(e) => updateSpeakerRow(idx, { name: e.target.value })}
                        placeholder="Speaker Name"
                        className="bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none focus:border-coral-600"
                      />
                      <input
                        value={s.title}
                        onChange={(e) => updateSpeakerRow(idx, { title: e.target.value })}
                        placeholder="Title / Role"
                        className="bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none focus:border-coral-600"
                      />
                      <input
                        value={s.bio}
                        onChange={(e) => updateSpeakerRow(idx, { bio: e.target.value })}
                        placeholder="Short bio"
                        className="sm:col-span-2 bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none focus:border-coral-600"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Avatar Preview */}
                      <div className="w-10 h-10 rounded-full bg-sand-200 border border-sand-300 overflow-hidden shrink-0 flex items-center justify-center">
                        {s.image_url ? (
                          <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={16} className="text-slate-400" />
                        )}
                      </div>

                      {/* File Upload Button */}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-sand-200 hover:bg-sand-100 text-slate-700 rounded-lg text-xs font-medium shadow-sm transition-colors shrink-0">
                        <Upload size={13} className="text-coral-600" />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const fileExt = file.name.split('.').pop();
                              const fileName = `speaker-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                              const filePath = `her-turn/speakers/${fileName}`;

                              const { error: uploadError } = await supabase.storage
                                .from('public-bucket')
                                .upload(filePath, file);
                              if (uploadError) throw uploadError;

                              const {
                                data: { publicUrl },
                              } = supabase.storage.from('public-bucket').getPublicUrl(filePath);
                              updateSpeakerRow(idx, { image_url: publicUrl });
                            } catch (err: any) {
                              alert(`Upload failed: ${err?.message || 'Error uploading speaker photo'}`);
                            }
                          }}
                        />
                      </label>

                      {/* Direct Image URL Field */}
                      <input
                        type="url"
                        value={s.image_url || ''}
                        onChange={(e) => updateSpeakerRow(idx, { image_url: e.target.value })}
                        placeholder="Or paste Image URL (https://...)"
                        className="flex-1 bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none focus:border-coral-600"
                      />

                      {/* Remove Row Button */}
                      <button
                        type="button"
                        onClick={() => removeSpeakerRow(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0 transition-colors"
                        title="Remove Speaker"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Partners Section with Direct File Upload & Logo Preview */}
              <div className="space-y-3 border-t border-sand-200 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cocoa-700 uppercase">Partners</h3>
                  <button
                    type="button"
                    onClick={addPartnerRow}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    + Add Partner
                  </button>
                </div>

                {form.partners.map((p, idx) => (
                  <div key={idx} className="bg-sand-50/50 border border-sand-200 rounded-xl p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        value={p.name}
                        onChange={(e) => updatePartnerRow(idx, { name: e.target.value })}
                        placeholder="Partner Name / Organization"
                        className="bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none focus:border-coral-600"
                      />
                      <input
                        type="url"
                        value={p.url || ''}
                        onChange={(e) => updatePartnerRow(idx, { url: e.target.value })}
                        placeholder="Website URL (https://...)"
                        className="bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none focus:border-coral-600"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Logo Preview */}
                      <div className="w-10 h-10 rounded-lg bg-white border border-sand-300 p-1 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.logo_url ? (
                          <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon size={16} className="text-slate-400" />
                        )}
                      </div>

                      {/* Upload Logo Button */}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-sand-200 hover:bg-sand-100 text-slate-700 rounded-lg text-xs font-medium shadow-sm transition-colors shrink-0">
                        <Upload size={13} className="text-coral-600" />
                        Upload Logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const fileExt = file.name.split('.').pop();
                              const fileName = `partner-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                              const filePath = `her-turn/partners/${fileName}`;

                              const { error: uploadError } = await supabase.storage
                                .from('public-bucket')
                                .upload(filePath, file);
                              if (uploadError) throw uploadError;

                              const {
                                data: { publicUrl },
                              } = supabase.storage.from('public-bucket').getPublicUrl(filePath);
                              updatePartnerRow(idx, { logo_url: publicUrl });
                            } catch (err: any) {
                              alert(`Upload failed: ${err?.message || 'Error uploading partner logo'}`);
                            }
                          }}
                        />
                      </label>

                      {/* Direct Logo URL Field */}
                      <input
                        type="url"
                        value={p.logo_url || ''}
                        onChange={(e) => updatePartnerRow(idx, { logo_url: e.target.value })}
                        placeholder="Or paste Logo URL (https://...)"
                        className="flex-1 bg-white border border-sand-200 rounded-lg p-2 text-xs focus:outline-none focus:border-coral-600"
                      />

                      {/* Delete Row Button */}
                      <button
                        type="button"
                        onClick={() => removePartnerRow(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0 transition-colors"
                        title="Remove Partner"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* SEO Section */}
              <div className="space-y-3 border-t border-sand-200 pt-6">
                <h3 className="text-xs font-bold text-cocoa-700 uppercase flex items-center gap-1.5">
                  <Globe size={14} className="text-teal-700" /> SEO
                </h3>
                <input
                  value={form.meta_title}
                  onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                  placeholder="Meta title"
                  className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={form.meta_description}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  placeholder="Meta description"
                  className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                />
              </div>

              {saveError && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
                  <AlertTriangle size={14} className="shrink-0" /> {saveError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-6 py-2.5 bg-coral-600 hover:bg-coral-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Edition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}