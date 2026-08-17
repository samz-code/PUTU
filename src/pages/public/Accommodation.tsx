import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Wifi, 
  Waves, 
  Dumbbell, 
  Sparkles, 
  Accessibility, 
  Utensils, 
  Eye, 
  MapPin, 
  Star, 
  Check, 
  X, 
  Bed, 
  Users, 
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  PlusCircle
} from 'lucide-react';
import { IMAGES } from '@/lib/images';

export interface AccommodationProperty {
  id: string;
  name: string;
  type: 'Resort' | 'Villa' | 'Boutique Hotel' | 'Apartment' | 'Hotel';
  location: string;
  priceRange: string;
  rating: number;
  reviewsCount: number;
  img: string;
  tagline: string;
  desc: string;
  capacity: string;
  bedrooms: string;
  amenities: string[];
  highlights: string[];
  featured?: boolean;
}

const ACCOMMODATIONS: AccommodationProperty[] = [
  {
    id: 'swahili-beach-resort',
    name: 'Swahili Beach Luxury Resort',
    type: 'Resort',
    location: 'Diani Beach',
    priceRange: '$280 - $550 / night',
    rating: 4.9,
    reviewsCount: 58,
    img: IMAGES.resortPoolOcean,
    tagline: 'Cascading multi-tier pools and authentic Swahili-Arabesque architecture.',
    desc: 'Set on the prime stretch of Diani Beach, this award-winning resort offers cascading infinity pools, world-class dining, and traditional Swahili craftsmanship elevated to modern luxury.',
    capacity: '2 - 4 Guests per Suite',
    bedrooms: '1 - 2 Bedrooms',
    amenities: ['Beachfront', 'Ocean View', 'Swimming Pool', 'Spa', 'WiFi', 'Gym', 'Meal Plan'],
    highlights: ['7-tier cascading pool', 'Private butler service available', 'Direct white-sand beach access', 'On-site seafood restaurant'],
    featured: true
  },
  {
    id: 'ocean-pearl-villa',
    name: 'Ocean Pearl Private Villa',
    type: 'Villa',
    location: 'Watamu',
    priceRange: '$450 - $900 / night',
    rating: 5.0,
    reviewsCount: 34,
    img: IMAGES.resortTropical,
    tagline: 'Exclusive beachfront sanctuary with full private staff and private chef.',
    desc: 'An ultra-private beachfront villa surrounded by tropical gardens in Watamu. Comes complete with a dedicated chef, butler, and private infinity pool overlooking the marine reserve.',
    capacity: 'Up to 8 Guests',
    bedrooms: '4 Bedrooms',
    amenities: ['Beachfront', 'Ocean View', 'Swimming Pool', 'Spa', 'WiFi', 'Meal Plan', 'Accessibility'],
    highlights: ['Personal gourmet chef included', 'Private freshwater pool', 'Direct coral garden snorkeling', '24/7 security & butler'],
    featured: true
  },
  {
    id: 'lamu-heritage-house',
    name: 'Lamu Heritage Collection',
    type: 'Boutique Hotel',
    location: 'Lamu Island',
    priceRange: '$220 - $420 / night',
    rating: 4.8,
    reviewsCount: 42,
    img: IMAGES.resortLagoon,
    tagline: 'Restored 18th-century Swahili mansion with private courtyard pool.',
    desc: 'Experience timeless coastal elegance in the heart of Shela, Lamu. Intimate boutique rooms featuring carved wooden doors, coral rag walls, and rooftop dining under the stars.',
    capacity: '2 Guests per Room',
    bedrooms: '1 Bedroom Suites',
    amenities: ['Ocean View', 'Swimming Pool', 'WiFi', 'Meal Plan', 'Spa'],
    highlights: ['Authentic Swahili architecture', 'Rooftop sunset dining', 'Dhow boat harbor transfers', 'Quiet Shela village setting'],
    featured: true
  },
  {
    id: 'kilifi-creek-estate',
    name: 'Kilifi Creek Estate & Suites',
    type: 'Villa',
    location: 'Kilifi',
    priceRange: '$380 - $750 / night',
    rating: 4.9,
    reviewsCount: 29,
    img: IMAGES.resortBaliPool,
    tagline: 'Clifftop retreat overlooking Kilifi Creek with yacht moorings.',
    desc: 'Perched high above the azure waters of Kilifi Creek, offering panoramic water views, secluded garden pavilions, and immediate access to deep-sea fishing and sailing.',
    capacity: 'Up to 10 Guests',
    bedrooms: '5 Bedrooms',
    amenities: ['Ocean View', 'Swimming Pool', 'WiFi', 'Gym', 'Meal Plan'],
    highlights: ['Deep water yacht dock', 'Private cliffside infinity pool', 'Organic farm-to-table dining', 'Sunset sailing boat included'],
    featured: false
  },
  {
    id: 'diani-sands-apartments',
    name: 'Diani Sands Executive Residences',
    type: 'Apartment',
    location: 'Diani Beach',
    priceRange: '$180 - $320 / night',
    rating: 4.7,
    reviewsCount: 51,
    img: IMAGES.resortAerial,
    tagline: 'Modern self-catering apartments with resort amenities and beach access.',
    desc: 'Spacious 2 and 3-bedroom serviced apartments combining independence with resort luxury. Perfect for families or extended coastal stays.',
    capacity: '4 - 6 Guests',
    bedrooms: '2 - 3 Bedrooms',
    amenities: ['Beachfront', 'Swimming Pool', 'WiFi', 'Accessibility', 'Gym'],
    highlights: ['Fully equipped designer kitchens', 'Daily housekeeping', 'Shared lagoon pool', 'Walking distance to beach clubs'],
    featured: false
  },
  {
    id: 'msambweni-cliff-house',
    name: 'Msambweni Clifftop Lodge',
    type: 'Boutique Hotel',
    location: 'Msambweni',
    priceRange: '$520 - $980 / night',
    rating: 5.0,
    reviewsCount: 19,
    img: IMAGES.resortPoolOcean,
    tagline: 'Unmatched solitude on an unspoiled cliffside along the south coast.',
    desc: 'Total tranquility and privacy set on an untouched stretch of southern coast. Features private infinity plunge pools, private beach access, and personalized dining on the beach.',
    capacity: '2 Guests',
    bedrooms: '1 Luxury Villa Suite',
    amenities: ['Beachfront', 'Ocean View', 'Swimming Pool', 'Spa', 'WiFi', 'Meal Plan'],
    highlights: ['Isolated private beach cove', 'Private cliffside massage deck', 'Candlelit beach dinners', 'Helipad on site'],
    featured: false
  }
];

const PROPERTY_TYPES = ['All', 'Resort', 'Villa', 'Boutique Hotel', 'Apartment'];
const LOCATIONS = ['All', 'Diani Beach', 'Watamu', 'Lamu Island', 'Kilifi', 'Msambweni'];

const AMENITY_ICONS: Record<string, any> = {
  'Beachfront': Waves,
  'Ocean View': Eye,
  'Swimming Pool': Waves,
  'Spa': Sparkles,
  'WiFi': Wifi,
  'Gym': Dumbbell,
  'Meal Plan': Utensils,
  'Accessibility': Accessibility,
};

export default function Accommodation() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [quickViewProperty, setQuickViewProperty] = useState<AccommodationProperty | null>(null);

  // Filter logic
  const filteredProperties = ACCOMMODATIONS.filter((item) => {
    const matchesType = selectedType === 'All' || item.type === selectedType;
    const matchesLocation = selectedLocation === 'All' || item.location === selectedLocation;
    return matchesType && matchesLocation;
  });

  const handleSelectProperty = (property: AccommodationProperty) => {
    // Navigate to journey planner with pre-selected property
    navigate('/planner', { state: { selectedAccommodation: property } });
  };

  return (
    <div className="bg-sand-50 min-h-screen pb-16">
      
      {/* Hero Header */}
      <section className="bg-sand-100 py-10 sm:py-16 border-b border-sand-200/80">
        <div className="page-container">
          <div className="max-w-2xl">
            <span className="text-coral-600 font-semibold text-xs uppercase tracking-widest bg-coral-50 border border-coral-200/60 px-3 py-1 rounded-full">
              Curated Stays
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-cocoa-900 tracking-tight mt-3">
              Coastal Accommodation
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              From secluded beachfront villas with private chefs to iconic five-star resorts. Every property is personally vetted to ensure total luxury and effortless comfort.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm py-3 sm:py-4">
        <div className="page-container flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Property Types horizontal scroll */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <SlidersHorizontal size={14} /> Type:
            </span>
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedType === type
                    ? 'bg-cocoa-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Location filter */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="locationSelect" className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Location:
            </label>
            <select
              id="locationSelect"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-slate-100 border border-slate-200/80 text-xs sm:text-sm font-semibold text-cocoa-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-coral-500/20"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === 'All' ? 'All Locations' : loc}
                </option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* Property Cards Grid */}
      <section className="page-container py-8 sm:py-12">
        
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            Showing <span className="text-cocoa-900 font-bold">{filteredProperties.length}</span> curated properties
          </p>
          {(selectedType !== 'All' || selectedLocation !== 'All') && (
            <button
              onClick={() => { setSelectedType('All'); setSelectedLocation('All'); }}
              className="text-xs font-semibold text-coral-600 hover:text-coral-700 underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProperties.map((property) => (
            <div 
              key={property.id} 
              className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              
              {/* Card Image Header */}
              <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-100">
                <img 
                  src={property.img} 
                  alt={property.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="bg-white/90 backdrop-blur-md text-cocoa-900 font-bold text-[11px] px-2.5 py-1 rounded-lg shadow-sm">
                    {property.type}
                  </span>
                  {property.featured && (
                    <span className="bg-coral-500 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                      <Sparkles size={12} /> Featured
                    </span>
                  )}
                </div>

                {/* Location & Rating overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
                  <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                    <MapPin size={13} className="text-coral-400" /> {property.location}
                  </span>
                  <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg font-bold text-amber-300">
                    <Star size={13} className="fill-amber-300" /> {property.rating} ({property.reviewsCount})
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                
                <div>
                  <h3 className="font-serif text-xl font-bold text-cocoa-900 group-hover:text-coral-600 transition-colors">
                    {property.name}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {property.tagline}
                  </p>
                </div>

                {/* Capacity & Price */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Bed size={14} className="text-slate-400" /> {property.bedrooms}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Users size={14} className="text-slate-400" /> {property.capacity}
                    </span>
                  </div>
                </div>

                {/* Key Amenities */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {property.amenities.slice(0, 4).map((a) => {
                    const IconComponent = AMENITY_ICONS[a] || ShieldCheck;
                    return (
                      <span key={a} className="inline-flex items-center gap-1 bg-sand-100 text-cocoa-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-md">
                        <IconComponent size={12} className="text-teal-600" /> {a}
                      </span>
                    );
                  })}
                  {property.amenities.length > 4 && (
                    <span className="text-[11px] font-semibold text-slate-400 px-1 py-0.5">
                      +{property.amenities.length - 4} more
                    </span>
                  )}
                </div>

                {/* Price Estimate & Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Estimated Rate</span>
                    <span className="text-xs sm:text-sm font-bold text-cocoa-900">{property.priceRange}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuickViewProperty(property)}
                      className="p-2 text-slate-600 hover:text-cocoa-900 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Quick Preview"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleSelectProperty(property)}
                      className="px-3.5 py-2 bg-cocoa-800 hover:bg-cocoa-900 text-white font-semibold text-xs rounded-xl shadow-sm transition-all duration-200 flex items-center gap-1.5 active:scale-95"
                    >
                      <span>Select Stay</span>
                      <PlusCircle size={14} />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>

      </section>

      {/* Preferences Section */}
      <section className="bg-sand-100 py-12 sm:py-16 border-y border-sand-200">
        <div className="page-container">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-900">
              Preferences We Custom Match
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              Specify your exact requirements when planning your journey brief, and our concierge team will ensure your stay fits every detail.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(AMENITY_ICONS).map(([label, Icon]) => (
              <div key={label} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 flex flex-col items-center text-center gap-2 shadow-sm hover:border-teal-500/40 transition-all duration-200">
                <div className="p-2.5 bg-teal-50 rounded-xl text-teal-700">
                  <Icon size={22} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-cocoa-900">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner Call To Action */}
      <section className="page-container py-10 sm:py-14">
        <div className="bg-gradient-to-r from-cocoa-800 to-cocoa-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Tailored Coastal Luxury</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">
              Looking for something specific?
            </h3>
            <p className="text-xs sm:text-sm text-sand-200 leading-relaxed">
              We coordinate private islands, full-resort takeovers, and non-listed luxury estates. Add your exact requirements directly to your journey brief.
            </p>
          </div>
          <Link 
            to="/planner" 
            className="w-full md:w-auto px-6 py-3.5 bg-coral-500 hover:bg-coral-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <span>Plan Your Custom Stay</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            
            {/* Modal Image Header */}
            <div className="relative h-60 sm:h-72 bg-slate-100 shrink-0">
              <img 
                src={quickViewProperty.img} 
                alt={quickViewProperty.name} 
                className="w-full h-full object-cover" 
              />
              <button
                onClick={() => setQuickViewProperty(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg font-bold">
                  {quickViewProperty.type} • {quickViewProperty.location}
                </span>
                <span className="bg-amber-400 text-slate-900 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                  <Star size={12} className="fill-slate-900" /> {quickViewProperty.rating} Rating
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 flex-1">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-cocoa-900">
                  {quickViewProperty.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  {quickViewProperty.tagline}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-sand-50 p-4 rounded-xl border border-sand-200/80 text-xs text-cocoa-900">
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Capacity</span>
                  <span className="font-semibold">{quickViewProperty.capacity}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Bedrooms</span>
                  <span className="font-semibold">{quickViewProperty.bedrooms}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-sand-200/60">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Estimated Price</span>
                  <span className="font-bold text-sm text-cocoa-900">{quickViewProperty.priceRange}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-cocoa-900 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {quickViewProperty.desc}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-cocoa-900 uppercase tracking-wider mb-2">Property Highlights</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickViewProperty.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <Check size={14} className="text-teal-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setQuickViewProperty(null)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const prop = quickViewProperty;
                    setQuickViewProperty(null);
                    handleSelectProperty(prop);
                  }}
                  className="px-5 py-2.5 bg-cocoa-800 hover:bg-cocoa-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <span>Add to Journey Brief</span>
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}