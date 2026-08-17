import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Calendar, BedDouble, Car, Compass, Utensils, Sparkles, Wallet,
  ArrowRight, ArrowLeft, Check, PartyPopper, Plus, Minus, ChevronDown, Search,
  Info, CheckCircle2, ShieldCheck, Clock, AlertTriangle, X, MapPin, Heart
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Header from '@/components/Navbar';
import Footer from '@/components/Footer';

// Expanded 9-Step Configuration for Comprehensive Journey Briefs
const steps = [
  { num: 1, label: 'Guest', icon: User, desc: 'Personal details & occasion' },
  { num: 2, label: 'Travel', icon: Calendar, desc: 'Dates, duration & flexibility' },
  { num: 3, label: 'Destinations', icon: MapPin, desc: 'Regions, stops & multi-city' },
  { num: 4, label: 'Stay', icon: BedDouble, desc: 'Properties, rooms & view preferences' },
  { num: 5, label: 'Transport', icon: Car, desc: 'Fleet style, chauffeuring & transfers' },
  { num: 6, label: 'Experiences', icon: Compass, desc: 'Safaris, marine & cultural tours' },
  { num: 7, label: 'Dining', icon: Utensils, desc: 'Dietary profiles & private chef setups' },
  { num: 8, label: 'Special', icon: Sparkles, desc: 'Bespoke celebrations & concierge notes' },
  { num: 9, label: 'Investment', icon: Wallet, desc: 'Budget tier & secure payment preference' },
];

const WORLD_COUNTRIES = [
  { name: 'Kenya', code: 'KE', nationality: 'Kenyan' },
  { name: 'United States', code: 'US', nationality: 'American' },
  { name: 'United Kingdom', code: 'GB', nationality: 'British' },
  { name: 'Germany', code: 'DE', nationality: 'German' },
  { name: 'Uganda', code: 'UG', nationality: 'Ugandan' },
  { name: 'Tanzania', code: 'TZ', nationality: 'Tanzanian' },
  { name: 'France', code: 'FR', nationality: 'French' },
  { name: 'Italy', code: 'IT', nationality: 'Italian' },
  { name: 'Canada', code: 'CA', nationality: 'Canadian' },
  { name: 'Australia', code: 'AU', nationality: 'Australian' },
  { name: 'South Africa', code: 'ZA', nationality: 'South African' },
  { name: 'United Arab Emirates', code: 'AE', nationality: 'Emirati' },
  { name: 'India', code: 'IN', nationality: 'Indian' },
  { name: 'Switzerland', code: 'CH', nationality: 'Swiss' },
  { name: 'Netherlands', code: 'NL', nationality: 'Dutch' },
  { name: 'China', code: 'CN', nationality: 'Chinese' },
  { name: 'Japan', code: 'JP', nationality: 'Japanese' },
  { name: 'Spain', code: 'ES', nationality: 'Spanish' },
  { name: 'Nigeria', code: 'NG', nationality: 'Nigerian' },
  { name: 'Rwanda', code: 'RW', nationality: 'Rwandan' },
  { name: 'Ethiopia', code: 'ET', nationality: 'Ethiopian' },
  { name: 'Sweden', code: 'SE', nationality: 'Swedish' },
  { name: 'Norway', code: 'NO', nationality: 'Norwegian' },
  { name: 'Denmark', code: 'DK', nationality: 'Danish' },
  { name: 'Brazil', code: 'BR', nationality: 'Brazilian' },
  { name: 'Saudi Arabia', code: 'SA', nationality: 'Saudi' },
];

const occasions = ['Anniversary', 'Honeymoon', 'Birthday Celebration', 'Family Holiday', 'Corporate Retreat', 'Solai Kenya Experience', 'Solo Leisure Getaway'];
const arrivalPoints = ['Moi Int. Airport (MBA)', 'Vipingo Airstrip', 'SGR Mariakani / Miritini', 'Wilson Airport (WIL) Charter', 'Private Yacht Marina'];
const departurePoints = ['Moi Int. Airport (MBA)', 'Vipingo Airstrip', 'SGR Station', 'Hotel Private Transfer', 'Mombasa Port'];
const destinationsList = ['Diani Beach', 'Watamu Marine Park', 'Malindi Historic Town', 'Vipingo Ridge Golf Estate', 'Mombasa North Coast (Nyali / Shanzu)', 'Tsavo East Safari Extension', 'Solai Conservancy'];
const propertyTypes = ['Ultra-Luxury Beach Villa', '5-Star Resort & Spa', 'Boutique Eco Lodge', 'Private Island Sanctuary', 'Private Serviced Penthouse', 'Championship Golf Villa'];
const accommodationAmenities = ['Direct Beachfront Access', 'Heated Private Infinity Pool', 'Dedicated Butler Service', 'Private Chef On-Site', 'Panoramic Ocean View', 'Holistic Spa Pavilion', 'Rooftop Lounge Deck', 'High-Speed Starlink WiFi'];
const mealPlans = ['Bed & Breakfast', 'Half Board (Breakfast & Dinner)', 'Full Board (All Gourmet Meals)', 'Ultra All-Inclusive (Open Bar & Dining)', 'Self-Catering with Private Chef'];
const vehicleTypes = ['Custom Safari Land Cruiser (Pop-up Roof)', 'VIP Executive Mercedes V-Class', 'Armored Luxury SUV', 'Rolls-Royce Ghost Chauffeur', 'Helicopter Airport Transfer'];
const driverStyles = ['Discreet Executive Protection Chauffeur', 'Knowledgeable Local Safari Guide', 'Friendly Conversational Host', 'Relaxed & Independent Driving'];
const transportFeatures = ['On-Board Refreshment Cooler', 'Wi-Fi Hotspot in Vehicle', 'Child Safety Seats', 'Luggage Van Support', 'Multi-Lingual Guide (French/German/Italian)', 'Airport VIP Fast-Track Assistance'];
const experienceOptions = ['Sunset Dhow Cruise & Seafood Dinner', 'Scuba Diving & Coral Reef Safari', 'Private Jet Skiing & Water Sports', 'Robinson Island Excursion', 'Tsavo East 2-Day Wildlife Safari', 'Professional Drone & Sunset Photography', 'Swahili Cooking Masterclass', 'Deep Sea Marlin Fishing', 'Mangrove Kayaking Eco-Tour', 'Championship Golf Tee Time at Vipingo'];
const dietaryPreferences = ['Strict Vegan / Plant-Based', 'Halal Certified Preparation', 'Gluten-Free Options', 'Keto / Low-Carb Menu', 'Severe Nut / Shellfish Allergies', 'Children-Friendly Menu Selection'];
const diningOptions = ['Private Candlelit Beach Dinner', 'Cliffside Fine Dining Reservation', 'Birthday Celebration Setup with Custom Cake', 'Traditional Swahili Feast', 'Floating Breakfast in Private Pool'];
const specialOptions = ['Wheelchair Accessible Transfers & Rooms', 'Full Medical Support / Nurse on Call', 'Surprise Anniversary Floral Arrangement', 'Professional Content Creator / Videographer', 'Custom Room Fragrance & Lighting Setup', 'Late Check-Out Guaranteed'];
const overallBudgets = ['Essential Luxury ($1,500 - $3,500)', 'Elevated Comfort ($3,500 - $7,000)', 'Ultra VIP Bespoke ($7,000 - $15,000)', 'Unlimited / Presidential ($15,000+)'];
const paymentMethods = ['M-Pesa Express', 'Secure Credit Card (Visa / Mastercard / AMEX)', 'Direct Bank Wire Transfer (SWIFT / IBAN)', 'Cryptocurrency (USDC / BTC)', 'PayPal Corporate'];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 touch-manipulation flex items-center gap-2 border ${
        selected
          ? 'bg-coral-500 border-coral-500 text-white shadow-md shadow-coral-500/20 translate-y-[-1px]'
          : 'bg-white border-slate-200/90 text-slate-700 hover:border-coral-300 hover:bg-coral-50/40 hover:text-coral-700 hover:-translate-y-0.5 hover:shadow-xs'
      }`}
    >
      <span>{label}</span>
      {selected && <Check size={14} className="stroke-[3] text-white shrink-0 animate-in zoom-in-50 duration-150" />}
    </button>
  );
}

function ChipGroup({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => (
        <Chip key={o} label={o} selected={selected.includes(o)} onClick={() => onToggle(o)} />
      ))}
    </div>
  );
}

function FlagIcon({ countryCode, size = 20 }: { countryCode: string; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-[3px] bg-slate-200 text-[9px] font-bold text-slate-500 leading-none"
        style={{ width: size, height: size * 0.75 }}
      >
        {countryCode}
      </span>
    );
  }

  return (
    <ReactCountryFlag
      countryCode={countryCode}
      svg
      style={{
        width: `${size}px`,
        height: `${size * 0.75}px`,
        borderRadius: '3px',
        objectFit: 'cover',
        flexShrink: 0,
      }}
      aria-label={countryCode}
      title={countryCode}
      onError={() => setFailed(true)}
    />
  );
}

function NationalityDropdown({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = WORLD_COUNTRIES.find(
    (c) => c.nationality.toLowerCase() === value.toLowerCase() || c.name.toLowerCase() === value.toLowerCase()
  ) || WORLD_COUNTRIES[0];

  const filteredCountries = WORLD_COUNTRIES.filter(
    (c) =>
      c.nationality.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-left flex items-center justify-between text-sm hover:border-coral-400 hover:shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-coral-500/25 active:scale-[0.99]"
      >
        <span className="flex items-center gap-3 overflow-hidden">
          <FlagIcon countryCode={selectedItem.code} size={22} />
          <span className="font-medium text-cocoa-900 truncate">
            {selectedItem.nationality} <span className="text-slate-400 font-normal">({selectedItem.name})</span>
          </span>
        </span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-coral-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-2.5 max-h-64 flex flex-col transition-all">
          <div className="relative mb-2">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search country or nationality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[40px] pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-sand-50/60 border border-slate-200 rounded-xl focus:outline-none focus:border-coral-500 focus:bg-white"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto space-y-1 flex-1 pr-1 custom-scrollbar">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange(c.nationality);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-left text-xs sm:text-sm flex items-center gap-3 transition-all ${
                    value === c.nationality
                      ? 'bg-coral-50 border border-coral-200 text-coral-700 font-semibold'
                      : 'hover:bg-sand-50/80 hover:text-coral-600 hover:pl-4 text-slate-700'
                  }`}
                >
                  <FlagIcon countryCode={c.code} size={22} />
                  <span className="truncate">
                    {c.nationality} <span className="text-slate-400 font-normal">({c.name})</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">No matching country found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JourneyPlanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expanded Data Store capturing all required client brief inputs
  const [data, setData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationality: 'Kenyan',
    numGuests: 2,
    numAdults: 2,
    numChildren: 0,
    occasion: 'Anniversary',
    arrivalDate: '',
    departureDate: '',
    flexibleDates: false,
    arrivalPoint: 'Moi Int. Airport (MBA)',
    departurePoint: 'Moi Int. Airport (MBA)',
    destinations: [] as string[],
    propertyTypes: [] as string[],
    mealPlan: 'Full Board (All Gourmet Meals)',
    accommodationAmenities: [] as string[],
    vehicleTypes: [] as string[],
    driverStyle: 'Discreet Executive Protection Chauffeur',
    transportFeatures: [] as string[],
    experiences: [] as string[],
    dietaryPreferences: [] as string[],
    dining: [] as string[],
    specialRequests: [] as string[],
    customNotes: '',
    overallBudget: 'Elevated Comfort ($3,500 - $7,000)',
    paymentMethod: 'Secure Credit Card (Visa / Mastercard / AMEX)',
  });

  useEffect(() => {
    if (user) {
      setData((prev) => ({
        ...prev,
        fullName: user.user_metadata?.full_name || prev.fullName,
        email: user.email || prev.email,
        phone: user.user_metadata?.phone || prev.phone,
      }));
    }
  }, [user]);

  const toggle = (key: keyof typeof data, value: string) => {
    setData((d) => {
      const arr = d[key] as string[];
      return { ...d, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const set = (key: keyof typeof data, value: any) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const next = () => {
    setStep((s) => Math.min(9, s + 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };
  
  const back = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const submit = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const sanitizedArrivalDate = data.arrivalDate && data.arrivalDate.trim() !== '' ? data.arrivalDate : null;
      const sanitizedDepartureDate = data.departureDate && data.departureDate.trim() !== '' ? data.departureDate : null;

      const payload = {
        user_id: user?.id || null,
        full_name: data.fullName.trim() || 'Valued Guest',
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        nationality: data.nationality,
        num_guests: Number(data.numGuests) || 1,
        guest_breakdown: {
          adults: Number(data.numAdults),
          children: Number(data.numChildren),
        },
        occasion: data.occasion,
        arrival_date: sanitizedArrivalDate,
        departure_date: sanitizedDepartureDate,
        flexible_dates: Boolean(data.flexibleDates),
        arrival_point: data.arrivalPoint,
        departure_point: data.departurePoint,
        destinations: data.destinations,
        accommodation: {
          propertyTypes: data.propertyTypes,
          mealPlan: data.mealPlan,
          amenities: data.accommodationAmenities,
        },
        transport: {
          vehicleTypes: data.vehicleTypes,
          driverStyle: data.driverStyle,
          features: data.transportFeatures,
        },
        experiences: data.experiences,
        dining: {
          options: data.dining,
          dietary: data.dietaryPreferences,
        },
        special_requests: data.specialRequests,
        custom_notes: data.customNotes.trim() || null,
        budget: {
          tier: data.overallBudget,
          paymentMethod: data.paymentMethod,
        },
        status: 'Submitted',
      };

      const { error } = await supabase.from('journey_briefs').insert([payload]);
      
      if (error) {
        throw new Error(error.message || 'Database error occurred while saving brief.');
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit journey brief:', err);
      setErrorMsg(err.message || 'Error submitting brief. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const CurrentIcon = steps[step - 1].icon;
  const totalSteps = steps.length;

  return (
    <div className="flex flex-col min-h-screen bg-sand-50/40">
      <Header />

      {/* Hero Header */}
      <section className="relative w-full bg-cocoa-900 border-b border-cocoa-800 text-white overflow-hidden py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div 
          className="absolute inset-0 opacity-25 pointer-events-none bg-repeat bg-center"
          style={{ backgroundImage: "url('/pattern.png')" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-coral-500 text-white text-[11px] font-bold tracking-widest uppercase rounded-full mb-4 shadow-sm">
            Putu Bespoke Concierge
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
            Craft Your Custom Coastal Journey
          </h1>
          <p className="text-sand-200 text-xs sm:text-sm mt-3 max-w-lg mx-auto leading-relaxed font-normal">
            Detail your exact preferences across nine tailored steps for an immaculate experience.
          </p>
        </div>
      </section>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl mx-auto w-full">
        
        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-coral-50 border border-coral-200 text-coral-900 flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-coral-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-coral-800">Submission Error</h4>
                <p className="text-xs sm:text-sm text-coral-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <button type="button" onClick={() => setErrorMsg(null)} className="text-coral-500 hover:text-coral-800 p-1">
              <X size={18} />
            </button>
          </div>
        )}

        {submitted ? (
          <div className="card-md p-8 sm:p-12 max-w-xl mx-auto text-center bg-white rounded-3xl shadow-xl border border-sand-200/80 my-8">
            <div className="w-20 h-20 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <PartyPopper size={36} />
            </div>
            <span className="inline-block px-3.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-widest rounded-full mb-3">
              Comprehensive Brief Logged
            </span>
            <h1 className="font-serif text-3xl font-semibold text-cocoa-900">Your Journey Brief is Confirmed!</h1>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Thank you, <span className="font-semibold text-cocoa-900">{data.fullName || 'Valued Guest'}</span>. Our senior concierge team has received your full specification and will design your bespoke itinerary within 24 hours.
            </p>

            <div className="mt-8 p-4 bg-sand-50 rounded-2xl border border-sand-200/60 text-left text-xs sm:text-sm space-y-2 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cocoa-900">Occasion / Theme:</span>
                <span>{data.occasion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cocoa-900">Party Makeup:</span>
                <span>{data.numAdults} Adults, {data.numChildren} Children ({data.nationality})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cocoa-900">Destinations Chosen:</span>
                <span>{data.destinations.length > 0 ? data.destinations.join(', ') : 'Standard Coast'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cocoa-900">Selected Experiences:</span>
                <span>{data.experiences.length} curated items</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/portal" className="btn-primary text-center py-3 px-6 text-sm font-semibold rounded-xl">
                Go to Guest Portal
              </Link>
              <Link to="/" className="btn-secondary text-center py-3 px-6 text-sm font-semibold rounded-xl">
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full">
            
            {/* Mobile Progress Tracker */}
            <div className="sm:hidden bg-white p-4 rounded-2xl border border-slate-200/80 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-coral-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {step}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-cocoa-900 block">{steps[step - 1].label}</span>
                    <span className="text-[10px] text-slate-400 block">{steps[step - 1].desc}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-coral-600 bg-coral-50 px-2.5 py-1 rounded-full">
                  Step {step} of {totalSteps}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-coral-500 h-full transition-all duration-300"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Desktop Stepper Bar */}
            <div className="hidden sm:block mb-8 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="grid grid-cols-9 gap-1">
                {steps.map((s) => {
                  const IconComp = s.icon;
                  const isCurrent = step === s.num;
                  const isDone = step > s.num;

                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setStep(s.num)}
                      className={`group relative flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                        isCurrent
                          ? 'bg-coral-50/80 border border-coral-200'
                          : 'hover:bg-sand-50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                          isCurrent
                            ? 'bg-coral-500 text-white shadow-md shadow-coral-500/30 scale-105'
                            : isDone
                            ? 'bg-teal-500 text-white group-hover:scale-105'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                        }`}
                      >
                        {isDone ? <Check size={16} className="stroke-[3]" /> : <IconComp size={16} />}
                      </div>
                      <span
                        className={`text-[10px] font-semibold mt-1.5 transition-colors truncate max-w-full ${
                          isCurrent ? 'text-coral-600 font-bold' : isDone ? 'text-cocoa-900' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Form Box */}
            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-lg border border-slate-200/70 mb-28 sm:mb-0 relative transition-all">
              
              {/* Step Title Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-coral-50 border border-coral-100 flex items-center justify-center text-coral-500">
                    <CurrentIcon size={20} />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold text-cocoa-900">
                      {steps[step - 1].label}
                    </h2>
                    <p className="text-xs text-slate-400">{steps[step - 1].desc}</p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-sand-50 px-3 py-1.5 rounded-full border border-slate-200/60">
                  <Clock size={13} className="text-slate-400" /> Step {step} of {totalSteps}
                </span>
              </div>

              {/* STEP 1: GUEST DETAILS */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input
                        className="input min-h-[48px] rounded-xl focus:border-coral-500"
                        placeholder="e.g. Jane Doe"
                        value={data.fullName}
                        onChange={(e) => set('fullName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input
                        type="email"
                        className="input min-h-[48px] rounded-xl focus:border-coral-500"
                        placeholder="e.g. jane@example.com"
                        value={data.email}
                        onChange={(e) => set('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">WhatsApp / Phone</label>
                      <input
                        className="input min-h-[48px] rounded-xl focus:border-coral-500"
                        placeholder="+254 7..."
                        value={data.phone}
                        onChange={(e) => set('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nationality / Passport Jurisdiction</label>
                    <NationalityDropdown value={data.nationality} onChange={(val) => set('nationality', val)} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Adult Guests (12+ yrs)</label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.max(1, data.numAdults - 1);
                            set('numAdults', val);
                            set('numGuests', val + data.numChildren);
                          }}
                          className="w-12 h-12 rounded-2xl border border-slate-200 bg-sand-50 hover:bg-coral-50 flex items-center justify-center transition-all"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="text-xl font-bold w-10 text-center text-cocoa-900">{data.numAdults}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const val = data.numAdults + 1;
                            set('numAdults', val);
                            set('numGuests', val + data.numChildren);
                          }}
                          className="w-12 h-12 rounded-2xl border border-slate-200 bg-sand-50 hover:bg-coral-50 flex items-center justify-center transition-all"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Children (Under 12)</label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.max(0, data.numChildren - 1);
                            set('numChildren', val);
                            set('numGuests', data.numAdults + val);
                          }}
                          className="w-12 h-12 rounded-2xl border border-slate-200 bg-sand-50 hover:bg-coral-50 flex items-center justify-center transition-all"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="text-xl font-bold w-10 text-center text-cocoa-900">{data.numChildren}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const val = data.numChildren + 1;
                            set('numChildren', val);
                            set('numGuests', data.numAdults + val);
                          }}
                          className="w-12 h-12 rounded-2xl border border-slate-200 bg-sand-50 hover:bg-coral-50 flex items-center justify-center transition-all"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Primary Occasion or Theme</label>
                    <div className="flex flex-wrap gap-2.5">
                      {occasions.map((o) => (
                        <Chip key={o} label={o} selected={data.occasion === o} onClick={() => set('occasion', o)} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: TRAVEL SCHEDULE & DATES */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Target Arrival Date</label>
                      <input
                        type="date"
                        className="input min-h-[48px] rounded-xl focus:border-coral-500"
                        value={data.arrivalDate}
                        onChange={(e) => set('arrivalDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Target Departure Date</label>
                      <input
                        type="date"
                        className="input min-h-[48px] rounded-xl focus:border-coral-500"
                        value={data.departureDate}
                        onChange={(e) => set('departureDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-sand-50 rounded-2xl border border-slate-200/80">
                    <input
                      type="checkbox"
                      id="flexDates"
                      checked={data.flexibleDates}
                      onChange={(e) => set('flexibleDates', e.target.checked)}
                      className="w-5 h-5 text-coral-500 rounded border-slate-300 focus:ring-coral-500"
                    />
                    <label htmlFor="flexDates" className="text-xs sm:text-sm font-medium text-cocoa-900 cursor-pointer">
                      My travel dates are flexible (+/- 3 days for optimized rates and villa availability)
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Arrival Transfer Point</label>
                      <div className="flex flex-col gap-2">
                        {arrivalPoints.map((p) => (
                          <Chip key={p} label={p} selected={data.arrivalPoint === p} onClick={() => set('arrivalPoint', p)} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Departure Transfer Point</label>
                      <div className="flex flex-col gap-2">
                        {departurePoints.map((p) => (
                          <Chip key={p} label={p} selected={data.departurePoint === p} onClick={() => set('departurePoint', p)} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DESTINATIONS & STOPS */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-coral-50/60 border border-coral-100 p-4 rounded-2xl flex items-start gap-3">
                    <Info size={18} className="text-coral-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-coral-900 leading-relaxed">
                      Select all regions and stops you would like included in your multi-city coastal itinerary. We build seamless private transfers between each location.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Preferred Destinations & Stops (Multi-select)</label>
                    <ChipGroup options={destinationsList} selected={data.destinations} onToggle={(v) => toggle('destinations', v)} />
                  </div>
                </div>
              )}

              {/* STEP 4: STAY & ACCOMMODATION */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Preferred Property Style</label>
                    <ChipGroup options={propertyTypes} selected={data.propertyTypes} onToggle={(v) => toggle('propertyTypes', v)} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Required Meal Plan</label>
                    <div className="flex flex-wrap gap-2.5">
                      {mealPlans.map((m) => (
                        <Chip key={m} label={m} selected={data.mealPlan === m} onClick={() => set('mealPlan', m)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Exclusive Amenities & Villa Features</label>
                    <ChipGroup options={accommodationAmenities} selected={data.accommodationAmenities} onToggle={(v) => toggle('accommodationAmenities', v)} />
                  </div>
                </div>
              )}

              {/* STEP 5: TRANSPORT & FLEET */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Preferred Fleet Class</label>
                    <ChipGroup options={vehicleTypes} selected={data.vehicleTypes} onToggle={(v) => toggle('vehicleTypes', v)} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Chauffeur / Driver Hosting Style</label>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                      {driverStyles.map((s) => (
                        <Chip key={s} label={s} selected={data.driverStyle === s} onClick={() => set('driverStyle', s)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Additional Transport Services</label>
                    <ChipGroup options={transportFeatures} selected={data.transportFeatures} onToggle={(v) => toggle('transportFeatures', v)} />
                  </div>
                </div>
              )}

              {/* STEP 6: EXPERIENCES & EXCURSIONS */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="bg-sand-50 border border-slate-200/80 p-4 rounded-2xl flex items-start gap-3">
                    <Compass size={18} className="text-coral-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Choose any marine adventures, wildlife safaris, or cultural excursions. Our concierge reserves all permits, private boat charters, and expert guides in advance.
                    </p>
                  </div>
                  <ChipGroup options={experienceOptions} selected={data.experiences} onToggle={(v) => toggle('experiences', v)} />
                </div>
              )}

              {/* STEP 7: DINING & DIETARY */}
              {step === 7 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Dietary Profiles & Allergies (Select all that apply)</label>
                    <ChipGroup options={dietaryPreferences} selected={data.dietaryPreferences} onToggle={(v) => toggle('dietaryPreferences', v)} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Curated Culinary Experiences & Setups</label>
                    <ChipGroup options={diningOptions} selected={data.dining} onToggle={(v) => toggle('dining', v)} />
                  </div>
                </div>
              )}

              {/* STEP 8: SPECIAL REQUESTS & CONCIERGE */}
              {step === 8 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Special Accommodations & VIP Concierge Additions</label>
                    <ChipGroup options={specialOptions} selected={data.specialRequests} onToggle={(v) => toggle('specialRequests', v)} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Custom Notes / Specific Requests for the Concierge Team</label>
                    <textarea
                      rows={4}
                      className="input w-full rounded-xl p-3 text-xs sm:text-sm focus:border-coral-500"
                      placeholder="Share any specific preferences, surprise plans, flight numbers, or accessibility needs..."
                      value={data.customNotes}
                      onChange={(e) => set('customNotes', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 9: BUDGET & CONFIRMATION */}
              {step === 9 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Overall Investment Tier</label>
                    <div className="flex flex-col gap-2.5">
                      {overallBudgets.map((b) => (
                        <Chip key={b} label={b} selected={data.overallBudget === b} onClick={() => set('overallBudget', b)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Preferred Payment Method for Retainer / Booking</label>
                    <div className="flex flex-wrap gap-2.5">
                      {paymentMethods.map((m) => (
                        <Chip key={m} label={m} selected={data.paymentMethod === m} onClick={() => set('paymentMethod', m)} />
                      ))}
                    </div>
                  </div>

                  {/* Comprehensive Summary Preview Card */}
                  <div className="bg-sand-50/90 rounded-2xl border border-sand-200 p-5 mt-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                      <span className="text-xs font-bold text-cocoa-900 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-teal-600" /> Complete Brief Summary
                      </span>
                      <span className="text-[11px] font-semibold text-coral-600">Ready for Submission</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Primary Contact</span>
                        <span className="font-semibold text-cocoa-900 truncate block">{data.fullName || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Party Size</span>
                        <span className="font-semibold text-cocoa-900 block">{data.numAdults} Adults, {data.numChildren} Kids ({data.nationality})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Occasion</span>
                        <span className="font-semibold text-cocoa-900 block">{data.occasion}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Dates</span>
                        <span className="font-semibold text-cocoa-900 block">{data.arrivalDate || 'Flexible'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Destinations</span>
                        <span className="font-semibold text-cocoa-900 block">{data.destinations.length} selected</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Experiences</span>
                        <span className="font-semibold text-cocoa-900 block">{data.experiences.length} chosen</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Navigation Footer */}
              <div className="hidden sm:flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 1}
                  className="btn-secondary text-xs py-3 px-6 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Previous Step
                </button>

                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={next}
                    className="btn-primary text-xs py-3 px-7 rounded-xl shadow-md hover:shadow-coral-500/20 transition-all flex items-center gap-2"
                  >
                    Next Step <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="btn-teal text-xs py-3.5 px-8 rounded-xl font-semibold shadow-lg hover:shadow-teal-600/20 transition-all flex items-center gap-2"
                  >
                    {loading ? 'Submitting Brief...' : 'Submit Complete Brief'} <ShieldCheck size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Fixed Bottom Controls */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:hidden flex items-center justify-between gap-3 shadow-2xl">
              <button
                type="button"
                onClick={back}
                disabled={step === 1}
                className="btn-secondary flex-1 text-xs py-3 rounded-xl justify-center disabled:opacity-30"
              >
                <ArrowLeft size={16} /> Back
              </button>
              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={next}
                  className="btn-primary flex-1 text-xs py-3 rounded-xl justify-center"
                >
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading}
                  className="btn-teal flex-1 text-xs py-3 rounded-xl justify-center font-semibold"
                >
                  {loading ? 'Submitting...' : 'Submit Brief'} <ShieldCheck size={16} />
                </button>
              )}
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}