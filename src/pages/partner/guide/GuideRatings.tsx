import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function GuideRatings() {
  const { user } = useAuth();
  const [items, setItems] = useState<Review[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('tour_guides').select('id').eq('partner_user_id', user.id).maybeSingle().then(async ({ data }) => {
      if (data) {
        const { data: rData } = await supabase.from('reviews').select('*').eq('reviewable_type', 'tour').eq('reviewable_id', data.id).order('created_at', { ascending: false });
        setItems((rData as Review[]) ?? []);
      }
    });
  }, [user]);

  const avg = items.length > 0 ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0;

  return (
    <div>
      <PageHeader title="Ratings" subtitle="Your customer feedback" />
      <div className="card p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-coral-50 flex items-center justify-center">
          <Star size={22} className="text-coral-600" />
        </div>
        <div>
          <div className="font-serif text-3xl font-semibold text-cocoa-700">{avg.toFixed(1)}</div>
          <div className="text-xs text-slate-500">Average from {items.length} reviews</div>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <Star size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-base text-slate-500">No reviews yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < r.rating ? 'fill-warning-500 text-warning-500' : 'text-slate-200'} />
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{r.comment ?? 'No comment'}</p>
              <p className="text-xs text-slate-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
