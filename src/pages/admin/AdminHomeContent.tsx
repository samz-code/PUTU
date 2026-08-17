import React, { useEffect, useState, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon, 
  Save, X, RefreshCw, Layers, Sparkles, ConciergeBell, Check, 
  Upload, Loader2, Link as LinkIcon, FileText, ShieldCheck, 
  Compass, Sliders, Headphones, BedDouble, Award, Star, CheckCircle, 
  MapPin, Car, Heart, PhoneCall, Coffee, CalendarCheck, LucideIcon 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  badge_text: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  display_order: number;
  is_active: boolean;
}

interface Pillar {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
}

interface Experience {
  id: string;
  title: string;
  location: string;
  price: number;
  is_featured: boolean;
  image_url: string;
}

// Categorized Icon Options for Value Pillars
export const CATEGORIZED_ICONS: { category: string; icons: { name: string; label: string; icon: LucideIcon }[] }[] = [
  {
    category: 'Planning & Proposals',
    icons: [
      { name: 'FileText', label: 'Proposal / Brief', icon: FileText },
      { name: 'Sliders', label: 'Tailored / Custom', icon: Sliders },
      { name: 'CalendarCheck', label: 'Itinerary / Dates', icon: CalendarCheck },
      { name: 'Sparkles', label: 'Curated / Magic', icon: Sparkles },
    ],
  },
  {
    category: 'Trust & Quality',
    icons: [
      { name: 'ShieldCheck', label: 'Trusted / Verified', icon: ShieldCheck },
      { name: 'Award', label: 'Excellence', icon: Award },
      { name: 'Star', label: 'Top Rated', icon: Star },
      { name: 'CheckCircle', label: 'Guaranteed', icon: CheckCircle },
    ],
  },
  {
    category: 'Travel & Navigation',
    icons: [
      { name: 'Compass', label: 'End-to-End / Journey', icon: Compass },
      { name: 'MapPin', label: 'Destination / Spot', icon: MapPin },
      { name: 'Car', label: 'Transport / Chauffeur', icon: Car },
    ],
  },
  {
    category: 'Hospitality & Stays',
    icons: [
      { name: 'BedDouble', label: 'Luxury Stay', icon: BedDouble },
      { name: 'ConciergeBell', label: 'Concierge', icon: ConciergeBell },
      { name: 'Headphones', label: '24/7 Support', icon: Headphones },
      { name: 'PhoneCall', label: 'Direct Line', icon: PhoneCall },
      { name: 'Coffee', label: 'Hospitality', icon: Coffee },
      { name: 'Heart', label: 'Care & Service', icon: Heart },
    ],
  },
];

const ICON_MAP: Record<string, LucideIcon> = {
  FileText, ShieldCheck, Compass, Sliders, Headphones, BedDouble,
  ConciergeBell, Sparkles, Award, Star, CheckCircle, MapPin,
  Car, Heart, PhoneCall, Coffee, CalendarCheck
};

export default function AdminHomeContent() {
  const [activeTab, setActiveTab] = useState<'hero' | 'pillars' | 'experiences'>('hero');
  const [loading, setLoading] = useState(true);

  // Data States
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Modals
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);

  const [isPillarModalOpen, setIsPillarModalOpen] = useState(false);
  const [editingPillar, setEditingPillar] = useState<Pillar | null>(null);

  // Form State - Hero Banner
  const [heroForm, setHeroForm] = useState({
    title: '',
    subtitle: '',
    badge_text: '',
    image_url: '',
    cta_text: 'Explore Experiences',
    cta_link: '/experiences',
    display_order: 1,
    is_active: true,
  });

  // Drag and Drop & Upload States
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [useManualUrl, setUseManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State - Pillar
  const [pillarForm, setPillarForm] = useState({
    title: '',
    description: '',
    icon_name: 'ConciergeBell',
    display_order: 1,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchBanners(), fetchPillars(), fetchExperiences()]);
    setLoading(false);
  };

  const fetchBanners = async () => {
    const { data } = await supabase
      .from('hero_banners')
      .select('*')
      .order('display_order', { ascending: true });
    if (data) setBanners(data);
  };

  const fetchPillars = async () => {
    const { data } = await supabase
      .from('pillars')
      .select('*')
      .order('display_order', { ascending: true });
    if (data) setPillars(data);
  };

  const fetchExperiences = async () => {
    const { data } = await supabase
      .from('experiences')
      .select('*')
      .order('title', { ascending: true });
    if (data) setExperiences(data);
  };

  // --- FILE UPLOAD & DRAG/DROP HANDLERS ---
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `slides/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('hero-banners')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('hero-banners')
        .getPublicUrl(filePath);

      setHeroForm((prev) => ({ ...prev, image_url: publicUrlData.publicUrl }));
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setUploadError(err.message || 'Failed to upload image to Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // --- HERO BANNER HANDLERS ---
  const openHeroModal = (banner?: HeroBanner) => {
    setUploadError(null);
    setUseManualUrl(false);

    if (banner) {
      setEditingBanner(banner);
      setHeroForm({
        title: banner.title,
        subtitle: banner.subtitle || '',
        badge_text: banner.badge_text || '',
        image_url: banner.image_url,
        cta_text: banner.cta_text || 'Explore Experiences',
        cta_link: banner.cta_link || '/experiences',
        display_order: banner.display_order,
        is_active: banner.is_active,
      });
    } else {
      setEditingBanner(null);
      setHeroForm({
        title: '',
        subtitle: '',
        badge_text: 'PUTU TRAVELS CONCIERGE',
        image_url: '',
        cta_text: 'Explore Experiences',
        cta_link: '/experiences',
        display_order: banners.length + 1,
        is_active: true,
      });
    }
    setIsHeroModalOpen(true);
  };

  const saveHeroBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroForm.image_url) {
      setUploadError('Please upload an image or provide an image URL.');
      return;
    }

    if (editingBanner) {
      await supabase.from('hero_banners').update(heroForm).eq('id', editingBanner.id);
    } else {
      await supabase.from('hero_banners').insert([heroForm]);
    }
    setIsHeroModalOpen(false);
    fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero banner?')) return;
    await supabase.from('hero_banners').delete().eq('id', id);
    fetchBanners();
  };

  const toggleBannerActive = async (banner: HeroBanner) => {
    await supabase
      .from('hero_banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);
    fetchBanners();
  };

  // --- PILLAR HANDLERS ---
  const openPillarModal = (pillar?: Pillar) => {
    if (pillar) {
      setEditingPillar(pillar);
      setPillarForm({
        title: pillar.title,
        description: pillar.description,
        icon_name: pillar.icon_name || 'ConciergeBell',
        display_order: pillar.display_order || 1,
      });
    } else {
      setEditingPillar(null);
      setPillarForm({
        title: '',
        description: '',
        icon_name: 'ConciergeBell',
        display_order: pillars.length + 1,
      });
    }
    setIsPillarModalOpen(true);
  };

  const savePillar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPillar) {
      await supabase.from('pillars').update(pillarForm).eq('id', editingPillar.id);
    } else {
      await supabase.from('pillars').insert([pillarForm]);
    }
    setIsPillarModalOpen(false);
    fetchPillars();
  };

  const deletePillar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature pillar?')) return;
    await supabase.from('pillars').delete().eq('id', id);
    fetchPillars();
  };

  // --- FEATURED EXPERIENCE TOGGLE ---
  const toggleFeaturedExp = async (exp: Experience) => {
    await supabase
      .from('experiences')
      .update({ is_featured: !exp.is_featured })
      .eq('id', exp.id);
    fetchExperiences();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <PageHeader
          title="Homepage Management Portal"
          subtitle="Manage your Hero Banners, Value Pillars, and Featured Experiences."
        />
        <button
          onClick={fetchAllData}
          className="p-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors self-start sm:self-auto"
          title="Refresh Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hero')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'hero'
              ? 'border-coral-500 text-coral-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={16} /> Hero Slides ({banners.length})
        </button>

        <button
          onClick={() => setActiveTab('pillars')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'pillars'
              ? 'border-coral-500 text-coral-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles size={16} /> Pillars / Value Propositions ({pillars.length})
        </button>

        <button
          onClick={() => setActiveTab('experiences')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'experiences'
              ? 'border-coral-500 text-coral-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ConciergeBell size={16} /> Featured Experiences ({experiences.filter((e) => e.is_featured).length})
        </button>
      </div>

      {/* ================= TAB 1: HERO BANNERS ================= */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Manage hero carousel slides, headlines, and background imagery.
            </p>
            <button
              onClick={() => openHeroModal()}
              className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <Plus size={16} /> Add Hero Slide
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading hero slides...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-28 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 relative border border-slate-200">
                      <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                        #{banner.display_order}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {banner.badge_text && (
                        <span className="px-2 py-0.5 bg-coral-50 text-coral-600 text-[10px] font-bold uppercase rounded border border-coral-100">
                          {banner.badge_text}
                        </span>
                      )}
                      <h3 className="font-serif font-bold text-slate-800 text-base">{banner.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{banner.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => toggleBannerActive(banner)}
                      className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1 ${
                        banner.is_active
                          ? 'bg-teal-50 border-teal-200 text-teal-700'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                    >
                      {banner.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      {banner.is_active ? 'Published' : 'Hidden'}
                    </button>

                    <button
                      onClick={() => openHeroModal(banner)}
                      className="p-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                    >
                      <Edit size={14} />
                    </button>

                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="p-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PILLARS ================= */}
      {activeTab === 'pillars' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Manage value pillar cards with contextually matched Lucide icons.
            </p>
            <button
              onClick={() => openPillarModal()}
              className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <Plus size={16} /> Add Pillar Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar) => {
              const ContextIcon = ICON_MAP[pillar.icon_name] || ConciergeBell;

              return (
                <div
                  key={pillar.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-coral-50 border border-coral-100 text-coral-500 flex items-center justify-center mb-4">
                      <ContextIcon size={22} />
                    </div>
                    <h3 className="font-serif font-bold text-slate-800 text-lg">{pillar.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{pillar.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                    <span className="text-[10px] font-mono text-slate-400">
                      Icon: <strong className="text-slate-600">{pillar.icon_name}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPillarModal(pillar)}
                        className="p-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => deletePillar(pillar.id)}
                        className="p-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: FEATURED EXPERIENCES ================= */}
      {activeTab === 'experiences' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            Toggle which coastal experiences appear in the Featured section on the landing page.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  exp.is_featured
                    ? 'bg-coral-50/30 border-coral-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={exp.image_url}
                    alt={exp.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                  <div>
                    <h4 className="font-serif font-bold text-slate-800 text-sm">{exp.title}</h4>
                    <p className="text-xs text-slate-500">{exp.location} • ${exp.price}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleFeaturedExp(exp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    exp.is_featured
                      ? 'bg-coral-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {exp.is_featured ? 'Featured' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= HERO BANNER MODAL (WITH DRAG & DROP) ================= */}
      {isHeroModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-slate-800 text-lg">
                {editingBanner ? 'Edit Hero Slide' : 'Create Hero Slide'}
              </h3>
              <button onClick={() => setIsHeroModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveHeroBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. One Trusted Contact. Every Detail Handled."
                  value={heroForm.title}
                  onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-coral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle</label>
                <textarea
                  rows={2}
                  placeholder="Curated luxury travel on the Kenyan coast..."
                  value={heroForm.subtitle}
                  onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-coral-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. PUTU TRAVELS CONCIERGE"
                    value={heroForm.badge_text}
                    onChange={(e) => setHeroForm({ ...heroForm, badge_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-coral-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={heroForm.display_order}
                    onChange={(e) => setHeroForm({ ...heroForm, display_order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-coral-500"
                  />
                </div>
              </div>

              {/* IMAGE DRAG & DROP / FILE UPLOAD SECTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Slide Image *</label>
                  <button
                    type="button"
                    onClick={() => setUseManualUrl(!useManualUrl)}
                    className="text-[11px] font-bold text-coral-600 hover:underline flex items-center gap-1"
                  >
                    <LinkIcon size={12} />
                    {useManualUrl ? 'Use Drag & Drop Upload' : 'Enter Image URL Instead'}
                  </button>
                </div>

                {useManualUrl ? (
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={heroForm.image_url}
                    onChange={(e) => setHeroForm({ ...heroForm, image_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-coral-500"
                  />
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-coral-500 bg-coral-50/50 scale-[1.01]'
                          : heroForm.image_url
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : 'border-slate-300 hover:border-coral-400 bg-slate-50'
                      }`}
                    >
                      {uploading ? (
                        <div className="py-6 flex flex-col items-center gap-2">
                          <Loader2 size={28} className="text-coral-500 animate-spin" />
                          <p className="text-xs font-bold text-slate-600">Uploading image to storage...</p>
                        </div>
                      ) : heroForm.image_url ? (
                        <div className="flex items-center gap-4">
                          <img
                            src={heroForm.image_url}
                            alt="Uploaded slide"
                            className="w-20 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                          />
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <Check size={14} /> Image Uploaded
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{heroForm.image_url}</p>
                            <span className="text-[10px] text-coral-600 font-bold underline mt-1 block">
                              Click or drop to replace
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center">
                            <Upload size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              Drag and drop your image here, or <span className="text-coral-600">browse</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP up to 5MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    {uploadError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHeroModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-coral-500 text-white rounded-xl text-xs font-semibold shadow-md hover:bg-coral-600 disabled:opacity-50"
                >
                  Save Hero Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PILLAR MODAL ================= */}
      {isPillarModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-slate-800 text-lg">
                {editingPillar ? 'Edit Pillar Card' : 'Create Pillar Card'}
              </h3>
              <button onClick={() => setIsPillarModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={savePillar} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pillar Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Curated Proposals"
                  value={pillarForm.title}
                  onChange={(e) => setPillarForm({ ...pillarForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-coral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. We prepare a personalized proposal from your journey brief..."
                  value={pillarForm.description}
                  onChange={(e) => setPillarForm({ ...pillarForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-coral-500"
                />
              </div>

              {/* Categorized Contextual Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Contextual Icon: <span className="text-coral-600 font-mono">{pillarForm.icon_name}</span>
                </label>

                <div className="max-h-48 overflow-y-auto p-2.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  {CATEGORIZED_ICONS.map((cat) => (
                    <div key={cat.category}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{cat.category}</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {cat.icons.map((item) => {
                          const IconComp = item.icon;
                          const isSelected = pillarForm.icon_name === item.name;

                          return (
                            <button
                              type="button"
                              key={item.name}
                              onClick={() => setPillarForm({ ...pillarForm, icon_name: item.name })}
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                                isSelected
                                  ? 'bg-coral-500 text-white border-coral-500 shadow-md scale-105'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <IconComp size={16} />
                              <span className="text-[8px] truncate w-full text-center">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={pillarForm.display_order}
                  onChange={(e) => setPillarForm({ ...pillarForm, display_order: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-coral-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPillarModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-coral-500 text-white rounded-xl text-xs font-semibold shadow-md hover:bg-coral-600"
                >
                  Save Pillar Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}