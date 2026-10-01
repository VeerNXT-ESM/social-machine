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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- linkedin, x, instagram, facebook
  account_name TEXT NOT NULL,
  account_id TEXT,
  access_token TEXT, -- Encrypted or stored server side
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  is_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY POLICIES (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own data
CREATE POLICY "Allow individual read/write access to profiles" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Allow individual read/write access to brand_settings" ON public.brand_settings FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow individual read/write access to campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow individual read/write access to content_items" ON public.content_items FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow access to platform_posts via content_items" ON public.platform_posts FOR ALL USING (TRUE);
CREATE POLICY "Allow individual read/write access to media" ON public.media FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow individual access to publishing_jobs" ON public.publishing_jobs FOR ALL USING (TRUE);
CREATE POLICY "Allow individual access to social_accounts" ON public.social_accounts FOR ALL USING (auth.uid() = user_id);
