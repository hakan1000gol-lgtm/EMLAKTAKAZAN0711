/*
# Store TKGM parcel geometry on listings

1. Schema changes
- Add `parcel_geometry` (text, nullable) to `listings`. It holds the GeoJSON outline of the ada/parsel returned by the parcel lookup.

2. Security
- No RLS policy changes. Owners may set the column on insert and update, following the same column-level grant pattern used for other listing fields.
- Public reads already use the table-level SELECT grant; the geometry is hidden in the app when the owner chooses to hide the location.

3. Important notes
- Existing listings have no geometry and keep working unchanged.
*/

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS parcel_geometry text;

GRANT INSERT (parcel_geometry) ON public.listings TO authenticated;
GRANT UPDATE (parcel_geometry) ON public.listings TO authenticated;
