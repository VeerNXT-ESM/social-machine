-- VeerNXT Social - Content sources and discovered links
-- Sources are websites we read for article links to use as inspiration for posts.
-- Only the link, title and a short excerpt are stored (never the full article), always with attribution.

-- 1. SOURCES
CREATE TABLE IF NOT EXISTS public.content_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  feed_url TEXT, -- the RSS feed, or the page to read when kind = 'html'
  kind TEXT NOT NULL DEFAULT 'rss' CHECK (kind IN ('rss', 'html')),
  note TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('ok', 'error')),
  last_error TEXT,
  last_found INT DEFAULT 0,
  last_new INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, site_url, feed_url)
);

-- 2. DISCOVERED LINKS
CREATE TABLE IF NOT EXISTS public.source_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.content_sources(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_hash TEXT NOT NULL, -- sha256 of the normalised url, used to avoid duplicates
  title TEXT NOT NULL,
  summary TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  image_url TEXT,
  relevance INT NOT NULL DEFAULT 0 CHECK (relevance BETWEEN 0 AND 100),
  matched_keywords JSONB DEFAULT '[]'::jsonb,
  mentions_restricted_term BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'saved', 'used', 'dismissed')),
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, url_hash)
);

CREATE INDEX IF NOT EXISTS source_links_browse_idx
  ON public.source_links (user_id, status, published_at DESC NULLS LAST, discovered_at DESC);
CREATE INDEX IF NOT EXISTS source_links_source_idx ON public.source_links (source_id);

-- ROW LEVEL SECURITY (same principles as the main schema: nothing public, owner only, every write checked)
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.content_sources, public.source_links FROM anon;

CREATE POLICY "content_sources: owner access" ON public.content_sources
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- a link must belong to a source owned by the same user, and may only point at the owner's own content item
CREATE POLICY "source_links: owner access" ON public.source_links
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.content_sources s WHERE s.id = source_id AND s.user_id = (SELECT auth.uid()))
    AND (content_item_id IS NULL OR EXISTS (
      SELECT 1 FROM public.content_items ci WHERE ci.id = content_item_id AND ci.user_id = (SELECT auth.uid())))
  );
