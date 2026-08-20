import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Compass, 
  ConciergeBell, 
  ShieldCheck, 
  Clock, 
  Star, 
  Award, 
  CheckCircle,
  Headphones,
  BedDouble,
  MapPin,
  Car,
  Heart,
  PhoneCall,
  Zap,
  Coffee,
  FileText,
  Sliders,
  Sparkles,
  CalendarCheck,
  Users,
  Calendar,
  Mail,
  Send,
  AlertCircle,
  Waves,
  LucideIcon
} from 'lucide-react';
import { IMAGES } from '@/lib/images';
import { supabase } from '@/lib/supabase';

interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  badge_text: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  display_order: number;
  is_active: boolean;
}

interface Pillar {
  id: string;
  title: string;
  description: string;
  icon_name?: string;
  display_order?: number;
}

interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  image_url: string;
}

interface Destination {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

// Full icon registry for database resolution
const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  ShieldCheck,
  Compass,
  Sliders,
  Headphones,
  BedDouble,
  ConciergeBell,
  Sparkles,
  Award,
  Star,
  CheckCircle,
  MapPin,
  Car,
  Heart,
  PhoneCall,
  Coffee,
  CalendarCheck,
  Clock,
  Zap,
};

/**
 * Resolves icon explicitly by name, or contextually by analyzing keywords in the title
 */
const getContextualIcon = (title: string = '', iconName?: string): LucideIcon => {
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }

  const t = title.toLowerCase();
  if (t.includes('proposal') || t.includes('brief') || t.includes('quote')) return FileText;
  if (t.includes('trust') || t.includes('partner') || t.includes('safe') || t.includes('vetted')) return ShieldCheck;
  if (t.includes('end') || t.includes('journey') || t.includes('seamless') || t.includes('coordinator')) return Compass;
  if (t.includes('itinerary') || t.includes('tailor') || t.includes('custom')) return Sliders;
  if (t.includes('24/7') || t.includes('concierge') || t.includes('support')) return Headphones;
  if (t.includes('stay') || t.includes('villa') || t.includes('resort') || t.includes('hotel') || t.includes('exclusive')) return BedDouble;

  return Sparkles;
};

// Simple RFC-5322-ish email check, good enough for client-side gating
const isValidEmail = (value: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value.trim());
};

export default function Home() {
  const navigate = useNavigate();

  // Dynamic Database States
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [featuredExperiences, setFeaturedExperiences] = useState<Experience[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  // Loading States
  const [loadingHero, setLoadingHero] = useState(true);
  const [loadingPillars, setLoadingPillars] = useState(true);
  const [loadingExps, setLoadingExps] = useState(true);
  const [loadingDests, setLoadingDests] = useState(true);

  // Quick Planner Form State
  const [destination, setDestination] = useState('');
  const [guests, setGuests] = useState('2');
  const [travelDate, setTravelDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Newsletter Form State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  // 1. Data Fetching
  useEffect(() => {
    async function fetchHeroBanners() {
      try {
        setLoadingHero(true);
        const { data } = await supabase
          .from('hero_banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (data && data.length > 0) setHeroBanners(data);
      } catch (err) {
        console.error('Failed to fetch hero banners:', err);
      } finally {
        setLoadingHero(false);
      }
    }

    async function fetchPillars() {
      try {
        setLoadingPillars(true);
        const { data, error } = await supabase
          .from('pillars')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data) {
          setPillars(data);
        }
      } catch (err) {
        console.error('Failed to fetch pillars:', err);
      } finally {
        setLoadingPillars(false);
      }
    }

    async function fetchExperiences() {
      try {
        setLoadingExps(true);
        const { data } = await supabase
          .from('experiences')
          .select('*')
          .eq('is_featured', true)
          .limit(3);

        if (data) setFeaturedExperiences(data);
      } catch (err) {
        console.error('Failed to fetch experiences:', err);
      } finally {
        setLoadingExps(false);
      }
    }

    async function fetchDestinations() {
      try {
        setLoadingDests(true);
        const { data } = await supabase
          .from('destinations')
          .select('*')
          .limit(6);

        if (data) setDestinations(data);
      } catch (err) {
        console.error('Failed to fetch destinations:', err);
      } finally {
        setLoadingDests(false);
      }
    }

    fetchHeroBanners();
    fetchPillars();
    fetchExperiences();
    fetchDestinations();
  }, []);

  // 2. Auto Carousel Timer (Rotates every 5 seconds)
  useEffect(() => {
    if (heroBanners.length <= 1) return;

    const autoCarouselInterval = setInterval(() => {
      setActiveBannerIndex((prevIndex) => (prevIndex + 1) % heroBanners.length);
    }, 5000);

    return () => clearInterval(autoCarouselInterval);
  }, [heroBanners]);

  // Reset the newsletter status message back to idle a few seconds after success/duplicate/error
  useEffect(() => {
    if (newsletterStatus === 'success' || newsletterStatus === 'duplicate' || newsletterStatus === 'error') {
      const t = setTimeout(() => {
        setNewsletterStatus('idle');
        setNewsletterMessage('');
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [newsletterStatus]);

  const handleQuickPlannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: brief } = await supabase
        .from('journey_briefs')
        .insert({
          destination,
          guest_count: parseInt(guests, 10),
          travel_date: travelDate || null,
          status: 'pending',
        })
        .select()
        .single();

      if (brief) {
        navigate('/planner', { state: { briefId: brief.id } });
      } else {
        navigate('/planner', { state: { destination, guests, travelDate } });
      }
    } catch (err) {
      navigate('/planner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = newsletterEmail.trim();

    if (!trimmedEmail) {
      setNewsletterStatus('error');
      setNewsletterMessage('Please enter your email address.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setNewsletterStatus('error');
      setNewsletterMessage('That email address looks invalid.');
      return;
    }

    setNewsletterStatus('loading');
    setNewsletterMessage('');

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: trimmedEmail,
          source: 'homepage',
          subscribed_at: new Date().toISOString(),
        });

      if (error) {
        // Postgres unique_violation code
        if (error.code === '23505') {
          setNewsletterStatus('duplicate');
          setNewsletterMessage("You're already on the list — thank you!");
        } else {
          throw error;
        }
      } else {
        setNewsletterStatus('success');
        setNewsletterMessage('Welcome aboard! Check your inbox for a confirmation.');
        setNewsletterEmail('');
      }
    } catch (err) {
      console.error('Failed to subscribe to newsletter:', err);
      setNewsletterStatus('error');
      setNewsletterMessage('Something went wrong. Please try again shortly.');
    }
  };

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight * 0.8,
      behavior: 'smooth',
    });
  };

  const activeHero = heroBanners[activeBannerIndex] || {
    badge_text: 'PUTU TRAVELS CONCIERGE',
    title: 'One Trusted Contact. Every Detail Handled.',
    subtitle: 'Curated luxury travel on the Kenyan coast. Tell us your vision and we handle the rest, from arrival to departure.',
    image_url: IMAGES.heroDiani,
    cta_text: 'Explore Experiences',
    cta_link: '/experiences',
  };

  return (
    <div className="w-full overflow-x-hidden bg-sand-50/30">

      {/* Scoped animations */}
      <style>{`
        @keyframes hero-scroll-dot {
          0% { transform: translateY(0); opacity: 1; }
          60% { transform: translateY(10px); opacity: 0.25; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes hero-scroll-nudge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        @keyframes soft-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.06); }
        }
        @keyframes newsletter-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pattern-drift {
          from { background-position: 0 0; }
          to { background-position: 160px 160px; }
        }
        .hero-scroll-dot-animate { animation: hero-scroll-dot 1.8s ease-in-out infinite; }
        .hero-scroll-frame-animate { animation: hero-scroll-nudge 1.8s ease-in-out infinite; }
        .soft-pulse-animate { animation: soft-pulse 4s ease-in-out infinite; }
        .planner-bar:focus-within {
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35);
          transform: translateY(-2px);
        }
        .pillar-index {
          font-family: serif;
          transition: color 0.4s ease, transform 0.4s ease;
        }
        .group:hover .pillar-index {
          transform: translateY(-4px);
        }
        .exp-title-underline {
          display: inline-block;
          position: relative;
        }
        .exp-title-underline::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          height: 1.5px;
          width: 0%;
          background-color: currentColor;
          transition: width 0.35s ease;
        }
        .group:hover .exp-title-underline::after {
          width: 100%;
        }
        .newsletter-feedback {
          animation: newsletter-fade-in 0.3s ease-out;
        }
        .newsletter-input:focus {
          box-shadow: 0 0 0 3px rgba(255,255,255,0.15);
        }
        .teal-pattern-layer {
          animation: pattern-drift 40s linear infinite;
        }
      `}</style>
      
      {/* ----------------- HERO SECTION ----------------- */}
      <section className="relative min-h-[58vh] sm:min-h-[65vh] lg:min-h-[72vh] flex flex-col items-center justify-center bg-cocoa-900 overflow-hidden">
        {loadingHero ? (
          <div className="py-16 sm:py-24 text-center text-sand-200 text-sm font-medium animate-pulse">
            Loading luxury experience...
          </div>
        ) : (
          <>
            {/* Auto Carousel Background Image Stack */}
            <div className="absolute inset-0 z-0">
              {heroBanners.length > 0 ? (
                heroBanners.map((banner, index) => (
                  <div
                    key={banner.id || index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === activeBannerIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                    }`}
                  >
                    <img
                      src={banner.image_url || IMAGES.heroDiani}
                      alt={banner.title}
                      className="w-full h-full object-cover object-center scale-105 transition-transform duration-10000 ease-out"
                    />
                    <div className="absolute inset-0 bg-cocoa-900/65 z-10" />
                  </div>
                ))
              ) : (
                <div className="absolute inset-0">
                  <img
                    src={activeHero.image_url || IMAGES.heroDiani}
                    alt={activeHero.title}
                    className="w-full h-full object-cover object-center scale-105"
                  />
                  <div className="absolute inset-0 bg-cocoa-900/65 z-10" />
                </div>
              )}
            </div>

            {/* Decorative floating accent shapes (purely visual, no gradients) */}
            <div className="pointer-events-none absolute top-10 left-6 w-16 h-16 rounded-full bg-coral-500/20 blur-xl soft-pulse-animate z-10" />
            <div className="pointer-events-none absolute bottom-16 right-10 w-24 h-24 rounded-full bg-sand-200/10 blur-2xl soft-pulse-animate z-10" style={{ animationDelay: '1.5s' }} />

            {/* Main Centered Content */}
            <div className="relative z-20 page-container py-6 sm:py-10 lg:py-12 flex flex-col items-center text-center w-full my-auto">
              <div className="max-w-4xl mx-auto flex flex-col items-center">

                {/* Badge Tag */}
                {activeHero.badge_text && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 bg-coral-500/20 border border-coral-400/30 text-coral-300 text-[10px] sm:text-xs font-bold tracking-widest uppercase rounded-full mb-2 sm:mb-4 backdrop-blur-md hover:bg-coral-500/30 hover:border-coral-400/50 transition-colors duration-300 cursor-default">
                    <Sparkles size={12} className="text-coral-400 sm:w-3.5 sm:h-3.5" />
                    {activeHero.badge_text}
                  </span>
                )}

                {/* Main Heading */}
                <h1 className="font-serif text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.1] tracking-tight max-w-4xl">
                  {activeHero.title}
                </h1>

                {/* Subtitle */}
                {activeHero.subtitle && (
                  <p className="mt-2 sm:mt-3 text-xs sm:text-lg md:text-xl text-sand-100/90 font-light max-w-2xl mx-auto leading-relaxed">
                    {activeHero.subtitle}
                  </p>
                )}

                {/* Quick Journey Planner Bar */}
                <form
                  onSubmit={handleQuickPlannerSubmit}
                  className="planner-bar mt-4 sm:mt-6 w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-white/40 p-2 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-left transition-all duration-300"
                >
                  <div className="relative flex items-center bg-sand-50/80 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200/80 transition-colors duration-300 hover:border-coral-300 focus-within:border-coral-400 focus-within:bg-white">
                    <MapPin size={16} className="text-coral-500 mr-2 shrink-0 sm:w-4.5 sm:h-4.5" />
                    <input
                      type="text"
                      placeholder="Destination (e.g. Diani)"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-transparent text-cocoa-900 text-xs sm:text-sm focus:outline-none font-medium"
                    />
                  </div>

                  <div className="relative flex items-center bg-sand-50/80 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200/80 transition-colors duration-300 hover:border-coral-300 focus-within:border-coral-400 focus-within:bg-white">
                    <Users size={16} className="text-coral-500 mr-2 shrink-0 sm:w-4.5 sm:h-4.5" />
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full bg-transparent text-cocoa-900 text-xs sm:text-sm focus:outline-none font-medium"
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="4">4+ Guests</option>
                      <option value="8">8+ Group</option>
                    </select>
                  </div>

                  <div className="relative flex items-center bg-sand-50/80 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200/80 transition-colors duration-300 hover:border-coral-300 focus-within:border-coral-400 focus-within:bg-white">
                    <Calendar size={16} className="text-coral-500 mr-2 shrink-0 sm:w-4.5 sm:h-4.5" />
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full bg-transparent text-xs sm:text-sm focus:outline-none font-medium text-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-coral-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                  >
                    {isSubmitting ? 'Processing...' : 'Plan Journey'}
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </form>

                {/* CTA Buttons & Auto Carousel Dots */}
                <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  <Link
                    to={activeHero.cta_link || '/experiences'}
                    className="group btn-secondary bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-xs text-xs sm:text-sm py-2.5 sm:py-3.5 px-5 sm:px-7 rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-coral-400/60 inline-flex items-center gap-2"
                  >
                    {activeHero.cta_text || 'Explore Experiences'}
                    <ArrowRight size={14} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>

                  {heroBanners.length > 1 && (
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full border border-white/15">
                      {heroBanners.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveBannerIndex(idx)}
                          className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 ${
                            idx === activeBannerIndex ? 'bg-coral-500 w-5 sm:w-7' : 'bg-white/40 hover:bg-white/80 w-2 sm:w-2.5'
                          }`}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ---------------- ANIMATED MOUSE SCROLL INDICATOR ---------------- */}
                <div
                  onClick={handleScrollDown}
                  className="mt-3 sm:mt-5 group relative flex flex-col items-center cursor-pointer select-none"
                >
                  <div className="hero-scroll-frame-animate relative w-6 h-10 sm:w-7 sm:h-11 rounded-full border-2 border-white/40 group-hover:border-coral-400 bg-white/5 backdrop-blur-md flex justify-center pt-2 transition-colors duration-300 shadow-md group-hover:shadow-coral-500/20 group-hover:scale-105">
                    <div className="hero-scroll-dot-animate w-1 h-2 sm:h-2.5 bg-white/80 group-hover:bg-coral-400 rounded-full transition-colors" />
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </section>
      {/* ----------------- DYNAMIC PILLARS GRID ----------------- */}
      <section className="page-container py-10 sm:py-16 lg:py-24">
        {loadingPillars ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 sm:h-48 bg-slate-200/60 animate-pulse rounded-2xl sm:rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {pillars.map((pillar, index) => {
              const ContextIcon = getContextualIcon(pillar.title, pillar.icon_name);
              const isFirst = index === 0;

              return (
                <div
                  key={pillar.id}
                  className="group relative bg-white p-5 sm:p-7 lg:p-9 rounded-2xl sm:rounded-3xl border border-sand-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] sm:shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 sm:hover:-translate-y-2 hover:border-coral-200 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden"
                >
                  {/* Decorative index number */}
                  <span className="pillar-index absolute -top-1 right-4 text-4xl sm:text-6xl font-serif text-sand-100 select-none group-hover:text-coral-50">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="relative">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ${
                        isFirst
                          ? 'bg-coral-500 text-white shadow-md shadow-coral-500/20'
                          : 'bg-coral-50/80 text-coral-500 border border-coral-100/60'
                      }`}
                    >
                      <ContextIcon size={20} strokeWidth={2} className="sm:w-5 sm:h-5" />
                    </div>

                    <h3 className="font-serif text-lg sm:text-xl lg:text-2xl font-semibold text-cocoa-900 tracking-tight group-hover:text-coral-600 transition-colors duration-300">
                      {pillar.title}
                    </h3>

                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Bottom accent bar that reveals on hover */}
                  <div className="absolute bottom-0 left-0 h-1 bg-coral-500 w-0 group-hover:w-full transition-all duration-500 ease-out" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ----------------- FEATURED EXPERIENCES ----------------- */}
      <section className="bg-sand-100/60 py-10 sm:py-16 lg:py-24 border-y border-sand-200/80">
        <div className="page-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10 lg:mb-14">
            <div>
              <p className="text-coral-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                Handpicked Coastal Stays & Tours
              </p>
              <h2 className="section-title">Featured Coastal Experiences</h2>
            </div>
            <Link
              to="/experiences"
              className="group text-xs sm:text-sm font-bold text-coral-600 hover:text-coral-700 inline-flex items-center gap-1.5 transition-colors"
            >
              View all experiences
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingExps ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 sm:h-96 bg-slate-200/70 animate-pulse rounded-2xl sm:rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {featuredExperiences.map((exp) => (
                <div
                  key={exp.id}
                  className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-sand-200/80 shadow-xs hover:shadow-2xl hover:-translate-y-1.5 hover:border-coral-200 transition-all duration-500 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-48 sm:h-56 lg:h-64 overflow-hidden relative">
                      <img
                        src={exp.image_url || IMAGES.snorkelCoral}
                        alt={exp.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-cocoa-900/0 group-hover:bg-cocoa-900/15 transition-colors duration-500" />
                      <span className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-cocoa-900/80 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-md group-hover:bg-coral-500 group-hover:scale-105 transition-all duration-300">
                        ${exp.price} / person
                      </span>
                    </div>

                    <div className="p-4 sm:p-6 lg:p-7">
                      <span className="text-[10px] sm:text-[11px] font-bold text-coral-600 uppercase tracking-widest inline-flex items-center gap-1">
                        <MapPin size={11} />
                        {exp.location}
                      </span>
                      <h3 className="font-serif text-base sm:text-lg lg:text-xl font-semibold text-cocoa-900 mt-1 group-hover:text-coral-600 transition-colors">
                        <span className="exp-title-underline">{exp.title}</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
                    <Link
                      to={`/planner?experienceId=${exp.id}`}
                      className="btn-secondary w-full text-center flex items-center justify-center gap-1.5 text-xs py-2.5 sm:py-3 rounded-xl hover:bg-coral-500 hover:text-white hover:border-coral-500 transition-colors duration-300 font-medium"
                    >
                      Include in Journey Brief
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----------------- DESTINATIONS GRID ----------------- */}
      <section className="py-10 sm:py-16 lg:py-24">
        <div className="page-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10 lg:mb-14">
            <div>
              <h2 className="section-title">Destinations</h2>
              <p className="section-subtitle mt-1">Discover pristine coastlines and iconic stays across Kenya.</p>
            </div>
            <Link
              to="/destinations"
              className="group text-xs sm:text-sm font-bold text-coral-600 hover:text-coral-700 inline-flex items-center gap-1.5"
            >
              View all destinations
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingDests ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 sm:h-64 bg-slate-200/70 animate-pulse rounded-2xl sm:rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {destinations.map((dest) => (
                <Link
                  key={dest.id}
                  to="/destinations"
                  className="group relative rounded-2xl sm:rounded-3xl overflow-hidden h-56 sm:h-72 lg:h-80 block shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                >
                  <img
                    src={dest.image_url || IMAGES.heroDiani}
                    alt={dest.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-cocoa-900/40 group-hover:bg-cocoa-900/60 transition-colors duration-300" />

                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 border border-white/30 backdrop-blur-md flex items-center justify-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                    <ArrowRight size={16} className="text-white -rotate-45" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 lg:p-8 text-white transform group-hover:-translate-y-1 transition-transform duration-300 z-10">
                    <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold">{dest.name}</h3>
                    <p className="text-xs sm:text-sm text-sand-200 mt-1.5 sm:mt-2 line-clamp-2 opacity-90 leading-relaxed">
                      {dest.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----------------- CALL TO ACTION BANNER (now above the newsletter) ----------------- */}
      <section className="page-container pt-10 sm:pt-16 lg:pt-24 pb-6 sm:pb-8">
        <div className="group relative bg-blue-400 rounded-2xl sm:rounded-3xl p-6 sm:p-12 md:p-16 text-center overflow-hidden shadow-2xl transition-shadow duration-500 hover:shadow-coral-500/10">
          {/* Decorative solid-color accents (no gradients) */}
          <div className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full bg-coral-500/10 transition-transform duration-700 group-hover:scale-125" />
          <div className="pointer-events-none absolute -bottom-14 -right-14 w-56 h-56 rounded-full bg-sand-200/5 transition-transform duration-700 group-hover:scale-110" />

          <div className="relative z-10">
            <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight">
              Ready to plan your coastal escape?
            </h2>
            <p className="mt-3 sm:mt-4 text-sand-200 max-w-lg mx-auto text-xs sm:text-base font-light leading-relaxed">
              Share your vision and receive a tailored, personalized proposal from our concierge team within 24 hours.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4 justify-center">
              <Link to="/planner" className="btn-primary py-2.5 sm:py-3 px-6 sm:px-8 text-xs sm:text-sm font-semibold shadow-lg hover:-translate-y-0.5 hover:shadow-coral-500/30 transition-all duration-300">
                Plan Your Journey
              </Link>
              <Link
                to="/contact"
                className="btn-secondary bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-coral-400/60 hover:-translate-y-0.5 text-xs sm:text-sm py-2.5 sm:py-3 px-6 sm:px-8 transition-all duration-300"
              >
                Talk to a Concierge
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}