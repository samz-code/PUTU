import { useEffect, useState } from 'react';
import { Star, Check, X, EyeOff, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

interface Review {
  id: string;
  reviewable_type: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  created_at: string;
}

export default function AdminReviews() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  const load = () => {
    setLoading(true);
    supabase.from('reviews').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError('Unable to load reviews.');
      else setItems((data as Review[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (r: Review) => {
    await supabase.from('reviews').update({ is_published: !r.is_published }).eq('id', r.id);
    setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_published: !x.is_published } : x)));
  };

  const filtered = items.filter((r) => {
    if (filter === 'All') return true;
    if (filter === 'Published') return r.is_published;
    if (filter === 'Hidden') return !r.is_published;
    return r.reviewable_type === filter;
  });

  const avgRating = items.length > 0 ? (items.reduce((s, r) => s + r.rating, 0) / items.length).toFixed(1) : '-';

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Customer feedback across hotels, drivers, restaurants, and tours" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="stat-card"><span className="text-sm text-slate-500">Total Reviews</span><span className="font-serif text-xl font-semibold text-cocoa-700">{items.length}</span></div>
        <div className="stat-card"><span className="text-sm text-slate-500">Avg Rating</span><span className="font-serif text-xl font-semibold text-cocoa-700">{avgRating}</span></div>
        <div className="stat-card"><span className="text-sm text-slate-500">Published</span><span className="font-serif text-xl font-semibold text-teal-600">{items.filter((r) => r.is_published).length}</span></div>
        <div className="stat-card"><span className="text-sm text-slate-500">Hidden</span><span className="font-serif text-xl font-semibold text-coral-600">{items.filter((r) => !r.is_published).length}</span></div>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['All', 'Published', 'Hidden', 'hotel', 'driver', 'restaurant', 'tour', 'experience'].map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === tab ? 'bg-coral-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-sand-100'}`}>{tab}</button>
        ))}
      </div>

      {loading ? <p className="text-sm text-slate-400">Loading...</p>
      : error ? <div className="flex items-center gap-2 text-coral-600"><AlertCircle size={18} /><span>{error}</span></div>
      : filtered.length === 0 ? (
        <div className="card p-10 text-center"><Star size={32} className="mx-auto text-slate-300 mb-3" /><p className="text-base text-slate-500">No reviews found.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className={`card p-5 ${!r.is_published ? 'border-slate-200 bg-slate-50' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="badge-slate capitalize">{r.reviewable_type}</span>
                  {!r.is_published && <span className="badge-error">Hidden</span>}
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < r.rating ? 'fill-warning-500 text-warning-500' : 'text-slate-200'} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{r.comment ?? 'No comment'}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                <button onClick={() => togglePublish(r)} className={`text-xs font-medium inline-flex items-center gap-1 ${r.is_published ? 'text-slate-500 hover:text-coral-600' : 'text-teal-600 hover:text-teal-700'}`}>
                  {r.is_published ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Publish</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
