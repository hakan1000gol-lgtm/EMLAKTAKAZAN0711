/*
# Add location_hidden column to listings table

1. Changes
- Added `location_hidden` (boolean, default false) column to `listings`.
- When true, the exact coordinates are hidden from viewers; instead a 1km circle is shown.
- The owner still sees exact coordinates in their own listing management.
2. Security
- No RLS policy changes needed. The column is writable by the listing owner via existing UPDATE/INSERT policies.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'location_hidden') THEN
    ALTER TABLE listings ADD COLUMN location_hidden boolean NOT NULL DEFAULT false;
  END IF;
END $$;
