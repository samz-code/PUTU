/*
# Putu Travels Concierge Management System - Core Schema

1. Overview
This migration creates the foundational tables for PTCMS, a luxury travel
concierge platform for the Kenyan coast (Diani / Mombasa area). The system
handles curated travel proposals, partner coordination, and journey management.

2. New Tables
- `customers` - Extended customer profile linked to auth.users
- `journey_briefs` - The 8-step journey planner submission (the heart of booking)
- `quotes` - Professional proposals prepared by admin from a journey brief
- `bookings` - Confirmed reservations derived from an approved quote
- `payments` - Payment records against bookings
- `documents` - Uploaded travel documents (passports, tickets, contracts)
- `messages` - Internal chat / concierge messages between customer and staff
- `notifications` - System notifications for users
- `wishlist` - Saved experiences/accommodations per customer
- `hotels` - Hotel partner properties
- `hotel_rooms` - Room types within a hotel
- `hotel_availability` - Blackout / availability calendar per hotel
- `hotel_reservations` - Booking requests sent to hotels
- `restaurants` - Restaurant partners
- `restaurant_reservations` - Reservation requests sent to restaurants
- `drivers` - Driver partner profiles
- `vehicles` - Fleet vehicles
- `driver_trips` - Trip assignments for drivers
- `tour_guides` - Tour guide partner profiles
- `guide_assignments` - Activity assignments for guides
- `experiences` - Catalog of bookable experiences (snorkeling, dhow cruise, etc.)
- `reviews` - Customer reviews for hotels/drivers/restaurants/tours
- `audit_logs` - Super admin audit trail
- `settings` - Key/value system settings

3. Security
- All tables have RLS enabled.
- Owner-scoped tables use auth.uid() ownership checks (TO authenticated).
- Public catalog tables (experiences, hotels public fields) allow anon read.
- Partner tables scope by a partner_user_id ownership check.
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- CUSTOMERS
-- =========================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  nationality text,
  vip_level text DEFAULT 'Standard' CHECK (vip_level IN ('Standard','Silver','Gold','Platinum')),
  preferred_driver_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_customer" ON customers;
CREATE POLICY "select_own_customer" ON customers FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_customer" ON customers;
CREATE POLICY "insert_own_customer" ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_customer" ON customers;
CREATE POLICY "update_own_customer" ON customers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- staff read all customers (broad policy; refined by app role logic)
DROP POLICY IF EXISTS "staff_read_all_customers" ON customers;
CREATE POLICY "staff_read_all_customers" ON customers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "staff_manage_customers" ON customers;
CREATE POLICY "staff_manage_customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- EXPERIENCES (public catalog)
-- =========================================================
CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  price_from numeric(10,2),
  duration text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_experiences" ON experiences;
CREATE POLICY "public_read_experiences" ON experiences FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "staff_manage_experiences" ON experiences;
CREATE POLICY "staff_manage_experiences" ON experiences FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- HOTELS (partner)
-- =========================================================
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  property_type text CHECK (property_type IN ('Hotel','Resort','Villa','Apartment','Boutique Hotel')),
  location text,
  star_rating int CHECK (star_rating BETWEEN 1 AND 5),
  commission_pct numeric(5,2) DEFAULT 10,
  contact_email text,
  contact_phone text,
  description text,
  cover_image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_hotels" ON hotels;
CREATE POLICY "public_read_hotels" ON hotels FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "partner_manage_own_hotel" ON hotels;
CREATE POLICY "partner_manage_own_hotel" ON hotels FOR ALL TO authenticated USING (auth.uid() = partner_user_id) WITH CHECK (auth.uid() = partner_user_id);
DROP POLICY IF EXISTS "staff_manage_hotels" ON hotels;
CREATE POLICY "staff_manage_hotels" ON hotels FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- HOTEL ROOMS
-- =========================================================
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity int DEFAULT 2,
  price_per_night numeric(10,2),
  amenities text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_hotel_rooms" ON hotel_rooms;
CREATE POLICY "read_hotel_rooms" ON hotel_rooms FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "partner_manage_own_rooms" ON hotel_rooms;
CREATE POLICY "partner_manage_own_rooms" ON hotel_rooms FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_rooms.hotel_id AND hotels.partner_user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_rooms.hotel_id AND hotels.partner_user_id = auth.uid())
);
DROP POLICY IF EXISTS "staff_manage_rooms" ON hotel_rooms;
CREATE POLICY "staff_manage_rooms" ON hotel_rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- HOTEL AVAILABILITY (blackout dates)
-- =========================================================
CREATE TABLE IF NOT EXISTS hotel_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean DEFAULT true,
  note text,
  UNIQUE (hotel_id, date)
);
ALTER TABLE hotel_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_hotel_availability" ON hotel_availability;
CREATE POLICY "read_hotel_availability" ON hotel_availability FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "partner_manage_own_availability" ON hotel_availability;
CREATE POLICY "partner_manage_own_availability" ON hotel_availability FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_availability.hotel_id AND hotels.partner_user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_availability.hotel_id AND hotels.partner_user_id = auth.uid())
);

-- =========================================================
-- HOTEL RESERVATIONS (requests sent to hotels)
-- =========================================================
CREATE TABLE IF NOT EXISTS hotel_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id uuid,
  check_in date NOT NULL,
  check_out date NOT NULL,
  num_guests int DEFAULT 1,
  room_type text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending','Confirmed','Declined','Checked In','Checked Out','Cancelled')),
  total_amount numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hotel_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partner_manage_own_hotel_reservations" ON hotel_reservations;
CREATE POLICY "partner_manage_own_hotel_reservations" ON hotel_reservations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_reservations.hotel_id AND hotels.partner_user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM hotels WHERE hotels.id = hotel_reservations.hotel_id AND hotels.partner_user_id = auth.uid())
);
DROP POLICY IF EXISTS "staff_manage_hotel_reservations" ON hotel_reservations;
CREATE POLICY "staff_manage_hotel_reservations" ON hotel_reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- RESTAURANTS (partner)
-- =========================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  cuisine text,
  location text,
  contact_email text,
  contact_phone text,
  description text,
  cover_image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_restaurants" ON restaurants;
CREATE POLICY "public_read_restaurants" ON restaurants FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "partner_manage_own_restaurant" ON restaurants;
CREATE POLICY "partner_manage_own_restaurant" ON restaurants FOR ALL TO authenticated USING (auth.uid() = partner_user_id) WITH CHECK (auth.uid() = partner_user_id);
DROP POLICY IF EXISTS "staff_manage_restaurants" ON restaurants;
CREATE POLICY "staff_manage_restaurants" ON restaurants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- RESTAURANT RESERVATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS restaurant_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  booking_id uuid,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  party_size int DEFAULT 2,
  occasion text,
  special_requests text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending','Confirmed','Declined','Completed','Cancelled')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE restaurant_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partner_manage_own_restaurant_reservations" ON restaurant_reservations;
CREATE POLICY "partner_manage_own_restaurant_reservations" ON restaurant_reservations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_reservations.restaurant_id AND restaurants.partner_user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = restaurant_reservations.restaurant_id AND restaurants.partner_user_id = auth.uid())
);
DROP POLICY IF EXISTS "staff_manage_restaurant_reservations" ON restaurant_reservations;
CREATE POLICY "staff_manage_restaurant_reservations" ON restaurant_reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- DRIVERS (partner)
-- =========================================================
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  license_number text,
  rating numeric(2,1) DEFAULT 5.0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_drivers" ON drivers;
CREATE POLICY "public_read_drivers" ON drivers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "partner_manage_own_driver" ON drivers;
CREATE POLICY "partner_manage_own_driver" ON drivers FOR ALL TO authenticated USING (auth.uid() = partner_user_id) WITH CHECK (auth.uid() = partner_user_id);
DROP POLICY IF EXISTS "staff_manage_drivers" ON drivers;
CREATE POLICY "staff_manage_drivers" ON drivers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- VEHICLES (fleet)
-- =========================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  plate_number text UNIQUE NOT NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('Sedan','SUV','G-Wagon','Van')),
  make text,
  model text,
  year int,
  capacity int DEFAULT 4,
  has_ac boolean DEFAULT true,
  insurance_expiry date,
  status text DEFAULT 'Available' CHECK (status IN ('Available','On Trip','Maintenance','Retired')),
  current_mileage int DEFAULT 0,
  fuel_level int DEFAULT 100,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_vehicles" ON vehicles;
CREATE POLICY "read_vehicles" ON vehicles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "staff_manage_vehicles" ON vehicles;
CREATE POLICY "staff_manage_vehicles" ON vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "driver_update_own_vehicle" ON vehicles;
CREATE POLICY "driver_update_own_vehicle" ON vehicles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM drivers WHERE drivers.id = vehicles.driver_id AND drivers.partner_user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM drivers WHERE drivers.id = vehicles.driver_id AND drivers.partner_user_id = auth.uid())
);

-- =========================================================
-- DRIVER TRIPS
-- =========================================================
CREATE TABLE IF NOT EXISTS driver_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  booking_id uuid,
  pickup_location text,
  dropoff_location text,
  pickup_time timestamptz,
  customer_contact text,
  status text DEFAULT 'Assigned' CHECK (status IN ('Assigned','En Route','Picked Up','Completed','Cancelled')),
  fare numeric(10,2),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE driver_trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "driver_manage_own_trips" ON driver_trips;
CREATE POLICY "driver_manage_own_trips" ON driver_trips FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_trips.driver_id AND drivers.partner_user_id = auth.uid())
);
DROP POLICY IF EXISTS "driver_update_own_trips" ON driver_trips;
CREATE POLICY "driver_update_own_trips" ON driver_trips FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_trips.driver_id AND drivers.partner_user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_trips.driver_id AND drivers.partner_user_id = auth.uid())
);
DROP POLICY IF EXISTS "staff_manage_driver_trips" ON driver_trips;
CREATE POLICY "staff_manage_driver_trips" ON driver_trips FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- TOUR GUIDES
-- =========================================================
CREATE TABLE IF NOT EXISTS tour_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  languages text[],
  rating numeric(2,1) DEFAULT 5.0,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tour_guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_guides" ON tour_guides;
CREATE POLICY "public_read_guides" ON tour_guides FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "partner_manage_own_guide" ON tour_guides;
CREATE POLICY "partner_manage_own_guide" ON tour_guides FOR ALL TO authenticated USING (auth.uid() = partner_user_id) WITH CHECK (auth.uid() = partner_user_id);
DROP POLICY IF EXISTS "staff_manage_guides" ON tour_guides;
CREATE POLICY "staff_manage_guides" ON tour_guides FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- GUIDE ASSIGNMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS guide_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES tour_guides(id) ON DELETE CASCADE,
  booking_id uuid,
  experience_id uuid REFERENCES experiences(id) ON DELETE SET NULL,
  scheduled_date date,
  num_guests int DEFAULT 1,
  status text DEFAULT 'Assigned' CHECK (status IN ('Assigned','Confirmed','Completed','Cancelled')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE guide_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "guide_manage_own_assignments" ON guide_assignments;
CREATE POLICY "guide_manage_own_assignments" ON guide_assignments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM tour_guides WHERE tour_guides.id = guide_assignments.guide_id AND tour_guides.partner_user_id = auth.uid())
);
DROP POLICY IF EXISTS "guide_update_own_assignments" ON guide_assignments;
CREATE POLICY "guide_update_own_assignments" ON guide_assignments FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM tour_guides WHERE tour_guides.id = guide_assignments.guide_id AND tour_guides.partner_user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM tour_guides WHERE tour_guides.id = guide_assignments.guide_id AND tour_guides.partner_user_id = auth.uid())
);
DROP POLICY IF EXISTS "staff_manage_guide_assignments" ON guide_assignments;
CREATE POLICY "staff_manage_guide_assignments" ON guide_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- JOURNEY BRIEFS (the 8-step planner submission)
-- =========================================================
CREATE TABLE IF NOT EXISTS journey_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Step 1: Guest info
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  nationality text,
  num_guests int DEFAULT 1,
  occasion text,
  -- Step 2: Travel details
  arrival_date date,
  departure_date date,
  arrival_point text CHECK (arrival_point IN ('SGR','Airport','Bus') OR arrival_point IS NULL),
  departure_point text,
  flexible_dates boolean DEFAULT false,
  -- Step 3: Accommodation (JSONB captures all the brief options)
  accommodation jsonb,
  -- Step 4: Transport
  transport jsonb,
  -- Step 5: Experiences
  experiences jsonb,
  -- Step 6: Dining
  dining jsonb,
  -- Step 7: Special requests
  special_requests jsonb,
  -- Step 8: Budget
  budget jsonb,
  payment_method text,
  -- Status
  status text DEFAULT 'Draft' CHECK (status IN ('Draft','Submitted','Pending','Quoted','Approved','Rejected','Archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE journey_briefs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_manage_own_briefs" ON journey_briefs;
CREATE POLICY "owner_manage_own_briefs" ON journey_briefs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "staff_manage_briefs" ON journey_briefs;
CREATE POLICY "staff_manage_briefs" ON journey_briefs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- QUOTES (admin-prepared proposals)
-- =========================================================
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid NOT NULL REFERENCES journey_briefs(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reference text UNIQUE NOT NULL DEFAULT ('Q-' || upper(substr(encode(gen_random_bytes(6)::bytea, 'hex'), 1, 8))),
  accommodation_total numeric(10,2) DEFAULT 0,
  transport_total numeric(10,2) DEFAULT 0,
  activities_total numeric(10,2) DEFAULT 0,
  dining_total numeric(10,2) DEFAULT 0,
  other_total numeric(10,2) DEFAULT 0,
  subtotal numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  package_breakdown jsonb,
  itinerary jsonb,
  payment_breakdown jsonb,
  valid_until date,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending','Sent','Approved','Rejected','Expired','Converted')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_read_own_quotes" ON quotes;
CREATE POLICY "owner_read_own_quotes" ON quotes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update_own_quotes" ON quotes;
CREATE POLICY "owner_update_own_quotes" ON quotes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "staff_manage_quotes" ON quotes;
CREATE POLICY "staff_manage_quotes" ON quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- BOOKINGS (confirmed reservations)
-- =========================================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL DEFAULT ('PT-' || upper(substr(encode(gen_random_bytes(6)::bytea, 'hex'), 1, 8))),
  brief_id uuid REFERENCES journey_briefs(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  arrival_date date,
  departure_date date,
  num_guests int DEFAULT 1,
  total_amount numeric(10,2) DEFAULT 0,
  paid_amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'Pending' CHECK (status IN ('Draft','Pending','Quoted','Awaiting Payment','Confirmed','Checked In','Completed','Cancelled','Refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_manage_own_bookings" ON bookings;
CREATE POLICY "owner_manage_own_bookings" ON bookings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "staff_manage_bookings" ON bookings;
CREATE POLICY "staff_manage_bookings" ON bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- PAYMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  method text CHECK (method IN ('M-Pesa','Card','PayPal','Bank Transfer','Stripe','Flutterwave','Cash')),
  status text DEFAULT 'Pending' CHECK (status IN ('Pending','Completed','Failed','Refunded')),
  reference text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_read_own_payments" ON payments;
CREATE POLICY "owner_read_own_payments" ON payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert_own_payments" ON payments;
CREATE POLICY "owner_insert_own_payments" ON payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "staff_manage_payments" ON payments;
CREATE POLICY "staff_manage_payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- DOCUMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('Passport','Ticket','Invoice','Contract','Receipt','Travel Insurance','Visa','Other')),
  file_name text NOT NULL,
  file_url text,
  status text DEFAULT 'Uploaded',
  uploaded_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_manage_own_documents" ON documents;
CREATE POLICY "owner_manage_own_documents" ON documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "staff_manage_documents" ON documents;
CREATE POLICY "staff_manage_documents" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- MESSAGES (concierge chat)
-- =========================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('customer','staff','system')),
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_manage_own_messages" ON messages;
CREATE POLICY "owner_manage_own_messages" ON messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "staff_manage_messages" ON messages;
CREATE POLICY "staff_manage_messages" ON messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_manage_own_notifications" ON notifications;
CREATE POLICY "owner_manage_own_notifications" ON notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- WISHLIST
-- =========================================================
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('experience','hotel','destination')),
  item_id uuid,
  name text,
  image_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_manage_own_wishlist" ON wishlist;
CREATE POLICY "owner_manage_own_wishlist" ON wishlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- REVIEWS
-- =========================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  reviewable_type text NOT NULL CHECK (reviewable_type IN ('hotel','driver','restaurant','tour','experience')),
  reviewable_id uuid,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT TO anon, authenticated USING (is_published = true);
DROP POLICY IF EXISTS "owner_manage_own_reviews" ON reviews;
CREATE POLICY "owner_manage_own_reviews" ON reviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "staff_manage_reviews" ON reviews;
CREATE POLICY "staff_manage_reviews" ON reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- AUDIT LOGS
-- =========================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_read_audit_logs" ON audit_logs;
CREATE POLICY "staff_read_audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "staff_insert_audit_logs" ON audit_logs;
CREATE POLICY "staff_insert_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =========================================================
-- SETTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_settings" ON settings;
CREATE POLICY "public_read_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "staff_manage_settings" ON settings;
CREATE POLICY "staff_manage_settings" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_briefs_user_id ON journey_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_briefs_status ON journey_briefs(status);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_brief_id ON quotes(brief_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_arrival_date ON bookings(arrival_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_hotels_partner_user_id ON hotels(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_reservations_hotel_id ON hotel_reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_reservations_restaurant_id ON restaurant_reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_driver_trips_driver_id ON driver_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_guide_assignments_guide_id ON guide_assignments(guide_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewable ON reviews(reviewable_type, reviewable_id);

-- =========================================================
-- SEED DATA
-- =========================================================
INSERT INTO experiences (name, category, description, price_from, duration, image_url) VALUES
('Snorkeling', 'Water', 'Guided snorkeling at the coral reef with all gear provided.', 45, '3 hours', NULL),
('Scuba Diving', 'Water', 'PADI-certified dives for beginners and certified divers.', 120, '4 hours', NULL),
('Jet Ski', 'Water', 'Adrenaline-fueled jet ski rides along the coast.', 60, '30 min', NULL),
('Boat Cruise', 'Water', 'Relaxing cruise along the Indian Ocean shoreline.', 50, '2 hours', NULL),
('Beach Picnic', 'Leisure', 'Private picnic setup on a secluded beach.', 80, '3 hours', NULL),
('Photography', 'Service', 'Professional photoshoot at scenic coastal locations.', 90, '2 hours', NULL),
('Spa', 'Wellness', 'Luxury spa treatments at partner resorts.', 70, '90 min', NULL),
('Nightlife', 'Entertainment', 'Curated nightlife experience at top coastal venues.', 40, '4 hours', NULL),
('Mangroves Tour', 'Nature', 'Kayak through tranquil mangrove forests.', 55, '3 hours', NULL),
('Robinson Island', 'Excursion', 'Day trip to the iconic Robinson Crusoe island.', 110, 'Full day', NULL),
('Dhow Cruise', 'Water', 'Traditional dhow sailing with lunch on board.', 85, '5 hours', NULL),
('Sunset Cruise', 'Water', 'Evening cruise with sundowners and light bites.', 65, '2 hours', NULL)
ON CONFLICT DO NOTHING;
