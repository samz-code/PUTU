import React, { useState, useEffect, useRef } from 'react';
import { 
  GripVertical, Plus, Trash2, Edit3, Save, RefreshCw, 
  Check, Upload, ChevronUp, ChevronDown, 
  X, Loader2, Database
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { IMAGES } from '@/lib/images';

// --- Types ---
interface AboutContent {
  id?: string;
  hero_title: string;
  hero_subtitle: string;
  story_heading: string;
  story_p1: string;
  story_p2: string;
  story_p3: string;
  story_image: string;
}

interface ValueItem {
  id?: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
}

interface BrandAsset {
  id?: string;
  name: string;
  file_name: string;
  bg_class: string;
  preview_url: string;
  display_order: number;
}

interface MerchProduct {
  id?: string;
  category: string;
  name: string;
  price: string;
  image_url: string;
  display_order: number;
}

const merchCategories = [
  { key: 'apparel', label: 'Apparel' },
  { key: 'bags', label: 'Bags' },
  { key: 'drinkware', label: 'Drinkware' },
  { key: 'stationery', label: 'Stationery' },
  { key: 'tech', label: 'Tech Accessories' },
  { key: 'travel', label: 'Travel Essentials' },
  { key: 'home', label: 'Home & Living' },
];

// --- Default Data Fallbacks ---
const DEFAULT_CONTENT: AboutContent = {
  hero_title: 'About Putu Travels',
  hero_subtitle: 'A digital luxury travel concierge, not just a booking platform.',
  story_heading: 'Our Story',
  story_p1: 'Putu Travels was founded on a simple belief: travel should feel personal. On the Kenyan coast, where the options are endless and the details matter, travelers need one trusted contact who handles everything.',
  story_p2: 'We are not a booking engine. We are a concierge. We gather a detailed brief, prepare a personalized proposal, coordinate a vetted network of partners, and manage the journey from arrival to departure.',
  story_p3: 'Every hotel, every driver, every restaurant, every guide in our network is someone we trust. That trust is what we pass on to you.',
  story_image: IMAGES.conciergeReception,
};

const DEFAULT_VALUES: Omit<ValueItem, 'id'>[] = [
  { icon_name: 'Heart', title: 'Personal', description: 'Every proposal is curated from your brief, not generated.', display_order: 0 },
  { icon_name: 'Target', title: 'Precise', description: 'Every detail coordinated, from pickup time to dietary needs.', display_order: 1 },
  { icon_name: 'Users', title: 'Trusted', description: 'A vetted partner network we have built over years.', display_order: 2 },
  { icon_name: 'Award', title: 'Quality', description: 'We hold our partners to the standard you expect.', display_order: 3 },
];

const DEFAULT_ASSETS: Omit<BrandAsset, 'id'>[] = [
  { name: 'Primary Logo', file_name: 'putu-logo-primary.svg', bg_class: 'bg-white', preview_url: '/brand/logo-primary.png', display_order: 0 },
  { name: 'Reversed Logo', file_name: 'putu-logo-reversed.svg', bg_class: 'bg-cocoa-700', preview_url: '/brand/logo-reversed.png', display_order: 1 },
  { name: 'Icon Mark', file_name: 'putu-icon-mark.svg', bg_class: 'bg-sand-100', preview_url: '/brand/logo-icon.png', display_order: 2 },
];

const DEFAULT_MERCH: Omit<MerchProduct, 'id'>[] = [
  { category: 'apparel', name: 'Crew T-Shirt', price: 'KSh 1,800', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', display_order: 0 },
  { category: 'apparel', name: 'Polo Shirt', price: 'KSh 2,600', image_url: 'https://images.unsplash.com/photo-1625910513411-5ed006731170?auto=format&fit=crop&w=600&q=80', display_order: 1 },
  { category: 'apparel', name: 'Baseball Cap', price: 'KSh 1,500', image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80', display_order: 2 },
  { category: 'apparel', name: 'Zip Hoodie', price: 'KSh 3,400', image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80', display_order: 3 },
  { category: 'bags', name: 'Canvas Tote', price: 'KSh 2,000', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80', display_order: 0 },
  { category: 'bags', name: 'Weekend Duffel', price: 'KSh 4,500', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', display_order: 1 },
  { category: 'drinkware', name: 'Steel Water Bottle', price: 'KSh 2,200', image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', display_order: 0 },
  { category: 'stationery', name: 'Journey Notebook', price: 'KSh 1,000', image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', display_order: 0 },
  { category: 'tech', name: 'Wireless Power Bank', price: 'KSh 3,800', image_url: 'https://images.unsplash.com/photo-1609592424104-97d4c42c755f?auto=format&fit=crop&w=600&q=80', display_order: 0 },
  { category: 'travel', name: 'Leather Passport Holder', price: 'KSh 1,600', image_url: 'https://images.unsplash.com/photo-1553531384-cc6acaf8893d?auto=format&fit=crop&w=600&q=80', display_order: 0 },
  { category: 'home', name: 'Coastal Scented Candle', price: 'KSh 1,800', image_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80', display_order: 0 },
];

// --- Image Uploader Field ---
function ImageUploadField({ 
  value, 
  onChange, 
  label = 'Image' 
}: { 
  value: string; 
  onChange: (url: string) => void; 
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('about-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('about-media')
        .getPublicUrl(filePath);

      onChange(publicUrlData.publicUrl);
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Error uploading file'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase text-slate-700">{label}</label>
      
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group h-36 flex items-center justify-center">
          <img src={value} alt="Uploaded preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded shadow hover:bg-slate-100 flex items-center gap-1"
            >
              <Upload size={14} /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded shadow hover:bg-rose-700 flex items-center gap-1"
            >
              <X size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-coral-500 rounded-lg p-6 text-center bg-slate-50 hover:bg-coral-50/20 cursor-pointer transition-colors flex flex-col items-center justify-center"
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-coral-600 font-medium text-xs">
              <Loader2 size={20} className="animate-spin" /> Uploading image...
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 mb-2 shadow-sm">
                <Upload size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-700">Click to upload image</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP, or SVG up to 5MB</p>
            </>
          )}
        </div>
      )}

      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden" 
      />

      <div className="pt-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste external image URL (https://...)"
          className="w-full border border-slate-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-coral-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

// --- Main Admin About Component ---
export default function AdminAbout() {
  const [activeTab, setActiveTab] = useState<'story' | 'values' | 'brand' | 'merch'>('story');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Data States
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [values, setValues] = useState<ValueItem[]>([]);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [merch, setMerch] = useState<MerchProduct[]>([]);
  const [selectedMerchCategory, setSelectedMerchCategory] = useState<string>('apparel');

  // Drag State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Modals
  const [valueModal, setValueModal] = useState<Partial<ValueItem> | null>(null);
  const [assetModal, setAssetModal] = useState<Partial<BrandAsset> | null>(null);
  const [merchModal, setMerchModal] = useState<Partial<MerchProduct> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Content
      const { data: contentData } = await supabase.from('about_content').select('*').limit(1).single();
      if (contentData) {
        setContent(contentData);
      } else {
        setContent(DEFAULT_CONTENT);
      }

      // Values
      const { data: valuesData } = await supabase.from('about_values').select('*').order('display_order', { ascending: true });
      if (valuesData && valuesData.length > 0) {
        setValues(valuesData.map((v) => ({ ...v, description: v.description || v.desc || '' })));
      } else {
        setValues([]);
      }

      // Brand Assets
      const { data: assetsData } = await supabase.from('about_brand_assets').select('*').order('display_order', { ascending: true });
      if (assetsData && assetsData.length > 0) {
        setAssets(assetsData);
      } else {
        setAssets([]);
      }

      // Merchandise
      const { data: merchData } = await supabase.from('about_merchandise').select('*').order('display_order', { ascending: true });
      if (merchData && merchData.length > 0) {
        setMerch(merchData);
      } else {
        setMerch([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Seed Handlers for initial database initialization
  const seedValues = async () => {
    setSaving(true);
    const { error } = await supabase.from('about_values').insert(DEFAULT_VALUES);
    setSaving(false);
    if (!error) {
      showToast('Default values seeded to database!');
      fetchData();
    } else {
      alert(`Error seeding values: ${error.message}`);
    }
  };

  const seedAssets = async () => {
    setSaving(true);
    const { error } = await supabase.from('about_brand_assets').insert(DEFAULT_ASSETS);
    setSaving(false);
    if (!error) {
      showToast('Default brand assets seeded to database!');
      fetchData();
    } else {
      alert(`Error seeding assets: ${error.message}`);
    }
  };

  const seedMerch = async () => {
    setSaving(true);
    const { error } = await supabase.from('about_merchandise').insert(DEFAULT_MERCH);
    setSaving(false);
    if (!error) {
      showToast('Default merchandise seeded to database!');
      fetchData();
    } else {
      alert(`Error seeding merchandise: ${error.message}`);
    }
  };

  // Save Story Content
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('about_content').upsert(content);
    setSaving(false);
    if (!error) {
      showToast('Story and Hero section updated!');
      fetchData();
    } else {
      alert(`Error saving content: ${error.message}`);
    }
  };

  // Value CRUD
  const handleSaveValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valueModal) return;
    setSaving(true);

    const payload = {
      title: valueModal.title,
      description: valueModal.description,
      icon_name: valueModal.icon_name || 'Heart',
      display_order: valueModal.display_order ?? values.length,
    };

    if (valueModal.id) {
      await supabase.from('about_values').update(payload).eq('id', valueModal.id);
      showToast('Value updated!');
    } else {
      await supabase.from('about_values').insert([payload]);
      showToast('Value added!');
    }

    setValueModal(null);
    setSaving(false);
    fetchData();
  };

  const handleDeleteValue = async (id: string) => {
    if (!confirm('Delete this value item?')) return;
    await supabase.from('about_values').delete().eq('id', id);
    showToast('Item deleted!');
    fetchData();
  };

  // Asset CRUD
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetModal) return;
    setSaving(true);

    const payload = {
      name: assetModal.name,
      file_name: assetModal.file_name,
      bg_class: assetModal.bg_class || 'bg-white',
      preview_url: assetModal.preview_url,
      display_order: assetModal.display_order ?? assets.length,
    };

    if (assetModal.id) {
      await supabase.from('about_brand_assets').update(payload).eq('id', assetModal.id);
      showToast('Asset updated!');
    } else {
      await supabase.from('about_brand_assets').insert([payload]);
      showToast('Asset added!');
    }

    setAssetModal(null);
    setSaving(false);
    fetchData();
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    await supabase.from('about_brand_assets').delete().eq('id', id);
    showToast('Asset deleted!');
    fetchData();
  };

  // Merch CRUD
  const handleSaveMerch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchModal) return;
    setSaving(true);

    const targetCategory = merchModal.category || selectedMerchCategory;
    const payload = {
      name: merchModal.name,
      price: merchModal.price,
      image_url: merchModal.image_url,
      category: targetCategory,
      display_order: merchModal.display_order ?? merch.filter((m) => m.category === targetCategory).length,
    };

    if (merchModal.id) {
      await supabase.from('about_merchandise').update(payload).eq('id', merchModal.id);
      showToast('Product updated!');
    } else {
      await supabase.from('about_merchandise').insert([payload]);
      showToast('Product added!');
    }

    setMerchModal(null);
    setSaving(false);
    fetchData();
  };

  const handleDeleteMerch = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('about_merchandise').delete().eq('id', id);
    showToast('Product deleted!');
    fetchData();
  };

  // Reorder Handler
  const moveItem = async (type: 'values' | 'assets' | 'merch', fromIndex: number, toIndex: number) => {
    if (type === 'values') {
      if (toIndex < 0 || toIndex >= values.length) return;
      const reordered = [...values];
      const [item] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, item);
      const updated = reordered.map((val, idx) => ({ ...val, display_order: idx }));
      setValues(updated);

      for (const item of updated) {
        if (item.id) await supabase.from('about_values').update({ display_order: item.display_order }).eq('id', item.id);
      }
      showToast('Values reordered!');
    } else if (type === 'assets') {
      if (toIndex < 0 || toIndex >= assets.length) return;
      const reordered = [...assets];
      const [item] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, item);
      const updated = reordered.map((val, idx) => ({ ...val, display_order: idx }));
      setAssets(updated);

      for (const item of updated) {
        if (item.id) await supabase.from('about_brand_assets').update({ display_order: item.display_order }).eq('id', item.id);
      }
      showToast('Assets reordered!');
    } else if (type === 'merch') {
      const categoryItems = merch.filter((m) => m.category === selectedMerchCategory);
      if (toIndex < 0 || toIndex >= categoryItems.length) return;

      const reordered = [...categoryItems];
      const [item] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, item);
      const updatedCategory = reordered.map((val, idx) => ({ ...val, display_order: idx }));

      const otherItems = merch.filter((m) => m.category !== selectedMerchCategory);
      setMerch([...otherItems, ...updatedCategory]);

      for (const item of updatedCategory) {
        if (item.id) await supabase.from('about_merchandise').update({ display_order: item.display_order }).eq('id', item.id);
      }
      showToast('Merchandise reordered!');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-coral-600" size={32} />
        <p className="text-slate-500 text-sm font-medium">Loading About Section management...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5">
          <Check size={18} className="text-emerald-400" />
          <span className="text-xs sm:text-sm font-medium">{notification}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manage About Page</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Full content management, image uploads, and drag-and-drop ordering.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="border-b border-slate-200 -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-px">
          {[
            { key: 'story', label: 'Story & Hero' },
            { key: 'values', label: 'Core Values' },
            { key: 'brand', label: 'Brand Assets' },
            { key: 'merch', label: 'Merchandise Catalog' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap min-h-[44px] ${
                activeTab === tab.key
                  ? 'border-coral-600 text-coral-600 bg-coral-50/30'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: STORY & HERO */}
      {activeTab === 'story' && (
        <form onSubmit={handleSaveContent} className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Hero Banner & Our Story</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Hero Title</label>
              <input
                type="text"
                value={content.hero_title}
                onChange={(e) => setContent({ ...content, hero_title: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Hero Subtitle</label>
              <input
                type="text"
                value={content.hero_subtitle || ''}
                onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Story Heading</label>
              <input
                type="text"
                value={content.story_heading || ''}
                onChange={(e) => setContent({ ...content, story_heading: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
              />
            </div>
            <div>
              <ImageUploadField
                label="Story Image"
                value={content.story_image || ''}
                onChange={(url) => setContent({ ...content, story_image: url })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Paragraph 1</label>
              <textarea
                rows={3}
                value={content.story_p1 || ''}
                onChange={(e) => setContent({ ...content, story_p1: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Paragraph 2</label>
              <textarea
                rows={3}
                value={content.story_p2 || ''}
                onChange={(e) => setContent({ ...content, story_p2: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Paragraph 3</label>
              <textarea
                rows={3}
                value={content.story_p3 || ''}
                onChange={(e) => setContent({ ...content, story_p3: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-6 py-3 sm:py-2.5 rounded-md font-bold text-xs sm:text-sm transition-colors min-h-[44px]"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Main Story'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: CORE VALUES */}
      {activeTab === 'values' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Core Values ("What We Stand For")</h3>
              <p className="text-xs text-slate-500 mt-0.5">Drag handles or use Up/Down buttons to reorder.</p>
            </div>
            <div className="flex items-center gap-2">
              {values.length === 0 && (
                <button
                  type="button"
                  onClick={seedValues}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-md font-bold text-xs transition-colors min-h-[44px]"
                >
                  <Database size={15} /> Seed Default Values
                </button>
              )}
              <button
                onClick={() => setValueModal({ title: '', description: '', icon_name: 'Heart' })}
                className="inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-4 py-2.5 rounded-md font-bold text-xs sm:text-sm transition-colors min-h-[44px]"
              >
                <Plus size={16} /> Add Core Value
              </button>
            </div>
          </div>

          {values.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-lg p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Database size={22} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Core Values in Database</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The database table currently has no saved values. You can seed the default core values with one click or create custom ones.
              </p>
              <button
                onClick={seedValues}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-4 py-2.5 rounded-md text-xs font-bold transition-colors"
              >
                <Database size={15} /> Populate Default Core Values
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {values.map((v, idx) => (
                <div
                  key={v.id || idx}
                  draggable
                  onDragStart={() => setDraggedIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => moveItem('values', draggedIndex!, idx)}
                  className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 flex items-center justify-between gap-2 shadow-sm hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="hidden sm:block cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600">
                      <GripVertical size={20} />
                    </div>
                    
                    <div className="flex flex-col sm:hidden gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveItem('values', idx, idx - 1)}
                        className="p-1 border rounded bg-slate-50 disabled:opacity-30 text-slate-600"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === values.length - 1}
                        onClick={() => moveItem('values', idx, idx + 1)}
                        className="p-1 border rounded bg-slate-50 disabled:opacity-30 text-slate-600"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div className="truncate">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{v.title}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{v.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setValueModal(v)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => v.id && handleDeleteValue(v.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BRAND ASSETS */}
      {activeTab === 'brand' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Downloadable Brand Logos</h3>
              <p className="text-xs text-slate-500 mt-0.5">Upload SVG / PNG vector marks and reorder them.</p>
            </div>
            <div className="flex items-center gap-2">
              {assets.length === 0 && (
                <button
                  type="button"
                  onClick={seedAssets}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-md font-bold text-xs transition-colors min-h-[44px]"
                >
                  <Database size={15} /> Seed Default Logos
                </button>
              )}
              <button
                onClick={() => setAssetModal({ name: '', file_name: '', bg_class: 'bg-white', preview_url: '' })}
                className="inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-4 py-2.5 rounded-md font-bold text-xs sm:text-sm transition-colors min-h-[44px]"
              >
                <Plus size={16} /> Add Brand Asset
              </button>
            </div>
          </div>

          {assets.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-lg p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Database size={22} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Brand Assets in Database</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No brand assets exist in the database. Populate the default brand logos or create new ones.
              </p>
              <button
                onClick={seedAssets}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-4 py-2.5 rounded-md text-xs font-bold transition-colors"
              >
                <Database size={15} /> Populate Default Logos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((a, idx) => (
                <div
                  key={a.id || idx}
                  draggable
                  onDragStart={() => setDraggedIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => moveItem('assets', draggedIndex!, idx)}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm relative group"
                >
                  <div className="absolute top-2 left-2 z-10 flex gap-1 bg-slate-900/80 text-white rounded p-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveItem('assets', idx, idx - 1)}
                      className="p-1 hover:text-coral-400 disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      disabled={idx === assets.length - 1}
                      onClick={() => moveItem('assets', idx, idx + 1)}
                      className="p-1 hover:text-coral-400 disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <div className={`${a.bg_class} h-36 flex items-center justify-center p-4 border-b border-slate-100`}>
                    <img src={a.preview_url} alt={a.name} className="max-h-20 max-w-[80%] object-contain" />
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="truncate">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{a.name}</h4>
                      <span className="text-[11px] text-slate-400 block truncate">{a.file_name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setAssetModal(a)} className="p-2 text-slate-600 hover:bg-slate-100 rounded">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => a.id && handleDeleteAsset(a.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MERCHANDISE CATALOG */}
      {activeTab === 'merch' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {merchCategories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedMerchCategory(cat.key)}
                  className={`px-3 py-2 rounded-md text-xs font-bold transition-colors whitespace-nowrap min-h-[36px] ${
                    selectedMerchCategory === cat.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {merch.length === 0 && (
                <button
                  type="button"
                  onClick={seedMerch}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-md font-bold text-xs transition-colors min-h-[44px]"
                >
                  <Database size={15} /> Seed Default Catalog
                </button>
              )}
              <button
                onClick={() => setMerchModal({ name: '', price: 'KSh ', image_url: '', category: selectedMerchCategory })}
                className="inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-4 py-2.5 rounded-md font-bold text-xs sm:text-sm transition-colors min-h-[44px]"
              >
                <Plus size={16} /> Add Product
              </button>
            </div>
          </div>

          {merch.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-lg p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Database size={22} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Merchandise in Database</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No merchandise items exist in the database table. Click below to populate default products into Supabase.
              </p>
              <button
                onClick={seedMerch}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-4 py-2.5 rounded-md text-xs font-bold transition-colors"
              >
                <Database size={15} /> Populate Default Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {merch
                .filter((m) => m.category === selectedMerchCategory)
                .map((p, idx, list) => (
                  <div
                    key={p.id || idx}
                    draggable
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => moveItem('merch', draggedIndex!, idx)}
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm relative"
                  >
                    <div className="absolute top-2 left-2 z-10 flex gap-1 bg-slate-900/80 text-white rounded p-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveItem('merch', idx, idx - 1)}
                        className="p-1 hover:text-coral-400 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        disabled={idx === list.length - 1}
                        onClick={() => moveItem('merch', idx, idx + 1)}
                        className="p-1 hover:text-coral-400 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div className="h-44 bg-slate-100 overflow-hidden">
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{p.name}</h4>
                      <p className="text-xs text-coral-600 font-bold mt-0.5">{p.price}</p>

                      <div className="flex items-center justify-end gap-1 mt-3 border-t border-slate-100 pt-2">
                        <button onClick={() => setMerchModal(p)} className="p-2 text-slate-600 hover:bg-slate-100 rounded">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => p.id && handleDeleteMerch(p.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: VALUE ITEM */}
      {valueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <form 
            onSubmit={handleSaveValue} 
            className="bg-white rounded-t-xl sm:rounded-xl p-5 sm:p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">{valueModal.id ? 'Edit Value Item' : 'Add New Value Item'}</h3>
              <button type="button" onClick={() => setValueModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
              <input
                type="text"
                value={valueModal.title || ''}
                onChange={(e) => setValueModal({ ...valueModal, title: e.target.value })}
                className="w-full border border-slate-300 rounded p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
              <textarea
                rows={3}
                value={valueModal.description || ''}
                onChange={(e) => setValueModal({ ...valueModal, description: e.target.value })}
                className="w-full border border-slate-300 rounded p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Icon Name</label>
              <select
                value={valueModal.icon_name || 'Heart'}
                onChange={(e) => setValueModal({ ...valueModal, icon_name: e.target.value })}
                className="w-full border border-slate-300 rounded p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
              >
                <option value="Heart">Heart</option>
                <option value="Target">Target</option>
                <option value="Users">Users</option>
                <option value="Award">Award</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setValueModal(null)}
                className="px-4 py-2.5 border rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="px-5 py-2.5 bg-coral-600 hover:bg-coral-700 text-white rounded-md text-xs font-bold min-h-[44px]"
              >
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: BRAND ASSET */}
      {assetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <form 
            onSubmit={handleSaveAsset} 
            className="bg-white rounded-t-xl sm:rounded-xl p-5 sm:p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">{assetModal.id ? 'Edit Brand Asset' : 'Add Brand Asset'}</h3>
              <button type="button" onClick={() => setAssetModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Asset Name</label>
              <input
                type="text"
                value={assetModal.name || ''}
                onChange={(e) => setAssetModal({ ...assetModal, name: e.target.value })}
                className="w-full border border-slate-300 rounded p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
                placeholder="e.g. Primary Logo"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Download File Name</label>
              <input
                type="text"
                value={assetModal.file_name || ''}
                onChange={(e) => setAssetModal({ ...assetModal, file_name: e.target.value })}
                className="w-full border border-slate-300 rounded p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
                placeholder="e.g. putu-logo-primary.svg"
                required
              />
            </div>

            <ImageUploadField
              label="Asset Preview Image / Vector"
              value={assetModal.preview_url || ''}
              onChange={(url) => setAssetModal({ ...assetModal, preview_url: url })}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Card Background</label>
              <select
                value={assetModal.bg_class || 'bg-white'}
                onChange={(e) => setAssetModal({ ...assetModal, bg_class: e.target.value })}
                className="w-full border border-slate-300 rounded p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
              >
                <option value="bg-white">White</option>
                <option value="bg-cocoa-700">Cocoa Dark</option>
                <option value="bg-sand-100">Sand Neutral</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setAssetModal(null)}
                className="px-4 py-2.5 border rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="px-5 py-2.5 bg-coral-600 hover:bg-coral-700 text-white rounded-md text-xs font-bold min-h-[44px]"
              >
                Save Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: MERCHANDISE PRODUCT */}
      {merchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <form 
            onSubmit={handleSaveMerch} 
            className="bg-white rounded-t-xl sm:rounded-xl p-5 sm:p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">{merchModal.id ? 'Edit Product' : 'Add New Product'}</h3>
              <button type="button" onClick={() => setMerchModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={merchModal.category || selectedMerchCategory}
                onChange={(e) => setMerchModal({ ...merchModal, category: e.target.value })}
                className="w-full border border-slate-300 rounded p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
              >
                {merchCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Name</label>
              <input
                type="text"
                value={merchModal.name || ''}
                onChange={(e) => setMerchModal({ ...merchModal, name: e.target.value })}
                className="w-full border border-slate-300 rounded p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
                placeholder="e.g. Canvas Tote Bag"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Price String</label>
              <input
                type="text"
                value={merchModal.price || ''}
                onChange={(e) => setMerchModal({ ...merchModal, price: e.target.value })}
                className="w-full border border-slate-300 rounded p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-coral-500 focus:outline-none"
                placeholder="e.g. KSh 2,500"
                required
              />
            </div>

            <ImageUploadField
              label="Product Image"
              value={merchModal.image_url || ''}
              onChange={(url) => setMerchModal({ ...merchModal, image_url: url })}
            />

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setMerchModal(null)}
                className="px-4 py-2.5 border rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="px-5 py-2.5 bg-coral-600 hover:bg-coral-700 text-white rounded-md text-xs font-bold min-h-[44px]"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}