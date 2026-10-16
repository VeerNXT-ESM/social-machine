-- VeerNXT Social - Thumbnails for stored images
-- Each stored picture gets a small WebP copy so lists of images load quickly (a full-size AI image is ~2 MB).
-- Additive only: existing rows keep working and simply have no thumbnail until backfilled.
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS thumb_url TEXT;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS thumb_path TEXT;
