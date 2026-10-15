export type SourceKind = 'rss' | 'html';
export type LinkStatus = 'new' | 'saved' | 'used' | 'dismissed';

export interface SourceRow {
  id: string;
  name: string;
  site_url: string;
  feed_url: string | null;
  kind: SourceKind;
  note: string | null;
  enabled: boolean;
  last_checked_at: string | null;
  last_status: 'ok' | 'error' | null;
  last_error: string | null;
  last_found: number;
  last_new: number;
  created_at: string;
  /** Number of links still marked "new". */
  new_count?: number;
}

export interface LinkRow {
  id: string;
  source_id: string;
  source_name: string;
  url: string;
  title: string;
  summary: string | null;
  author: string | null;
  published_at: string | null;
  image_url: string | null;
  relevance: number;
  matched_keywords: string[];
  mentions_restricted_term: boolean;
  status: LinkStatus;
  content_item_id: string | null;
  discovered_at: string;
}

export interface ScanSummary {
  sourceId: string;
  name: string;
  found: number;
  added: number;
  error: string | null;
  skipped: { spam: number; offSite: number } | null;
}

/** Starting values for the composer when content is created from a discovered link. */
export interface ContentPrefill {
  linkId: string;
  title: string;
  url: string;
  summary: string;
  sourceName: string;
}
