import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import TiptapEditor from '@/components/journal/TiptapEditor';
import { calculateReadingTime } from '@/utils/journalContent';
import {
  Plus, Pencil, Trash2, X, Search, Check, Image as ImageIcon, Globe, Tag, Key,
  BarChart3, Eye, FileText, Sparkles, AlertTriangle, CheckCircle2, Settings,
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: 'draft' | 'published';
  read_time: string;
  author_name: string;
  image_url: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  tags: string[];
  views_count: number;
  is_featured: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  category: '',
  status: 'draft' as 'draft' | 'published',
  read_time: '5 min read',
  author_name: 'Putu Editorial',
  image_url: '',
  excerpt: '',
  content: '',
  meta_title: '',
  meta_description: '',
  keywordsInput: '',
  tagsInput: '',
  is_featured: false,
};

function slugify(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function AdminJournal() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  async function fetchArticles() {
    try {
      const { data, error } = await supabase
        .from('journal_articles')
        .select('*')
        .order('published_at', { ascending: false });
      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('journal_categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0 && !form.category) {
        setForm(prev => ({ ...prev, category: prev.category || data[0].name }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setCategoryError('');
    try {
      const slug = slugify(name);
      const { error } = await supabase.from('journal_categories').insert([
        { name, slug, display_order: categories.length + 1 },
      ]);
      if (error) {
        if (error.code === '23505') {
          setCategoryError('That category already exists.');
          return;
        }
        throw error;
      }
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setCategoryError('Failed to add category.');
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    const inUse = articles.some(a => a.category === name);
    if (inUse) {
      alert(`"${name}" is used by existing articles. Reassign those articles before deleting this category.`);
      return;
    }
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const { error } = await supabase.from('journal_categories').delete().eq('id', id);
      if (error) throw error;
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  }

  function handleTitleChange(val: string) {
    setForm(prev => ({
      ...prev,
      title: val,
      slug: editingId ? prev.slug : slugify(val),
      meta_title: prev.meta_title || val,
    }));
  }

  // Debounced-on-blur uniqueness check so we don't offer a slug that will fail on save
  async function checkSlugUniqueness(slug: string) {
    if (!slug) return;
    try {
      let query = supabase.from('journal_articles').select('id').eq('slug', slug);
      if (editingId) query = query.neq('id', editingId);
      const { data, error } = await query.maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      setSlugTaken(!!data);
    } catch (err) {
      console.error('Error checking slug:', err);
    }
  }

  async function handleImageUpload(file: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `journal/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('public-bucket').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('public-bucket').getPublicUrl(filePath);
      setForm(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`Failed to upload image: ${err?.message || 'Check storage bucket.'}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (slugTaken) {
      setSaveError('This slug is already in use. Choose a unique one.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const finalSlug = slugify(form.slug);
      const payload = {
        title: form.title.trim(),
        slug: finalSlug,
        category: form.category,
        status: form.status,
        read_time: form.read_time.trim() || calculateReadingTime(form.content),
        author_name: form.author_name.trim() || 'Putu Editorial',
        image_url: form.image_url,
        excerpt: form.excerpt.trim(),
        content: form.content,
        meta_title: form.meta_title.trim() || form.title.trim(),
        meta_description: form.meta_description.trim() || form.excerpt.trim(),
        keywords: form.keywordsInput ? form.keywordsInput.split(',').map(k => k.trim()).filter(Boolean) : [],
        tags: form.tagsInput ? form.tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [],
        is_featured: form.is_featured,
      };

      if (!payload.title || !payload.slug || !payload.category || !payload.excerpt) {
        setSaveError('Title, slug, category, and excerpt are required.');
        setSaving(false);
        return;
      }

      if (editingId) {
        const { error } = await supabase.from('journal_articles').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('journal_articles').insert([{ ...payload, published_at: new Date().toISOString() }]);
        if (error) throw error;
      }

      closeModal();
      fetchArticles();
    } catch (err: any) {
      console.error('Error saving article:', err);
      setSaveError(err?.message || 'Error saving article. Ensure the slug is unique.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this story? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('journal_articles').delete().eq('id', id);
      if (error) throw error;
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Failed to delete article.');
    }
  }

  async function handleToggleStatus(art: Article) {
    const newStatus = art.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase.from('journal_articles').update({ status: newStatus }).eq('id', art.id);
      if (error) throw error;
      setArticles(prev => prev.map(a => (a.id === art.id ? { ...a, status: newStatus } : a)));
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  }

  function openEdit(art: Article) {
    setEditingId(art.id);
    setSlugTaken(false);
    setSaveError('');
    setForm({
      title: art.title,
      slug: art.slug,
      category: art.category,
      status: art.status || 'draft',
      read_time: art.read_time,
      author_name: art.author_name,
      image_url: art.image_url,
      excerpt: art.excerpt,
      content: art.content || '',
      meta_title: art.meta_title || '',
      meta_description: art.meta_description || '',
      keywordsInput: art.keywords ? art.keywords.join(', ') : '',
      tagsInput: art.tags ? art.tags.join(', ') : '',
      is_featured: art.is_featured,
    });
    setActiveTab('content');
    setIsModalOpen(true);
  }

  function openNew() {
    setEditingId(null);
    setSlugTaken(false);
    setSaveError('');
    setForm({ ...EMPTY_FORM, category: categories[0]?.name || '' });
    setActiveTab('content');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setSaveError('');
  }

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return articles.filter(a => {
      const matchesQuery = a.title.toLowerCase().includes(query) || a.category.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [articles, search, statusFilter]);

  const stats = useMemo(() => {
    const published = articles.filter(a => a.status === 'published').length;
    const totalViews = articles.reduce((sum, a) => sum + (a.views_count || 0), 0);
    const avgViews = articles.length > 0 ? Math.round(totalViews / articles.length) : 0;
    return { total: articles.length, published, drafts: articles.length - published, totalViews, avgViews };
  }, [articles]);

  // Live SEO checklist for the article being edited
  const seoChecks = useMemo(() => {
    const titleLen = form.meta_title.length;
    const descLen = form.meta_description.length;
    const bodyText = form.content.replace(/<[^>]*>/g, ' ').toLowerCase();
    const hasKeywordInBody = form.keywordsInput
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean)
      .some(k => bodyText.includes(k));

    return [
      { label: 'Meta title 30–60 characters', pass: titleLen >= 30 && titleLen <= 60, detail: `${titleLen} chars` },
      { label: 'Meta description 120–160 characters', pass: descLen >= 120 && descLen <= 160, detail: `${descLen} chars` },
      { label: 'At least one focus keyword', pass: form.keywordsInput.trim().length > 0, detail: '' },
      { label: 'Focus keyword appears in body', pass: hasKeywordInBody, detail: '' },
      { label: 'Hero image set', pass: !!form.image_url, detail: '' },
      { label: 'At least 2 tags', pass: form.tagsInput.split(',').filter(t => t.trim()).length >= 2, detail: '' },
    ];
  }, [form]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-cocoa-700">Journal & SEO Management</h1>
          <p className="text-slate-600 text-sm mt-1">Curate stories, manage categories, and configure search engine metadata.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-white border border-sand-200 hover:bg-sand-100 text-cocoa-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            <Settings size={16} /> Categories
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} /> New Article
          </button>
        </div>
      </div>

      {/* Stats dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Stories', value: stats.total, icon: FileText, color: 'text-cocoa-700' },
          { label: 'Published', value: stats.published, icon: CheckCircle2, color: 'text-emerald-700' },
          { label: 'Drafts', value: stats.drafts, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-teal-700' },
          { label: 'Avg Views/Story', value: stats.avgViews.toLocaleString(), icon: BarChart3, color: 'text-coral-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-4 rounded-2xl border border-sand-200 shadow-sm space-y-2">
            <stat.icon size={18} className={stat.color} />
            <div className="text-2xl font-bold font-serif text-cocoa-700">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-sm flex items-center gap-3 flex-1">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by title or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm focus:outline-none bg-transparent"
          />
        </div>
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-sand-200 shadow-sm">
          {(['all', 'published', 'draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === s ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-sand-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading journal articles...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-sand-200 text-slate-500">
          No articles match your filters.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sand-50 border-b border-sand-200 text-xs font-semibold text-cocoa-700 uppercase">
                  <th className="p-4 sm:px-6">Article & Slug</th>
                  <th className="p-4 sm:px-6">Category & Tags</th>
                  <th className="p-4 sm:px-6">SEO Health</th>
                  <th className="p-4 sm:px-6">Status</th>
                  <th className="p-4 sm:px-6 hidden sm:table-cell">Featured</th>
                  <th className="p-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 text-sm text-slate-600">
                {filtered.map(art => (
                  <tr key={art.id} className="hover:bg-sand-50/50 transition-colors">
                    <td className="p-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img src={art.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 bg-sand-100" />
                        <div>
                          <div className="font-bold text-cocoa-700 line-clamp-1">{art.title}</div>
                          <div className="text-xs font-mono text-teal-700">/journal/{art.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 sm:px-6">
                      <span className="bg-sand-100 text-cocoa-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{art.category}</span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {art.tags?.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 sm:px-6 text-xs text-slate-500">
                      <div>{art.keywords?.length || 0} Keywords</div>
                      <div className={art.meta_description ? 'text-emerald-700 font-semibold' : 'text-amber-600 font-semibold'}>
                        {art.meta_description ? 'SEO Ready' : 'Missing Meta'}
                      </div>
                    </td>
                    <td className="p-4 sm:px-6">
                      <button
                        onClick={() => handleToggleStatus(art)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          art.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                        title="Click to toggle"
                      >
                        {art.status === 'published' ? <Globe size={12} /> : <FileText size={12} />}
                        {art.status === 'published' ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="p-4 sm:px-6 hidden sm:table-cell">
                      {art.is_featured ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <Check size={12} /> Hero
                        </span>
                      ) : <span className="text-xs text-slate-400">Standard</span>}
                    </td>
                    <td className="p-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(art)} className="p-2 bg-sand-100 hover:bg-sand-200 text-cocoa-700 rounded-lg cursor-pointer" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(art.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer" title="Delete">
                          <Trash2 size={15} />
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

      {/* Category Manager Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl space-y-5">
            <button onClick={() => setCategoryModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold font-serif text-cocoa-700">Manage Categories</h2>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => { setNewCategoryName(e.target.value); setCategoryError(''); }}
                placeholder="New category name"
                className="flex-1 bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-teal-600"
              />
              <button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white px-4 rounded-xl text-sm font-semibold cursor-pointer">
                Add
              </button>
            </form>
            {categoryError && <p className="text-xs text-rose-600">{categoryError}</p>}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-sand-50 rounded-xl px-3 py-2">
                  <span className="text-sm text-cocoa-700 font-medium">{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No categories yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Article Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 sm:p-8 relative shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={20} />
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 pb-4">
              <h2 className="text-2xl font-bold font-serif text-cocoa-700">{editingId ? 'Edit Article' : 'New Journal Article'}</h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => setActiveTab('content')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'content' ? 'bg-teal-700 text-white' : 'bg-sand-100 text-slate-600'}`}>
                  Article Content
                </button>
                <button type="button" onClick={() => setActiveTab('seo')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'seo' ? 'bg-teal-700 text-white' : 'bg-sand-100 text-slate-600'}`}>
                  SEO & Keywords
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {activeTab === 'content' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Article Title</label>
                      <input
                        type="text" required value={form.title}
                        onChange={e => handleTitleChange(e.target.value)}
                        className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Professional URL Slug</label>
                        <div className={`flex items-center bg-sand-50 border rounded-xl px-3 py-2 text-xs font-mono ${slugTaken ? 'border-rose-400' : 'border-sand-200'}`}>
                          <span className="text-slate-400 mr-1">/journal/</span>
                          <input
                            type="text" required value={form.slug}
                            onChange={e => { setForm({ ...form, slug: slugify(e.target.value) }); setSlugTaken(false); }}
                            onBlur={e => checkSlugUniqueness(slugify(e.target.value))}
                            className="w-full bg-transparent focus:outline-none text-teal-700 font-bold"
                          />
                        </div>
                        {slugTaken && <p className="text-[11px] text-rose-600 mt-1">This slug is already taken.</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Category</label>
                        <select
                          required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                          className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                        >
                          {categories.length === 0 && <option value="">No categories yet</option>}
                          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Read Time</label>
                        <input
                          type="text" value={form.read_time} placeholder="Auto-calculated if blank"
                          onChange={e => setForm({ ...form, read_time: e.target.value })}
                          className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Author Name</label>
                        <input
                          type="text" required value={form.author_name}
                          onChange={e => setForm({ ...form, author_name: e.target.value })}
                          className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Status</label>
                        <select
                          value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}
                          className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Hero Banner Image</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-sand-300 bg-sand-50 rounded-2xl p-6 text-center cursor-pointer hover:bg-sand-100/50"
                      >
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => e.target.files && handleImageUpload(e.target.files[0])} />
                        {uploading ? <p className="text-teal-700 text-sm">Uploading...</p> : form.image_url ? (
                          <img src={form.image_url} alt="Preview" className="h-32 mx-auto rounded-lg object-cover" />
                        ) : (
                          <div className="space-y-1"><ImageIcon size={32} className="mx-auto text-slate-400" /><p className="text-sm text-slate-600">Click to upload banner</p></div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Excerpt (Card Summary)</label>
                      <textarea rows={2} required value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none" placeholder="Brief summary..." />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">Full Article Content</label>
                      <TiptapEditor content={form.content} onChange={html => setForm(prev => ({ ...prev, content: html }))} />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input type="checkbox" id="is_featured" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 text-teal-700 rounded border-sand-300" />
                      <label htmlFor="is_featured" className="text-sm font-medium text-cocoa-700">Display as Featured Hero Story on Index</label>
                    </div>
                  </div>

                  {/* Live SEO checklist sidebar */}
                  <div className="lg:col-span-1">
                    <div className="bg-sand-50 rounded-2xl border border-sand-200 p-5 space-y-3 sticky top-4">
                      <h3 className="text-xs font-bold text-cocoa-700 uppercase flex items-center gap-1.5">
                        <Sparkles size={14} className="text-coral-600" /> SEO Checklist
                      </h3>
                      {seoChecks.map(check => (
                        <div key={check.label} className="flex items-start gap-2 text-xs">
                          {check.pass ? (
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <span className={check.pass ? 'text-slate-600' : 'text-slate-500'}>
                            {check.label}{check.detail ? ` (${check.detail})` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-sand-50 p-4 rounded-2xl border border-sand-200 space-y-2">
                    <div className="flex items-center gap-2 text-cocoa-700 font-semibold text-sm">
                      <Globe size={16} className="text-teal-700" /> Search Engine Optimization (SEO)
                    </div>
                    <p className="text-xs text-slate-600">Optimize how this article appears in Google search results and social media shares.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">SEO Meta Title</label>
                    <input
                      type="text" value={form.meta_title}
                      onChange={e => setForm({ ...form, meta_title: e.target.value })}
                      placeholder="Custom browser title..."
                      className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">{form.meta_title.length} / 60 characters</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-cocoa-700 uppercase mb-1">SEO Meta Description</label>
                    <textarea
                      rows={3} value={form.meta_description}
                      onChange={e => setForm({ ...form, meta_description: e.target.value })}
                      placeholder="Description for search engines (approx 150-160 characters)..."
                      className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">{form.meta_description.length} / 160 characters</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-cocoa-700 uppercase mb-1">
                      <Key size={14} className="text-teal-700" /> Focus Keywords (Comma separated)
                    </label>
                    <input
                      type="text" value={form.keywordsInput}
                      onChange={e => setForm({ ...form, keywordsInput: e.target.value })}
                      placeholder="e.g. east africa safari, luxury travel guide, wildlife conservation"
                      className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-cocoa-700 uppercase mb-1">
                      <Tag size={14} className="text-teal-700" /> Article Tags (Comma separated)
                    </label>
                    <input
                      type="text" value={form.tagsInput}
                      onChange={e => setForm({ ...form, tagsInput: e.target.value })}
                      placeholder="e.g. Wildlife, Itineraries, Kenya, Eco-Tourism"
                      className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {saveError && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
                  <AlertTriangle size={14} className="shrink-0" /> {saveError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-sand-200">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-slate-600 cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold cursor-pointer">
                  {saving ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}