/*
# Add Traveler Detail Columns to Customers

1. Changes
- Adds `date_of_birth` (date) — traveler DOB for bookings and insurance
- Adds `passport_number` (text) — passport reference for travel docs
- Adds `dietary_requirements` (text) — dietary preferences/restrictions
- Adds `emergency_contact_name` (text) — emergency contact person
- Adds `emergency_contact_phone` (text) — emergency contact phone
2. Security
- No RLS changes needed — existing customer policies already cover all columns
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'date_of_birth') THEN
    ALTER TABLE customers ADD COLUMN date_of_birth date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'passport_number') THEN
    ALTER TABLE customers ADD COLUMN passport_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'dietary_requirements') THEN
    ALTER TABLE customers ADD COLUMN dietary_requirements text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'emergency_contact_name') THEN
    ALTER TABLE customers ADD COLUMN emergency_contact_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'emergency_contact_phone') THEN
    ALTER TABLE customers ADD COLUMN emergency_contact_phone text;
  END IF;
END $$;