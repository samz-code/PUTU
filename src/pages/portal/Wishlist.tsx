import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Wish {
  id: string;
  item_type: string;
  name: string;
  image_url: string | null;
  created_at?: string;
}

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data as Wish[]) ?? []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const removeItem = async (id: string) => {
    try {
      setDeletingId(id);
      // Optimistic UI update
      setItems((prev) => prev.filter((item) => item.id !== id));

      const { error } = await supabase.from('wishlist').delete().eq('id', id);
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Failed to remove item from wishlist:', err);
      // Revert if failed
      loadWishlist();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Refresh Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Wishlist" 
          subtitle="Saved experiences, hotels, and destinations for your next journey" 
        />
        {user && (
          <button
            onClick={loadWishlist}
            disabled={refreshing}
            className="self-start sm:self-auto p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-coral-500' : ''} />
            Refresh Wishlist
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs p-4 animate-pulse space-y-3">
              <div className="h-32 bg-slate-100 rounded-lg" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs max-w-md mx-auto my-12">
          <div className="w-16 h-16 bg-coral-50 rounded-full flex items-center justify-center mx-auto mb-4 text-coral-500">
            <Heart size={28} />
          </div>
          <h3 className="font-serif font-bold text-slate-800 text-lg mb-1">Your wishlist is empty</h3>
          <p className="text-xs text-slate-500 mb-6">Explore our catalog of tours and experiences and save your favorites here.</p>
          <Link 
            to="/experiences" 
            className="inline-block px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Explore Experiences
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((w) => (
            <div 
              key={w.id} 
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {w.image_url ? (
                  <div className="h-40 overflow-hidden bg-slate-100 relative">
                    <img 
                      src={w.image_url} 
                      alt={w.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                ) : (
                  <div className="h-20 bg-slate-50 flex items-center justify-center border-b border-slate-100">
                    <Heart size={20} className="text-slate-300" />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-serif font-bold text-slate-800 text-sm mb-1">{w.name}</h4>
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {w.item_type || 'Experience'}
                      </span>
                    </div>
                    <button 
                      onClick={() => removeItem(w.id)}
                      disabled={deletingId === w.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <Link 
                  to={`/planner?item=${encodeURIComponent(w.name)}`} 
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs text-center block"
                >
                  Book This Trip
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}