import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import NewsletterSignup from '@/components/journal/NewsletterSignup';
import {
  BookOpen, Eye, ArrowRight, Search, TrendingUp, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  read_time: string;
  author_name: string;
  image_url: string;
  excerpt: string;
  views_count: number;
  is_featured: boolean;
  published_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

const PAGE_SIZE = 9;

export default function Journal() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = 'The Putu Journal — Coastal Travel Guides & Dispatches';
    const metaDesc = document.querySelector("meta[name='description']");
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Immersive travel guides, cultural deep dives, conservation insights, and coastal dispatches from Putu Travels.'
      );
    }
    fetchData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        supabase
          .from('journal_articles')
          .select('id, title, slug, category, read_time, author_name, image_url, excerpt, views_count, is_featured, published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false }),
        supabase
          .from('journal_categories')
          .select('id, name, slug, display_order')
          .order('display_order', { ascending: true }),
      ]);

      if (articlesRes.error) throw articlesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setArticles(articlesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error('Error fetching journal:', err);
      setError('We could not load journal stories right now. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  const featuredArticle = useMemo(
    () => articles.find(a => a.is_featured) || articles[0],
    [articles]
  );

  const trending = useMemo(
    () => [...articles].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 4),
    [articles]
  );

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return articles.filter(art => {
      const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
      const matchesSearch =
        !query ||
        art.title.toLowerCase().includes(query) ||
        art.excerpt.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  const showFeatured = selectedCategory === 'All' && !searchQuery && !!featuredArticle;
  const gridArticles = showFeatured
    ? filteredArticles.filter(a => a.id !== featuredArticle!.id)
    : filteredArticles;

  const totalPages = Math.max(1, Math.ceil(gridArticles.length / PAGE_SIZE));
  const pagedArticles = gridArticles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // JSON-LD for search engines: helps Google understand this is a blog index
  const jsonLd = useMemo(() => {
    if (articles.length === 0) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'The Putu Journal',
      description: 'Coastal travel guides, culture, and conservation dispatches from Putu Travels.',
      blogPost: articles.slice(0, 12).map(a => ({
        '@type': 'BlogPosting',
        headline: a.title,
        image: a.image_url,
        datePublished: a.published_at,
        author: { '@type': 'Person', name: a.author_name },
      })),
    };
  }, [articles]);

  function goToPage(n: number) {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-sand-50/50 pb-20">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* Edge-to-Edge Full Width Banner */}
      <section className="relative w-full bg-cocoa-900 text-white py-24 sm:py-32 px-4 sm:px-8 overflow-hidden mb-12">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=1800"
            alt="Coastal dhow boats at sunset"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        <div className="relative max-w-7xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-2 bg-teal-600/30 text-teal-300 text-xs font-semibold tracking-wider uppercase px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-teal-500/30">
            <BookOpen size={13} /> The Putu Journal
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight">Stories from the Coast & Beyond</h1>
          <p className="text-sand-200 text-base sm:text-lg max-w-2xl mx-auto font-light">
            Immersive travel guides, cultural deep dives, conservation insights, and coastal dispatches curated by our editorial team.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-sand-200 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'All' ? 'bg-teal-700 text-white shadow-sm' : 'bg-sand-100 text-cocoa-700 hover:bg-sand-200'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.name ? 'bg-teal-700 text-white shadow-sm' : 'bg-sand-100 text-cocoa-700 hover:bg-sand-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-sand-50 border border-sand-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Trending strip — drives click-through on repeat visits */}
        {!loading && trending.length > 0 && selectedCategory === 'All' && !searchQuery && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cocoa-700 uppercase shrink-0">
              <TrendingUp size={14} className="text-coral-600" /> Most Read
            </span>
            {trending.map((t, i) => (
              <Link
                key={t.id}
                to={`/journal/${t.slug}`}
                className="inline-flex items-center gap-1.5 bg-white border border-sand-200 hover:border-teal-300 rounded-full px-3.5 py-1.5 text-xs font-medium text-cocoa-700 transition-colors"
              >
                <span className="text-coral-600 font-bold">{i + 1}</span> {t.title}
              </Link>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-sand-200 overflow-hidden animate-pulse">
                <div className="h-56 bg-sand-100" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-sand-100 rounded w-1/3" />
                  <div className="h-5 bg-sand-100 rounded w-5/6" />
                  <div className="h-4 bg-sand-100 rounded w-full" />
                  <div className="h-4 bg-sand-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-sand-200 text-slate-500">
            No stories published yet. Check back soon.
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-sand-200 text-slate-500 space-y-2">
            <p>No stories match "{searchQuery}"{selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="text-teal-700 font-semibold text-sm cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Featured Hero Article */}
            {showFeatured && (
              <div className="bg-white rounded-3xl border border-sand-200 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-0 group">
                <div className="lg:col-span-7 relative overflow-hidden min-h-[300px] lg:min-h-[400px]">
                  <img
                    src={featuredArticle!.image_url}
                    alt={featuredArticle!.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-teal-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                    Featured Story
                  </span>
                </div>
                <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="text-teal-700 font-semibold">{featuredArticle!.category}</span>
                      <span>•</span>
                      <span>{featuredArticle!.read_time}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Eye size={13} /> {featuredArticle!.views_count} views</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-cocoa-700 leading-snug">
                      {featuredArticle!.title}
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                      {featuredArticle!.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-sand-100">
                    <div className="text-xs text-slate-500 font-medium">By {featuredArticle!.author_name}</div>
                    <Link
                      to={`/journal/${featuredArticle!.slug}`}
                      className="inline-flex items-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                    >
                      Read Story <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pagedArticles.map(art => (
                <div key={art.id} className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
                  <div className="relative h-56 overflow-hidden">
                    <img src={art.image_url} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-cocoa-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      {art.category}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>{art.read_time}</span>
                        <span className="flex items-center gap-1 text-teal-700"><Eye size={13} /> {art.views_count} views</span>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-cocoa-700 line-clamp-2 group-hover:text-teal-700 transition-colors">
                        {art.title}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-sand-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">By {art.author_name}</span>
                      <Link
                        to={`/journal/${art.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
                      >
                        Read <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl border border-sand-200 bg-white text-cocoa-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sand-100 cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      page === i + 1 ? 'bg-teal-700 text-white' : 'bg-white border border-sand-200 text-cocoa-700 hover:bg-sand-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-xl border border-sand-200 bg-white text-cocoa-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sand-100 cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        <NewsletterSignup source="journal_index" />
      </div>
    </div>
  );
}