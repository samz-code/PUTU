import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Wish {
  id: string;
  item_type: string;
  name: string;
  image_url: string | null;
}

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    supabase.from('wishlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setItems((data as Wish[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    await supabase.from('wishlist').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <PageHeader title="Wishlist" subtitle="Saved experiences, hotels, and destinations" />
      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <Heart size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-base text-slate-500">Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((w) => (
            <div key={w.id} className="card-md overflow-hidden">
              {w.image_url && <div className="h-32 overflow-hidden"><img src={w.image_url} alt={w.name} className="w-full h-full object-cover" /></div>}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-base font-medium text-cocoa-700">{w.name}</div>
                    <span className="badge-slate mt-1">{w.item_type}</span>
                  </div>
                  <button onClick={() => remove(w.id)} className="text-slate-400 hover:text-error-500"><Trash2 size={16} /></button>
                </div>
                <Link to="/planner" className="btn-primary w-full text-sm">Book This Trip</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
