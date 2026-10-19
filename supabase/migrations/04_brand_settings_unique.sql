-- VeerNXT Social - one brand settings row per owner
-- The app reads and edits a single row per user; this makes that a guarantee.
CREATE UNIQUE INDEX IF NOT EXISTS brand_settings_user_unique ON public.brand_settings (user_id);
