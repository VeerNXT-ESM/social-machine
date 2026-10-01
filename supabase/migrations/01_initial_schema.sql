-- VeerNXT Social - Database Schema Migration
-- Created for Supabase (PostgreSQL with RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BRAND SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.brand_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT DEFAULT 'VeerNXT',
  brand_description TEXT DEFAULT 'A platform empowering Ex-Service Men to transition into civilian careers through jobs, learning, skills development and employer connections.',
  audience TEXT DEFAULT 'Ex-Service Men (ESM), corporate employers, HR leaders, skill partners, and veteran transition advocacy groups.',
  tone JSONB DEFAULT '["Professional", "Supportive", "Confident", "Practical", "Human"]'::jsonb,
  words_to_use JSONB DEFAULT '["Ex-Service Men", "ESM", "Career Transition", "Leadership", "Skill Transfer", "Empowerment", "Civilian Career"]'::jsonb,
  words_to_avoid JSONB DEFAULT '["Agniveer", "Cheap Labor", "Unskilled", "Charity", "Hero complex", "Military jargon"]'::jsonb,
  key_messages JSONB DEFAULT '["Ex-Service Men possess elite leadership, discipline, and technical agility.", "VeerNXT bridges military excellence with high-growth civilian careers."]'::jsonb,
  cta_style TEXT DEFAULT 'Clear, value-driven invitation to explore career pathways on VeerNXT.',
  publishing_mode TEXT DEFAULT 'mock',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, PLANNED, COMPLETED
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONTENT ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL, -- article, link, notes, idea
  source_content TEXT NOT NULL,
  source_url TEXT,
  master_idea TEXT,
  content_type TEXT NOT NULL, -- Announcement, Educational, Thought Leadership, etc.
  status TEXT DEFAULT 'DRAFT', -- DRAFT, REVIEW, APPROVED, SCHEDULED, PUBLISHED, FAILED
  selected_platforms JSONB DEFAULT '["linkedin", "x", "instagram", "facebook"]'::jsonb,
  visual_direction JSONB,
  repurposed_from_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PLATFORM POSTS TABLE
CREATE TABLE IF NOT EXISTS public.platform_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- linkedin, x, instagram, facebook
  provider TEXT DEFAULT 'mock', -- mock, manual, buffer, native
  text TEXT NOT NULL,
  hashtags JSONB DEFAULT '[]'::jsonb,
  cta TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'DRAFT', -- DRAFT, REVIEW, APPROVED, SCHEDULED, PUBLISHED, FAILED
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_post_id TEXT,
  external_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MEDIA TABLE
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  type TEXT NOT NULL, -- image, video
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INT,
  height INT,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PUBLISHING JOBS TABLE
CREATE TABLE IF NOT EXISTS public.publishing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_post_id UUID REFERENCES public.platform_posts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSING, SUCCESS, FAILED
  run_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  attempts INT DEFAULT 0,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SOCIAL ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- linkedin, x, instagram, facebook
  account_name TEXT NOT NULL,
  account_id TEXT,
  access_token TEXT, -- Encrypted or stored server side
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  is_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
-- Principles: nothing is public; every row belongs to a signed-in owner; no policy is USING (TRUE);
-- every write is checked (WITH CHECK) so rows cannot be created in, or moved to, another user's account.
-- Server code that needs to bypass these rules uses the Supabase secret key, never the browser.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Anonymous (signed-out) visitors get no access to any table.
REVOKE ALL ON public.profiles, public.brand_settings, public.campaigns, public.content_items,
  public.platform_posts, public.media, public.publishing_jobs, public.social_accounts FROM anon;

-- profiles: a user manages only their own profile row
CREATE POLICY "profiles: owner access" ON public.profiles
  FOR ALL TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "brand_settings: owner access" ON public.brand_settings
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "campaigns: owner access" ON public.campaigns
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- content_items: owner access; a linked campaign or source item must also belong to the same owner
CREATE POLICY "content_items: owner access" ON public.content_items
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (campaign_id IS NULL OR EXISTS (
      SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = (SELECT auth.uid())))
    AND (repurposed_from_id IS NULL OR EXISTS (
      SELECT 1 FROM public.content_items s WHERE s.id = repurposed_from_id AND s.user_id = (SELECT auth.uid())))
  );

-- platform_posts: access only through ownership of the parent content item
CREATE POLICY "platform_posts: owner of content item" ON public.platform_posts
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.content_items ci
    WHERE ci.id = platform_posts.content_item_id AND ci.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.content_items ci
    WHERE ci.id = platform_posts.content_item_id AND ci.user_id = (SELECT auth.uid())));

CREATE POLICY "media: owner access" ON public.media
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- publishing_jobs: owners can read the jobs for their posts; jobs are created and updated by the server only
CREATE POLICY "publishing_jobs: owner can read" ON public.publishing_jobs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.platform_posts pp
    JOIN public.content_items ci ON ci.id = pp.content_item_id
    WHERE pp.id = publishing_jobs.platform_post_id AND ci.user_id = (SELECT auth.uid())));
REVOKE INSERT, UPDATE, DELETE ON public.publishing_jobs FROM authenticated;

-- social_accounts: owners can see which accounts are connected, but OAuth tokens are never exposed to the browser.
-- Only the server (secret key) can read or write access_token / refresh_token.
CREATE POLICY "social_accounts: owner can read" ON public.social_accounts
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "social_accounts: owner can delete" ON public.social_accounts
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
REVOKE ALL ON public.social_accounts FROM authenticated;
GRANT SELECT (id, user_id, platform, account_name, account_id, expires_at, is_connected, created_at)
  ON public.social_accounts TO authenticated;
GRANT DELETE ON public.social_accounts TO authenticated;
