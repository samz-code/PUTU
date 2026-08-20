export interface HerTurnSpeaker {
  name: string;
  title: string;
  bio: string;
  image_url: string;
}

export interface HerTurnPartner {
  name: string;
  logo_url: string;
  url: string;
}

export interface HerTurnItineraryItem {
  day: string;
  time: string;
  activity: string;
}

export interface HerTurnEdition {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  status: 'draft' | 'published' | 'archived';
  edition_type:
    | 'retreat'
    | 'dhow_cruise'
    | 'networking'
    | 'workshop'
    | 'other';
  start_date: string;
  end_date: string;
  start_time: string;
  venue_name: string;
  venue_address: string;
  venue_map_url: string;
  hero_image_url: string;
  gallery_urls: string[];
  themes: string[];
  dress_code: string;
  description: string;
  itinerary: HerTurnItineraryItem[];
  keynote_speakers: HerTurnSpeaker[];
  partners: HerTurnPartner[];
  registration_open: boolean;
  meta_title: string;
  meta_description: string;
  created_at: string;
}

export interface HerTurnTicketTier {
  id: string;
  edition_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  early_bird_price: number | null;
  early_bird_deadline: string | null;
  stock_total: number;
  stock_sold: number;
  perks: string[];
  display_order: number;
  is_active: boolean;
}

export interface HerTurnRegistration {
  id: string;
  edition_id: string;
  ticket_tier_id: string;
  full_name: string;
  email: string;
  phone: string;
  dietary_requirements: string | null;
  social_handle: string | null;
  quantity: number;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status:
    | 'pending'
    | 'paid'
    | 'failed'
    | 'cancelled'
    | 'refunded'
    | 'checked_in';
  qr_token: string | null;
  merchant_reference: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
}

export interface HerTurnWaitlistEntry {
  id: string;
  edition_id: string;
  ticket_tier_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  status: 'waiting' | 'promoted' | 'declined';
  created_at: string;
}

export interface HerTurnPageSettings {
  id: string;
  hero_badge_text: string;
  hero_title: string;
  hero_subtitle: string;
  value_heading: string;
  value_body: string;
  value_checklist: string[];
  sisterhood_heading: string;
  sisterhood_body: string;
  sisterhood_cta_text: string;
  sisterhood_cta_link: string;
}

/**
 * Used only as a render fallback for the brief window before the database
 * row loads or if the migration has not been run yet.
 * It is never a substitute for admin-editable content itself.
 */
export const DEFAULT_HER_TURN_PAGE_SETTINGS: Omit<
  HerTurnPageSettings,
  'id'
> = {
  hero_badge_text: 'Exclusive Women Editions & Retreats',
  hero_title: 'Her Turn: Travel. Connect. Thrive.',
  hero_subtitle:
    'Curated journeys, empowering wellness retreats, and exclusive social gatherings created by women, for women, along the breathtaking shores of Diani.',
  value_heading: 'Designed For Women Who Seek Authenticity & Luxury',
  value_body:
    'Whether you are networking with ambitious female founders, unwinding with restorative beach yoga, or exploring the coast in a supportive sisterhood group, Her Turn offers uncompromised safety, luxury, and community.',
  value_checklist: [
    'Verified Luxury Stays',
    'Dedicated Female Hosts',
    'Private Transfers Included',
    'Tailored Networking & Wellness',
  ],
  sisterhood_heading: 'Join the Sisterhood',
  sisterhood_body:
    'Get early invitations to flash meetups, private cohort openings, and discount codes.',
  sisterhood_cta_text: 'Request Access',
  sisterhood_cta_link: '/contact',
};

export function effectiveTierPrice(
  tier: HerTurnTicketTier,
): number {
  if (
    tier.early_bird_price !== null &&
    tier.early_bird_deadline &&
    new Date() < new Date(tier.early_bird_deadline)
  ) {
    return tier.early_bird_price;
  }

  return tier.price;
}

export function tierSpotsLeft(
  tier: HerTurnTicketTier,
): number {
  return Math.max(0, tier.stock_total - tier.stock_sold);
}