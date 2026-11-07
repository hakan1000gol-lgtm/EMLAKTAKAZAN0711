/*
# Add ada and parsel columns to listings table

1. Changes
- Added `ada` (text, nullable) column to `listings` — stores the parcel block number from TKGM.
- Added `parsel` (text, nullable) column to `listings` — stores the parcel number from TKGM.
- Both columns are optional (nullable) since ada/parsel entry is voluntary.
2. Security
- No RLS policy changes needed. Existing policies already cover the new columns since they are on the same table.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'ada') THEN
    ALTER TABLE listings ADD COLUMN ada text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'parsel') THEN
    ALTER TABLE listings ADD COLUMN parsel text;
  END IF;
END $$;
