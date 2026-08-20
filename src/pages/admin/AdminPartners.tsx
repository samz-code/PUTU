import React, { useState, useEffect } from 'react';
import { 
  Plus, Pencil, Trash2, Search, Building2, X, Eye, EyeOff, 
  Loader2, Save, Percent, Compass, Bed, ShieldCheck, 
  Layers, Award, CheckCircle2, AlertCircle, HelpCircle,
  Briefcase, Star, Sparkles, HeartHandshake, Zap, Globe, Lock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface PartnerHeroSettings {
  id?: string;
  badge_text: string;
  hero_title: string;
  hero_subtitle: string;
  primary_btn_text: string;
  secondary_btn_text: string;
  stat1_value: string;
  stat1_label: string;
  stat2_value: string;
  stat2_label: string;
  stat3_value: string;
  stat3_label: string;
  stat4_value: string;
  stat4_label: string;
  benefits_title: string;
  benefits_subtitle: string;
}

export interface PartnerBenefit {
  id?: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

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

interface CategoryOption {
  key: string;
  label: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'hotel', label: 'Hotel' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'driver', label: 'Driver' },
  { key: 'guide', label: 'Tour Guide' },
];

const INITIAL_OFFERING_FORM: PartnerOffering = {
  title: '',
  description: '',
  image_url: '',
  portal_name: '',
  category_key: 'hotel',
  is_active: true,
  display_order: 0,
};

// Extended Available Icons List
const AVAILABLE_ICONS = [
  { name: 'Percent', label: 'Percent', icon: Percent },
  { name: 'Compass', label: 'Compass', icon: Compass },
  { name: 'Bed', label: 'Hotel / Bed', icon: Bed },
  { name: 'ShieldCheck', label: 'Verified', icon: ShieldCheck },
  { name: 'Layers', label: 'Layers', icon: Layers },
  { name: 'Award', label: 'Award', icon: Award },
  { name: 'Briefcase', label: 'Business', icon: Briefcase },
  { name: 'Star', label: 'Rating', icon: Star },
  { name: 'Sparkles', label: 'Premium', icon: Sparkles },
  { name: 'HeartHandshake', label: 'Partner', icon: HeartHandshake },
  { name: 'Zap', label: 'Fast', icon: Zap },
  { name: 'Globe', label: 'Global', icon: Globe },
  { name: 'Lock', label: 'Secure', icon: Lock },
];

export default function AdminPartners() {
  const [activeTab, setActiveTab] = useState<'hero' | 'benefits' | 'programs'>('hero');
  const [loading, setLoading] = useState(true);
  const [savingHero, setSavingHero] = useState(false);

  // UI Feedback States
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Database States
  const [heroSettings, setHeroSettings] = useState<PartnerHeroSettings>({
    badge_text: '',
    hero_title: '',
    hero_subtitle: '',
    primary_btn_text: '',
    secondary_btn_text: '',
    stat1_value: '', stat1_label: '',
    stat2_value: '', stat2_label: '',
    stat3_value: '', stat3_label: '',
    stat4_value: '', stat4_label: '',
    benefits_title: '',
    benefits_subtitle: ''
  });

  const [benefits, setBenefits] = useState<PartnerBenefit[]>([]);
  const [partners, setPartners] = useState<PartnerOffering[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORY_OPTIONS);

  // Program Modal & Filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<PartnerOffering | null>(null);
  const [programForm, setProgramForm] = useState<PartnerOffering>(INITIAL_OFFERING_FORM);

  // Benefit Modal
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<PartnerBenefit | null>(null);
  const [benefitForm, setBenefitForm] = useState<PartnerBenefit>({
    title: '', description: '', icon_name: 'Percent', display_order: 1, is_active: true
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingProgram, setSubmittingProgram] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => { setToast(null); }, 4000);
  };

  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel('partner_admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_hero_settings' }, () => fetchHeroSettings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_benefits' }, () => fetchBenefits())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_offerings' }, () => fetchPartners())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchHeroSettings(), fetchBenefits(), fetchPartners()]);
    setLoading(false);
  };

  const fetchHeroSettings = async () => {
    const { data } = await supabase.from('partner_hero_settings').select('*').limit(1).single();
    if (data) setHeroSettings(data);
  };

  const fetchBenefits = async () => {
    const { data } = await supabase.from('partner_benefits').select('*').order('display_order', { ascending: true });
    if (data) setBenefits(data);
  };

  const fetchPartners = async () => {
    const { data } = await supabase.from('partner_offerings').select('*').order('display_order', { ascending: true });
    if (data) {
      setPartners(data);
      const existingKeys = new Set(DEFAULT_CATEGORY_OPTIONS.map(c => c.key));
      const dynamicCats: CategoryOption[] = [];
      data.forEach((p: PartnerOffering) => {
        if (p.category_key && !existingKeys.has(p.category_key)) {
          existingKeys.add(p.category_key);
          dynamicCats.push({
            key: p.category_key,
            label: p.category_key.charAt(0).toUpperCase() + p.category_key.slice(1).replace(/-/g, ' ')
          });
        }
      });
      setCategories([...DEFAULT_CATEGORY_OPTIONS, ...dynamicCats]);
    }
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHero(true);
    try {
      if (heroSettings.id) {
        const { error } = await supabase.from('partner_hero_settings').update(heroSettings).eq('id', heroSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('partner_hero_settings').insert([heroSettings]);
        if (error) throw error;
      }
      showToast('Hero header & stats updated successfully!', 'success');
    } catch (err: unknown) {
      if (err instanceof Error) showToast('Error saving settings: ' + err.message, 'error');
    } finally {
      setSavingHero(false);
    }
  };

  const handleSaveBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBenefit?.id) {
        const { id, ...payload } = benefitForm;
        const { error } = await supabase.from('partner_benefits').update(payload).eq('id', editingBenefit.id);
        if (error) throw error;
        showToast('Benefit card updated successfully!', 'success');
      } else {
        const { id, ...payload } = benefitForm;
        const { error } = await supabase.from('partner_benefits').insert([payload]);
        if (error) throw error;
        showToast('New benefit card added!', 'success');
      }
      setIsBenefitModalOpen(false);
      fetchBenefits();
    } catch (err: unknown) {
      if (err instanceof Error) showToast('Error saving benefit card: ' + err.message, 'error');
    }
  };

  const handleDeleteBenefit = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Benefit Card',
      message: 'Are you sure you want to delete this benefit card? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const { error } = await supabase.from('partner_benefits').delete().eq('id', id);
        if (error) {
          showToast('Failed to delete benefit card', 'error');
        } else {
          showToast('Benefit card deleted successfully', 'info');
          fetchBenefits();
        }
      }
    });
  };

  const handleOpenCreateProgram = () => {
    setEditingProgram(null);
    setProgramForm({ ...INITIAL_OFFERING_FORM });
    setIsProgramModalOpen(true);
  };

  const handleOpenEditProgram = (partner: PartnerOffering) => {
    setEditingProgram(partner);
    setProgramForm({ ...partner });
    setIsProgramModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `partner-images/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('fleet').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('fleet').getPublicUrl(filePath);
      setProgramForm(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      showToast('Image uploaded successfully!', 'success');
    } catch (err: unknown) {
      if (err instanceof Error) showToast('Error uploading image: ' + err.message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProgram(true);
    try {
      if (editingProgram?.id) {
        const { id, ...updatePayload } = programForm;
        const { error } = await supabase.from('partner_offerings').update(updatePayload).eq('id', editingProgram.id);
        if (error) throw error;
        showToast('Program updated successfully!', 'success');
      } else {
        const { id, ...insertPayload } = programForm;
        const { error } = await supabase.from('partner_offerings').insert([insertPayload]);
        if (error) throw error;
        showToast('New program created successfully!', 'success');
      }
      setIsProgramModalOpen(false);
      fetchPartners();
    } catch (err: unknown) {
      if (err instanceof Error) showToast('Error saving program: ' + err.message, 'error');
    } finally {
      setSubmittingProgram(false);
    }
  };

  const toggleProgramStatus = async (id: string, currentValue: boolean) => {
    await supabase.from('partner_offerings').update({ is_active: !currentValue }).eq('id', id);
    showToast(`Program ${!currentValue ? 'activated' : 'hidden'}`, 'info');
    fetchPartners();
  };

  const handleDeleteProgram = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Program',
      message: `Are you sure you want to delete "${title}"?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const { error } = await supabase.from('partner_offerings').delete().eq('id', id);
        if (error) {
          showToast('Failed to delete program', 'error');
        } else {
          showToast('Program deleted', 'info');
          fetchPartners();
        }
      }
    });
  };

  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.portal_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category_key === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-16 font-sans relative">
      
      {/* CUSTOM TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === 'success' ? 'bg-slate-900 text-white border-slate-800' :
            toast.type === 'error' ? 'bg-rose-900 text-white border-rose-800' :
            'bg-slate-800 text-slate-100 border-slate-700'
          }`}>
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-teal-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={18} className="text-rose-400 shrink-0" />}
            {toast.type === 'info' && <AlertCircle size={18} className="text-sky-400 shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Header */}
      <div className="w-full bg-white border-b border-slate-200/80 mb-6 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center justify-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-teal-600 shrink-0" /> Partner Page Content Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xl">
            Control the public Partner Ecosystem page headers, statistics, benefit cards, and live partner portals.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('hero')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'hero' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Hero & Stats
            </button>
            <button
              onClick={() => setActiveTab('benefits')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'benefits' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. "Why Partner" Cards
            </button>
            <button
              onClick={() => setActiveTab('programs')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'programs' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Partner Programs ({partners.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200">
            <Loader2 size={24} className="animate-spin text-teal-600" />
            <span className="text-sm font-medium text-slate-600">Loading partner system data...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: HERO & STATS */}
            {activeTab === 'hero' && (
              <form onSubmit={handleSaveHero} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Hero Section Header & Key Stats</h2>
                    <p className="text-xs text-slate-500">Edit the primary headline, subtitle, buttons, and top statistics bar.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={savingHero}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    {savingHero ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>Save Hero Header</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={heroSettings.badge_text}
                      onChange={(e) => setHeroSettings({ ...heroSettings, badge_text: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Primary Button Label</label>
                    <input
                      type="text"
                      value={heroSettings.primary_btn_text}
                      onChange={(e) => setHeroSettings({ ...heroSettings, primary_btn_text: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hero Title</label>
                  <input
                    type="text"
                    value={heroSettings.hero_title}
                    onChange={(e) => setHeroSettings({ ...heroSettings, hero_title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hero Subtitle</label>
                  <textarea
                    rows={3}
                    value={heroSettings.hero_subtitle}
                    onChange={(e) => setHeroSettings({ ...heroSettings, hero_subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Key Metrics Bar (4 Counter Stats)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Stat 1</p>
                      <input
                        type="text" value={heroSettings.stat1_value} placeholder="150+"
                        onChange={(e) => setHeroSettings({ ...heroSettings, stat1_value: e.target.value })}
                        className="w-full bg-white px-2 py-1 mt-1 border border-slate-200 rounded-lg text-sm font-bold"
                      />
                      <input
                        type="text" value={heroSettings.stat1_label} placeholder="Verified Partners"
                        onChange={(e) => setHeroSettings({ ...heroSettings, stat1_label: e.target.value })}
                        className="w-full bg-white px-2 py-1 mt-1 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Stat 2</p>
                      <input
                        type="text" value={heroSettings.stat2_value} placeholder="98%"
                        onChange={(e) => setHeroSettings({ ...heroSettings, stat2_value: e.target.value })}
                        className="w-full bg-white px-2 py-1 mt-1 border border-slate-200 rounded-lg text-sm font-bold"
                      />
                      <input
                        type="text" value={heroSettings.stat2_label} placeholder="Partner Satisfaction"
                        onChange={(e) => setHeroSettings({ ...heroSettings, stat2_label: e.target.value })}
                        className="w-full bg-white px-2 py-1 mt-1 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Stat 3</p>
                      <input
                        type="text" value={heroSettings.stat3_value} placeholder="24/7"
                        onChange={(e) => setHeroSettings({ ...heroSettings, stat3_value: e.target.value })}
                        className="w-full bg-white px-2 py-1 mt-1 border border-slate-200 rounded-lg text-sm font-bold"
                      />
                      <input
                        type="text" value={heroSettings.stat3_label} placeholder="Concierge Desk"
                        onChange={(e) => setHeroSettings({ ...heroSettings, stat3_label: e.target.value })}
                        className="w-full bg-white px-2 py-1 mt-1 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Stat 4</p>
                      <input
                        type="text" value={heroSettings.stat4_value} placeholder="< 48h"
                        onChange={(e) => setHeroSettings({ ...heroSettings, stat4_value: e.target.value })}
                        className="w-full bg-white px-2 py-1 mt-1 border border-slate-200 rounded-lg text-sm font-bold"
                      />
                      <input
                        type="text" value={heroSettings.stat4_label} placeholder="Fast Payout Cycle"
                        onChange={(e) => setHeroSettings({ ...heroSettings, stat4_label: e.target.value })}
                        className="w-full bg-white px-2 py-1 mt-1 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">"Why Partner" Section Header</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={heroSettings.benefits_title}
                        onChange={(e) => setHeroSettings({ ...heroSettings, benefits_title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Section Subtitle</label>
                      <input
                        type="text"
                        value={heroSettings.benefits_subtitle}
                        onChange={(e) => setHeroSettings({ ...heroSettings, benefits_subtitle: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: WHY PARTNER BENEFIT CARDS */}
            {activeTab === 'benefits' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Why Partner Cards</h2>
                    <p className="text-xs text-slate-500">Manage the 3 benefit cards displayed below the hero section.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingBenefit(null);
                      setBenefitForm({ title: '', description: '', icon_name: 'Percent', display_order: benefits.length + 1, is_active: true });
                      setIsBenefitModalOpen(true);
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={16} /> Add Benefit Card
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {benefits.map((benefit) => {
                    const iconObj = AVAILABLE_ICONS.find(i => i.name === benefit.icon_name);
                    const IconComp = iconObj ? iconObj.icon : Percent;
                    return (
                      <div key={benefit.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
                            <IconComp size={22} />
                          </div>
                          <h3 className="font-bold text-slate-900 text-base">{benefit.title}</h3>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{benefit.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400 font-semibold">Order: {benefit.display_order}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingBenefit(benefit);
                                setBenefitForm(benefit);
                                setIsBenefitModalOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteBenefit(benefit.id!)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: PARTNER PROGRAMS */}
            {activeTab === 'programs' && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search programs or portals..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenCreateProgram}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={18} /> Add Program
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase">
                        <th className="p-4">Program & Portal</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredPartners.map((partner) => (
                        <tr key={partner.id} className="hover:bg-slate-50/80">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={partner.image_url || 'https://via.placeholder.com/150'} alt={partner.title} className="w-12 h-12 object-cover rounded-xl bg-slate-100 border border-slate-200" />
                              <div>
                                <p className="font-bold text-slate-900">{partner.title}</p>
                                <p className="text-xs text-teal-700 font-semibold">{partner.portal_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-md uppercase">
                              {partner.category_key}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => toggleProgramStatus(partner.id!, partner.is_active)}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                                partner.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {partner.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                              <span>{partner.is_active ? 'Active' : 'Hidden'}</span>
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleOpenEditProgram(partner)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => handleDeleteProgram(partner.id!, partner.title)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
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
            )}
          </>
        )}
      </div>

      {/* BENEFIT CARD MODAL WITH VISUAL ICON SELECTION */}
      {isBenefitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{editingBenefit ? 'Edit Benefit Card' : 'Add Benefit Card'}</h2>
              <button onClick={() => setIsBenefitModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveBenefit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Title *</label>
                <input
                  type="text" required value={benefitForm.title} onChange={(e) => setBenefitForm({ ...benefitForm, title: e.target.value })}
                  placeholder="e.g. Fair Commission" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description *</label>
                <textarea
                  rows={3} required value={benefitForm.description} onChange={(e) => setBenefitForm({ ...benefitForm, description: e.target.value })}
                  placeholder="Transparent commission structure..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none"
                />
              </div>

              {/* VISUAL ICON PICKER SECTION */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Select Icon</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = benefitForm.icon_name === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setBenefitForm({ ...benefitForm, icon_name: item.name })}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <IconComp size={18} />
                        <span className="text-[10px] font-medium mt-1 truncate w-full text-center">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsBenefitModalOpen(false)} className="px-4 py-2 text-xs font-semibold border rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl">Save Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROGRAM CREATE / EDIT MODAL */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{editingProgram ? 'Edit Program' : 'Add Program'}</h2>
              <button onClick={() => setIsProgramModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitProgram} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Program Title *</label>
                  <input type="text" required value={programForm.title} onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Portal Name *</label>
                  <input type="text" required value={programForm.portal_name} onChange={(e) => setProgramForm({ ...programForm, portal_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description *</label>
                <textarea rows={3} required value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Image Upload</label>
                <div className="flex items-center gap-3">
                  {programForm.image_url && <img src={programForm.image_url} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsProgramModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={submittingProgram} className="px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2">
                  {submittingProgram && <Loader2 size={14} className="animate-spin" />} Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}