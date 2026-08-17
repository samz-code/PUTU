import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import TableOfContents from '@/components/journal/TableOfContents';
import NewsletterSignup from '@/components/journal/NewsletterSignup';
import { processArticleContent, type Heading } from '@/utils/journalContent';
import {
  ArrowLeft, Clock, Eye, Share2, Tag, Check, Send, Bookmark, Sparkles, MessageCircle, ChevronRight,
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
  content: string;
  meta_title: string;
  meta_description: string;
  tags: string[];
  views_count: number;
  published_at: string;
}

const VIEWED_KEY_PREFIX = 'putu_journal_viewed_';

export default function JournalArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [processedContent, setProcessedContent] = useState<{ html: string; headings: Heading[] }>({ html: '', headings: [] });

  useEffect(() => {
    if (slug) fetchArticle(slug);
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Reading progress bar
  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      setReadProgress(pct);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function fetchArticle(articleSlug: string) {
    setLoading(true);
    setNotFound(false);
    try {
      const { data, error } = await supabase
        .from('journal_articles')
        .select('*')
        .eq('slug', articleSlug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setNotFound(true);
        setArticle(null);
        return;
      }

      setArticle(data);
      setProcessedContent(processArticleContent(data.content));

      document.title = data.meta_title || `${data.title} | Putu Journal`;
      const metaDesc = document.querySelector("meta[name='description']");
      if (metaDesc) metaDesc.setAttribute('content', data.meta_description || data.excerpt);

      fetchRelated(data.category, data.tags || [], data.id);
      registerView(data.id, articleSlug);
    } catch (err) {
      console.error('Error fetching article:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  // Only counts once per browser per article per session, and uses an atomic
  // server-side RPC instead of a client read-modify-write (which loses counts
  // under concurrent traffic).
  async function registerView(articleId: string, articleSlug: string) {
    const key = `${VIEWED_KEY_PREFIX}${articleSlug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      const { error } = await supabase.rpc('increment_article_views', { article_id: articleId });
      if (error) throw error;
      sessionStorage.setItem(key, '1');
    } catch (err) {
      console.error('Error registering view:', err);
    }
  }

  async function fetchRelated(category: string, tags: string[], currentId: string) {
    try {
      // Pull a broader pool, then rank client-side by tag overlap so
      // "related" actually means related, not just "same category, newest".
      const { data, error } = await supabase
        .from('journal_articles')
        .select('*')
        .eq('status', 'published')
        .eq('category', category)
        .neq('id', currentId)
        .order('published_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      if (!data) return;

      const ranked = data
        .map(a => ({
          article: a as Article,
          score: (a.tags || []).filter((t: string) => tags.includes(t)).length,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(r => r.article);

      setRelatedArticles(ranked);
    } catch (err) {
      console.error('Error fetching related stories:', err);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: article?.title, text: article?.excerpt, url: window.location.href });
      } catch {
        // user cancelled — no action needed
      }
    } else {
      setShareMenuOpen(prev => !prev);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    setShareMenuOpen(false);
  }

  function handleSocialShare(platform: 'twitter' | 'whatsapp' | 'linkedin') {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(article?.title || '');
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      whatsapp: `https://api.whatsapp.com/send?text=${title}%20-%20${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    setShareMenuOpen(false);
  }

  const jsonLd = useMemo(() => {
    if (!article) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.meta_description || article.excerpt,
      image: article.image_url,
      datePublished: article.published_at,
      author: { '@type': 'Person', name: article.author_name },
      publisher: { '@type': 'Organization', name: 'Putu Travels' },
      keywords: (article.tags || []).join(', '),
      mainEntityOfPage: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }, [article]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading immersive story...
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <h2 className="text-2xl font-serif font-bold text-cocoa-700">Story Not Found</h2>
        <p className="text-slate-600 text-sm">The article you are looking for may have been moved, unpublished, or removed.</p>
        <button onClick={() => navigate('/journal')} className="bg-cocoa-700 hover:bg-cocoa-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors">
          Back to Journal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50/30 pb-24">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-sand-200 z-50">
        <div className="h-full bg-coral-600 transition-[width] duration-150" style={{ width: `${readProgress}%` }} />
      </div>

      {/* Hero Header Banner */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] bg-cocoa-900">
        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 max-w-4xl mx-auto px-4 sm:px-6 pb-12 space-y-4 text-white">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-[11px] text-sand-300 font-medium">
            <Link to="/journal" className="hover:text-white">Journal</Link>
            <ChevronRight size={12} />
            <span className="text-sand-100">{article.category}</span>
          </nav>
          <button
            onClick={() => navigate('/journal')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-sand-200 hover:text-white bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} /> Back to Journal
          </button>
          <span className="inline-block bg-teal-600 text-white text-xs font-semibold px-3.5 py-1 rounded-full uppercase tracking-wider ml-2">
            {article.category}
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-sand-200 pt-2">
            <span>By <strong>{article.author_name}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {article.read_time}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Eye size={13} /> {article.views_count || 1} Reads</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Article Body */}
        <article className="lg:col-span-8 space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-sand-200 shadow-sm">
          <p className="text-xl font-serif text-cocoa-700 leading-relaxed font-medium italic border-l-4 border-coral-600 pl-4 py-1">
            {article.excerpt}
          </p>

          {/* Sanitized-on-write HTML content, headings pre-tagged with ids for TOC */}
          <div
            className="prose prose-slate lg:prose-lg max-w-none font-serif text-slate-700 leading-relaxed space-y-6"
            dangerouslySetInnerHTML={{ __html: processedContent.html }}
          />

          {/* Tags Section */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-8 border-t border-sand-200 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-cocoa-700 uppercase flex items-center gap-1"><Tag size={14} className="text-teal-700" /> Topics:</span>
              {article.tags.map((tag, idx) => (
                <span key={idx} className="bg-sand-100 hover:bg-sand-200 text-cocoa-700 text-xs font-semibold px-3 py-1 rounded-full transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Share Toolbar */}
          <div className="bg-sand-50 rounded-2xl p-6 border border-sand-200 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <div>
              <h4 className="font-serif font-bold text-cocoa-700 text-base">Enjoyed this dispatch?</h4>
              <p className="text-xs text-slate-600 mt-0.5">Share this story with fellow travelers and explorers.</p>
            </div>
            <div className="relative flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleNativeShare}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Share2 size={15} /> Share Story
              </button>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-sand-100 text-cocoa-700 border border-sand-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Copy Link"
              >
                {copied ? <Check size={15} className="text-emerald-700" /> : <Bookmark size={15} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>

              {shareMenuOpen && (
                <div className="absolute right-0 bottom-14 bg-white rounded-2xl shadow-xl border border-sand-200 p-3 z-30 w-48 space-y-1">
                  <button onClick={() => handleSocialShare('whatsapp')} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-sand-50 rounded-lg flex items-center gap-2 cursor-pointer">
                    <MessageCircle size={14} className="text-emerald-700" /> WhatsApp
                  </button>
                  <button onClick={() => handleSocialShare('twitter')} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-sand-50 rounded-lg flex items-center gap-2 cursor-pointer">
                    <Send size={14} className="text-sky-700" /> X (Twitter)
                  </button>
                  <button onClick={() => handleSocialShare('linkedin')} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-sand-50 rounded-lg flex items-center gap-2 cursor-pointer">
                    <Share2 size={14} className="text-teal-700" /> LinkedIn
                  </button>
                </div>
              )}
            </div>
          </div>

          <NewsletterSignup source={`journal_article_${article.slug}`} />
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="sticky top-6 space-y-8">
            <TableOfContents headings={processedContent.headings} />

            {/* Author Card */}
            <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-sm text-center space-y-4">
              <div className="w-20 h-20 bg-teal-50 text-teal-700 font-serif font-bold text-2xl rounded-full flex items-center justify-center mx-auto border-2 border-teal-100 shadow-inner">
                {article.author_name.charAt(0)}
              </div>
              <div>
                <h3 className="font-serif font-bold text-cocoa-700 text-lg">{article.author_name}</h3>
                <p className="text-xs text-slate-500 mt-1">Curator & Dispatch Editor</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-serif">
                Bringing you authentic insights, conservation updates, and curated travel guides across East Africa.
              </p>
            </div>

            {/* Related Stories */}
            {relatedArticles.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-cocoa-700 text-base flex items-center gap-2">
                  <Sparkles size={16} className="text-coral-600" /> Related Dispatches
                </h3>
                <div className="space-y-4">
                  {relatedArticles.map(rel => (
                    <div
                      key={rel.id}
                      onClick={() => navigate(`/journal/${rel.slug}`)}
                      className="group cursor-pointer flex items-center gap-3 p-2 rounded-2xl hover:bg-sand-50 transition-colors"
                    >
                      <img src={rel.image_url} alt={rel.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div>
                        <span className="text-[10px] font-semibold text-teal-700 uppercase">{rel.category}</span>
                        <h4 className="font-serif font-bold text-cocoa-700 text-xs line-clamp-2 group-hover:text-coral-600 transition-colors">
                          {rel.title}
                        </h4>
                        <span className="text-[10px] text-slate-400">{rel.read_time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

      </main>
    </div>
  );
}