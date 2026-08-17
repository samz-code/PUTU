import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Clock, 
  Star, 
  Sparkles, 
  ArrowRight, 
  Compass, 
  Anchor, 
  TreePine, 
  Utensils, 
  Heart,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface Experience {
  id: string;
  title: string;
  slug?: string;
  category: string;
  location?: string | null;
  duration?: string | null;
  price?: number | null;
  rating?: number | null;
  reviewsCount?: number | null;
  reviews_count?: number | null;
  image_url?: string | null;
  image?: string | null;
  tagline?: string | null;
  description?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  inclusives?: string[] | null;
  exclusives?: string[] | null;
}

const CATEGORIES = [
  { id: 'all', label: 'All Experiences', icon: Compass },
  { id: 'coastal', label: 'Coastal & Sea', icon: Anchor },
  { id: 'safari', label: 'Safari & Air', icon: TreePine },
  { id: 'culinary', label: 'Fine Dining', icon: Utensils },
  { id: 'wellness', label: 'Wellness & Spa', icon: Heart },
];

export default function Experiences() {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching experiences:', error.message);
    } else if (data) {
      setExperiences(data);
    }
    setLoading(false);
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const matchesCategoryFilter = (expCategory: string, selected: string) => {
    if (selected === 'all') return true;
    const cat = (expCategory || '').toLowerCase();

    if (selected === 'coastal') return cat.includes('coastal') || cat.includes('marine') || cat.includes('water');
    if (selected === 'safari') return cat.includes('safari') || cat.includes('air') || cat.includes('wildlife');
    if (selected === 'culinary') return cat.includes('culinary') || cat.includes('dining') || cat.includes('food');
    if (selected === 'wellness') return cat.includes('wellness') || cat.includes('spa') || cat.includes('culture');

    return cat.includes(selected.toLowerCase());
  };

  const filteredExperiences = useMemo(() => {
    return experiences.filter((exp) => {
      const matchesCat = matchesCategoryFilter(exp.category, selectedCategory);
      
      const title = exp.title ? exp.title.toLowerCase() : '';
      const location = exp.location ? exp.location.toLowerCase() : '';
      const description = exp.description ? exp.description.toLowerCase() : '';
      const query = searchQuery.toLowerCase();

      const matchesSearch = title.includes(query) || location.includes(query) || description.includes(query);

      return matchesCat && matchesSearch;
    });
  }, [experiences, selectedCategory, searchQuery]);

  const featuredExp = experiences.find((e) => e.is_featured) || experiences[0];

  const handleBook = (exp: Experience) => {
    navigate('/login', {
      state: {
        from: `/portal/book/${exp.id}`,
        selectedExperience: exp,
      },
    });
  };

  return (
    <div className="min-h-screen bg-sand-50 text-slate-800 font-sans pb-20">
      {/* Page Header */}
      <header className="bg-sand-100 border-b border-sand-200 py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-coral-50 border border-coral-200 text-coral-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-coral-500" />
            <span>Curated Concierge Services</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-cocoa-900 tracking-tight">
            Bespoke Coastal Experiences
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            Immerse yourself in handpicked luxury journeys, private marine charters, and exclusive wild escapes across the Kenyan coastline.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        
        {/* Search & Category Filter Controls */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by destination or experience..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 shadow-sm transition-all"
              />
            </div>

            {/* Filter Count Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-cocoa-700 uppercase tracking-wider self-end md:self-auto">
              <SlidersHorizontal size={14} className="text-coral-600" />
              <span>Showing {filteredExperiences.length} Experiences</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-cocoa-800 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-sand-100 border border-slate-200/80'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-coral-500' : 'text-slate-400'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4 shadow-sm">
            <RefreshCw size={32} className="animate-spin mx-auto text-coral-500" />
            <p className="text-sm font-semibold text-slate-600">Loading bespoke experiences...</p>
          </div>
        ) : (
          <>
            {/* Featured Spotlight Experience */}
            {featuredExp && selectedCategory === 'all' && !searchQuery && (
              <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40 grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-full min-h-[340px]">
                  <img
                    src={featuredExp.image_url || featuredExp.image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'}
                    alt={featuredExp.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-cocoa-900/90 text-sand-50 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-md">
                    Signature Experience
                  </div>
                </div>

                <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-coral-600 text-xs font-bold uppercase tracking-wider">
                        <MapPin size={14} />
                        <span>{featuredExp.location || 'Kenya Coast'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-sand-100 px-2.5 py-1 rounded-md">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span>{featuredExp.rating || 5.0}</span>
                        {(featuredExp.reviewsCount || featuredExp.reviews_count) && (
                          <span className="text-slate-400">
                            ({featuredExp.reviewsCount || featuredExp.reviews_count})
                          </span>
                        )}
                      </div>
                    </div>

                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-900 leading-snug">
                      {featuredExp.title}
                    </h2>

                    <p className="text-slate-600 text-sm leading-relaxed">
                      {featuredExp.description || 'Experience an unmatched luxury journey along the stunning coast.'}
                    </p>

                    {/* Featured Inclusions & Exclusions */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      {featuredExp.inclusives && featuredExp.inclusives.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1.5">
                            Inclusions:
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {featuredExp.inclusives.map((inc, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {featuredExp.exclusives && featuredExp.exclusives.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block mb-1.5">
                            Exclusions:
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {featuredExp.exclusives.map((exc, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                                <XCircle size={13} className="text-rose-500 shrink-0" />
                                <span>{exc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-cocoa-700" />
                        {featuredExp.duration || 'Custom Duration'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">From</span>
                      <span className="font-serif text-2xl font-bold text-cocoa-900">
                        {featuredExp.price ? `$${Number(featuredExp.price).toFixed(2)}` : 'Inquire'}
                      </span>
                      {featuredExp.price && <span className="text-xs text-slate-500"> / guest</span>}
                    </div>

                    <button
                      onClick={() => handleBook(featuredExp)}
                      className="flex items-center gap-2 px-6 py-3 bg-coral-600 hover:bg-coral-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-95"
                    >
                      <span>Reserve Journey</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Experience Grid */}
            <section className="space-y-6">
              <h3 className="font-serif text-2xl font-bold text-cocoa-900">
                {selectedCategory === 'all' ? 'All Experiences' : 'Curated Selection'}
              </h3>

              {filteredExperiences.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                  <Compass size={40} className="mx-auto text-slate-300" />
                  <h4 className="font-serif text-lg font-bold text-cocoa-800">No experiences found</h4>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    We couldn't find any journeys matching your search terms. Try clearing filters or exploring another category.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 bg-sand-100 hover:bg-sand-200 text-cocoa-800 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredExperiences.map((exp) => {
                    const isSaved = savedIds.includes(exp.id);
                    const coverImg = exp.image_url || exp.image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80';

                    return (
                      <div
                        key={exp.id}
                        className="group bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Image Container */}
                          <div className="relative h-56 overflow-hidden bg-slate-100">
                            <img
                              src={coverImg}
                              alt={exp.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80';
                              }}
                            />
                            <button
                              onClick={(e) => toggleSave(exp.id, e)}
                              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 text-cocoa-900 hover:text-coral-600 shadow-sm backdrop-blur-md transition-colors"
                              aria-label="Save experience"
                            >
                              <Heart
                                size={16}
                                className={isSaved ? 'fill-coral-600 text-coral-600' : ''}
                              />
                            </button>
                            <div className="absolute bottom-4 left-4 bg-cocoa-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                              {exp.category}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="flex items-center gap-1 text-coral-600">
                                <MapPin size={13} />
                                {exp.location || 'Kenya Coast'}
                              </span>
                              <span className="flex items-center gap-1 text-slate-700 bg-sand-50 px-2 py-0.5 rounded border border-sand-200">
                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                {exp.rating || 5.0}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-serif text-lg font-bold text-cocoa-900 group-hover:text-coral-600 transition-colors">
                                {exp.title}
                              </h4>
                              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                                {exp.tagline || exp.description || 'Exclusive coastal experience.'}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock size={13} />
                                {exp.duration || 'Flexible'}
                              </span>
                            </div>

                            {/* Visible Inclusions & Exclusions */}
                            {((exp.inclusives && exp.inclusives.length > 0) || (exp.exclusives && exp.exclusives.length > 0)) && (
                              <div className="space-y-3 pt-3 border-t border-slate-100">
                                {exp.inclusives && exp.inclusives.length > 0 && (
                                  <div>
                                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                                      What's Included:
                                    </span>
                                    <ul className="space-y-1">
                                      {exp.inclusives.map((inc, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                          <span>{inc}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {exp.exclusives && exp.exclusives.length > 0 && (
                                  <div>
                                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-1">
                                      What's Excluded:
                                    </span>
                                    <ul className="space-y-1">
                                      {exp.exclusives.map((exc, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
                                          <XCircle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                                          <span>{exc}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer / Pricing */}
                        <div className="px-6 py-4 bg-sand-50/60 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                              From
                            </span>
                            <span className="font-serif text-lg font-bold text-cocoa-900">
                              {exp.price ? `$${Number(exp.price).toFixed(2)}` : 'Inquire'}
                            </span>
                          </div>

                          <button
                            onClick={() => handleBook(exp)}
                            className="px-4 py-2 bg-cocoa-800 hover:bg-cocoa-900 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* Concierge Custom Banner */}
        <section className="bg-cocoa-900 text-sand-50 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-coral-400 text-xs font-bold uppercase tracking-widest block">
              Custom Itineraries
            </span>
            <h3 className="font-serif text-3xl font-bold">
              Looking for a tailored experience?
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Our dedicated luxury concierge team can construct fully bespoke itineraries, private jet charters, and exclusive villa takeovers.
            </p>
          </div>
          <button
            onClick={() => navigate('/contact')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-coral-600 hover:bg-coral-700 text-white font-semibold text-sm rounded-xl shadow-lg transition-all active:scale-95"
          >
            <span>Speak with a Concierge</span>
            <ArrowRight size={16} />
          </button>
        </section>

      </main>
    </div>
  );
}