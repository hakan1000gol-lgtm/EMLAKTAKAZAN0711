/*
# Fix listing creation permissions for optional listing fields

1. Summary
- Restores the authenticated user's ability to create a listing when the form sends optional parcel, location-privacy, and video values.

2. Modified table
- `public.listings`
- Allows authenticated inserts for `video_url`, `ada`, `parsel`, and `location_hidden`.
- Allows authenticated owners to update `ada`, `parsel`, `location_hidden`, and `video_url` when editing a listing.

3. Security
- No RLS policies are changed.
- Existing owner-scoped INSERT and UPDATE policies remain responsible for row ownership.
- Grants are limited to the specific columns required by the listing form.

4. Important notes
- These columns are optional and nullable or defaulted, so existing listings are unaffected.
- The change fixes permission errors caused by column-level grants that did not include fields added after the original listing permissions migration.
*/

GRANT INSERT (video_url, ada, parsel, location_hidden) ON public.listings TO authenticated;
GRANT UPDATE (video_url, ada, parsel, location_hidden) ON public.listings TO authenticated;