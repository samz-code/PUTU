import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Heart, Target, Users, Award, Download, 
  ShoppingBag, Shirt, Coffee, StickyNote, Package, Laptop, Compass, Home, LayoutGrid 
} from 'lucide-react';
import { IMAGES } from '@/lib/images';
import { supabase } from '@/lib/supabase';

// Map icon names from database strings to Lucide components
const VALUE_ICONS: Record<string, React.ElementType> = {
  Heart,
  Target,
  Users,
  Award,
};

const merchCategories = [
  { key: 'all', label: 'All Products', icon: LayoutGrid },
  { key: 'apparel', label: 'Apparel', icon: Shirt },
  { key: 'bags', label: 'Bags', icon: ShoppingBag },
  { key: 'drinkware', label: 'Drinkware', icon: Coffee },
  { key: 'stationery', label: 'Stationery', icon: StickyNote },
  { key: 'tech', label: 'Tech Accessories', icon: Laptop },
  { key: 'travel', label: 'Travel Essentials', icon: Compass },
  { key: 'home', label: 'Home & Living', icon: Home },
] as const;

// Default Static Fallback Data
const DEFAULT_CONTENT = {
  hero_title: 'About Putu Travels',
  hero_subtitle: 'A digital luxury travel concierge, not just a booking platform.',
  story_heading: 'Our Story',
  story_p1: 'Putu Travels was founded on a simple belief: travel should feel personal. On the Kenyan coast, where the options are endless and the details matter, travelers need one trusted contact who handles everything.',
  story_p2: 'We are not a booking engine. We are a concierge. We gather a detailed brief, prepare a personalized proposal, coordinate a vetted network of partners, and manage the journey from arrival to departure.',
  story_p3: 'Every hotel, every driver, every restaurant, every guide in our network is someone we trust. That trust is what we pass on to you.',
  story_image: IMAGES.conciergeReception,
};

const DEFAULT_VALUES = [
  { icon_name: 'Heart', title: 'Personal', desc: 'Every proposal is curated from your brief, not generated.' },
  { icon_name: 'Target', title: 'Precise', desc: 'Every detail coordinated, from pickup time to dietary needs.' },
  { icon_name: 'Users', title: 'Trusted', desc: 'A vetted partner network we have built over years.' },
  { icon_name: 'Award', title: 'Quality', desc: 'We hold our partners to the standard you expect.' },
];

const DEFAULT_LOGOS = [
  { name: 'Primary Logo', file_name: 'putu-logo-primary.svg', bg_class: 'bg-white', preview_url: '/brand/logo-primary.png' },
  { name: 'Reversed Logo', file_name: 'putu-logo-reversed.svg', bg_class: 'bg-cocoa-700', preview_url: '/brand/logo-reversed.png' },
  { name: 'Icon Mark', file_name: 'putu-icon-mark.svg', bg_class: 'bg-sand-100', preview_url: '/brand/logo-icon.png' },
];

const DEFAULT_MERCH = [
  { category: 'apparel', name: 'Crew T-Shirt', price: 'KSh 1,800', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
  { category: 'apparel', name: 'Polo Shirt', price: 'KSh 2,600', image_url: 'https://images.unsplash.com/photo-1625910513411-5ed006731170?auto=format&fit=crop&w=600&q=80' },
  { category: 'apparel', name: 'Baseball Cap', price: 'KSh 1,500', image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80' },
  { category: 'apparel', name: 'Zip Hoodie', price: 'KSh 3,400', image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80' },
  { category: 'bags', name: 'Canvas Tote', price: 'KSh 2,000', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80' },
  { category: 'bags', name: 'Weekend Duffel', price: 'KSh 4,500', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80' },
  { category: 'drinkware', name: 'Steel Water Bottle', price: 'KSh 2,200', image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80' },
  { category: 'stationery', name: 'Journey Notebook', price: 'KSh 1,000', image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
  { category: 'tech', name: 'Wireless Power Bank', price: 'KSh 3,800', image_url: 'https://images.unsplash.com/photo-1609592424104-97d4c42c755f?auto=format&fit=crop&w=600&q=80' },
  { category: 'travel', name: 'Leather Passport Holder', price: 'KSh 1,600', image_url: 'https://images.unsplash.com/photo-1553531384-cc6acaf8893d?auto=format&fit=crop&w=600&q=80' },
  { category: 'home', name: 'Coastal Scented Candle', price: 'KSh 1,800', image_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80' },
];

export default function About() {
  // Default active category to 'all' so users immediately see all items
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Database States
  const [aboutContent, setAboutContent] = useState(DEFAULT_CONTENT);
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [logoAssets, setLogoAssets] = useState(DEFAULT_LOGOS);
  const [merchItems, setMerchItems] = useState(DEFAULT_MERCH);

  useEffect(() => {
    async function loadAboutData() {
      try {
        // Fetch Main Content
        const { data: contentData } = await supabase.from('about_content').select('*').limit(1).single();
        if (contentData) {
          setAboutContent({
            hero_title: contentData.hero_title || DEFAULT_CONTENT.hero_title,
            hero_subtitle: contentData.hero_subtitle || DEFAULT_CONTENT.hero_subtitle,
            story_heading: contentData.story_heading || DEFAULT_CONTENT.story_heading,
            story_p1: contentData.story_p1 || DEFAULT_CONTENT.story_p1,
            story_p2: contentData.story_p2 || DEFAULT_CONTENT.story_p2,
            story_p3: contentData.story_p3 || DEFAULT_CONTENT.story_p3,
            story_image: contentData.story_image || DEFAULT_CONTENT.story_image,
          });
        }

        // Fetch Core Values
        const { data: valuesData } = await supabase.from('about_values').select('*').order('display_order', { ascending: true });
        if (valuesData && valuesData.length > 0) {
          setValues(valuesData.map((item) => ({
            icon_name: item.icon_name || 'Heart',
            title: item.title,
            desc: item.description || item.desc || '',
          })));
        }

        // Fetch Brand Assets
        const { data: brandData } = await supabase.from('about_brand_assets').select('*').order('display_order', { ascending: true });
        if (brandData && brandData.length > 0) {
          setLogoAssets(brandData.map((item) => ({
            name: item.name,
            file_name: item.file_name || item.file || '',
            bg_class: item.bg_class || item.bg || 'bg-white',
            preview_url: item.preview_url || item.preview || '',
          })));
        }

        // Fetch Merchandise Products
        const { data: merchData } = await supabase.from('about_merchandise').select('*').order('display_order', { ascending: true });
        if (merchData && merchData.length > 0) {
          setMerchItems(merchData.map((item) => ({
            category: item.category,
            name: item.name,
            price: item.price,
            image_url: item.image_url || item.image || '',
          })));
        }
      } catch (error) {
        console.error('Error fetching about data:', error);
      }
    }

    loadAboutData();
  }, []);

  // Filter merchandise items: show all items if 'all' is selected
  const activeProducts = activeCategory === 'all' 
    ? merchItems 
    : merchItems.filter((p) => p.category === activeCategory);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-sand-100 py-16 border-b border-sand-200">
        <div className="page-container">
          <h1 className="font-serif text-4xl font-semibold text-cocoa-700">{aboutContent.hero_title}</h1>
          <p className="mt-3 text-slate-500 max-w-xl">{aboutContent.hero_subtitle}</p>
        </div>
      </section>

      {/* Story Section */}
      <section className="page-container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-xl overflow-hidden shadow-card-lg">
            <img src={aboutContent.story_image} alt="Concierge" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="section-title">{aboutContent.story_heading}</h2>
            {aboutContent.story_p1 && <p className="mt-4 text-slate-600 leading-relaxed">{aboutContent.story_p1}</p>}
            {aboutContent.story_p2 && <p className="mt-4 text-slate-600 leading-relaxed">{aboutContent.story_p2}</p>}
            {aboutContent.story_p3 && <p className="mt-4 text-slate-600 leading-relaxed">{aboutContent.story_p3}</p>}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-sand-100 py-16">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="section-title">What We Stand For</h2>
            <p className="section-subtitle">The principles behind every journey we arrange.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => {
              const IconComponent = VALUE_ICONS[v.icon_name] || Heart;
              return (
                <div key={v.title} className="card p-6 text-center">
                  <div className="w-12 h-12 rounded-lg bg-coral-50 flex items-center justify-center mx-auto mb-4">
                    <IconComponent size={22} className="text-coral-600" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-cocoa-700">{v.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Brand Assets */}
      <section className="page-container py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="section-title">Our Brand Assets</h2>
            <p className="section-subtitle">Logos and marks, cleared for partner and press use.</p>
          </div>
          <a
            href="/brand/putu-brand-kit.zip"
            download
            className="inline-flex items-center gap-2 rounded-md border border-teal-700 text-teal-700 font-semibold py-2.5 px-5 text-sm hover:bg-teal-50 transition-colors duration-150 flex-shrink-0"
          >
            <Download size={16} /> Download Full Kit
          </a>
        </div>

        {/* Scaled brand assets layout with creative pattern background overlay */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {logoAssets.map((logo) => (
            <div key={logo.name} className="card overflow-hidden shadow-card hover:shadow-card-lg transition-shadow border border-sand-200">
              <div className={`${logo.bg_class} relative h-60 sm:h-72 p-6 flex items-center justify-center overflow-hidden`}>
                {/* Pattern Overlay from public/pattern.png */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none bg-repeat"
                  style={{ 
                    backgroundImage: "url('/pattern.png')",
                    backgroundSize: '140px auto'
                  }}
                />
                
                <img 
                  src={logo.preview_url} 
                  alt={logo.name} 
                  className="relative z-10 max-h-44 max-w-[85%] w-auto object-contain transition-transform duration-200 hover:scale-105" 
                />
              </div>
              <div className="p-5 flex items-center justify-between gap-3 border-t border-sand-200 bg-white relative z-10">
                <h3 className="font-serif text-base font-semibold text-cocoa-700">{logo.name}</h3>
                <a
                  href={logo.preview_url || `/brand/${logo.file_name}`}
                  download={logo.file_name}
                  className="flex items-center gap-1.5 text-sm font-medium text-coral-600 hover:text-coral-700 transition-colors duration-150"
                >
                  <Download size={14} /> SVG
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Please keep clear space around the mark and don't recolor, stretch, or add effects to the logo.
        </p>
      </section>

      {/* Merchandise & Company Assets */}
      <section className="bg-sand-100 py-16">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="section-title">Merchandise &amp; Company Assets</h2>
            <p className="section-subtitle">Branded items our team and partners use day to day. Pick a category to filter or browse all items.</p>
          </div>

          {/* Category tabs (including All Products) */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {merchCategories.map((c) => {
              const isActive = c.key === activeCategory;
              return (
                <button
                  key={c.key}
                  onClick={() => setActiveCategory(c.key)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-coral-600 text-white'
                      : 'bg-white text-slate-600 border border-sand-200 hover:border-coral-300 hover:text-cocoa-700'
                  }`}
                >
                  <c.icon size={16} />
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeProducts.map((p) => (
              <div key={p.name} className="card overflow-hidden">
                <div className="h-48 overflow-hidden bg-white">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-base font-semibold text-cocoa-700">{p.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{p.price}</p>
                  <a
                    href={`https://wa.me/254714446328?text=${encodeURIComponent(`Hi Putu Travels, I'd like to order the ${p.name}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-coral-600 hover:text-coral-700 transition-colors duration-150"
                  >
                    Shop Now <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="card mt-8 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-coral-50 flex items-center justify-center flex-shrink-0">
                <Package size={22} className="text-coral-600" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-serif text-base font-semibold text-cocoa-700">Need something for an event or partner order?</h3>
                <p className="text-sm text-slate-500 mt-0.5">Request merchandise or templates from our team directly.</p>
              </div>
            </div>
            <a
              href="https://wa.me/254714446328?text=Hi%20Putu%20Travels%2C%20I%27d%20like%20to%20request%20merchandise%20for%20an%20event%20or%20partner%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-coral-600 hover:bg-coral-700 text-white font-semibold py-2.5 px-5 text-sm transition-colors duration-150 flex-shrink-0 inline-flex items-center gap-2"
            >
              Request Assets <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="page-container py-16">
        <div className="bg-cocoa-700 rounded-2xl p-10 md:p-16 text-center">
          <h2 className="font-serif text-3xl font-semibold text-white">Experience the difference</h2>
          <p className="mt-4 text-sand-300 max-w-xl mx-auto">Let us handle your next journey on the Kenyan coast.</p>
          <Link to="/planner" className="btn-primary mt-8">Plan Your Journey <ArrowRight size={16} /></Link>
        </div>
      </section>
    </div>
  );
}