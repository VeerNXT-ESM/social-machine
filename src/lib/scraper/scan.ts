import 'server-only';
import { safeFetch } from './safeFetch';
import { parseFeed, parseListPage, ScrapedLink } from './parse';
import { scoreRelevance } from './relevance';
import { isSameSite, looksLikeSpam } from './spam';

export type SourceKind = 'rss' | 'html';

export interface SourceConfig {
  name: string;
  siteUrl: string;
  /** Feed address for kind "rss"; the page to read for kind "html". */
  feedUrl?: string | null;
  kind: SourceKind;
}

export interface ScoredLink extends ScrapedLink {
  relevance: number;
  matchedKeywords: string[];
  mentionsRestrictedTerm: boolean;
}

export interface ScanResult {
  links: ScoredLink[];
  /** The address that was actually read. */
  readUrl: string;
  error?: string;
  /** Links dropped by the safety filters, so problems with a source are visible. */
  skipped?: { spam: number; offSite: number };
}

const MAX_LINKS_PER_SCAN = 60;

/**
 * Read one source and return its links with a relevance score.
 * Never throws: problems come back as `error` so one broken site cannot stop a scan of the others.
 */
export async function scanSource(source: SourceConfig): Promise<ScanResult> {
  const readUrl = (source.kind === 'rss' ? source.feedUrl : source.feedUrl || source.siteUrl) || source.siteUrl;

  try {
    const res = await safeFetch(readUrl, {
      accept:
        source.kind === 'rss'
          ? 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5'
          : undefined,
    });
    if (res.status !== 200) return { links: [], readUrl, error: `The site answered with status ${res.status}.` };

    const found = source.kind === 'rss' ? parseFeed(res.text, res.finalUrl) : parseListPage(res.text, res.finalUrl);

    // Safety filters: links must stay on the source's own site, and spam is dropped.
    const skipped = { spam: 0, offSite: 0 };
    const raw = found.filter((l) => {
      if (!isSameSite(l.url, source.siteUrl)) {
        skipped.offSite += 1;
        return false;
      }
      if (looksLikeSpam(l.title, l.summary, l.url)) {
        skipped.spam += 1;
        return false;
      }
      return true;
    });

    if (raw.length === 0) {
      return {
        links: [],
        readUrl,
        skipped,
        error:
          source.kind === 'rss'
            ? 'No articles were found in the feed. Check that the address is an RSS or Atom feed.'
            : 'No article-like links were found on the page.',
      };
    }

    // newest first, then cap
    const sorted = [...raw].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    const links: ScoredLink[] = sorted.slice(0, MAX_LINKS_PER_SCAN).map((l) => {
      const r = scoreRelevance(l.title, l.summary, l.categories);
      return { ...l, relevance: r.score, matchedKeywords: r.matched, mentionsRestrictedTerm: r.mentionsRestrictedTerm };
    });
    return { links, readUrl, skipped };
  } catch (err) {
    return { links: [], readUrl, error: err instanceof Error ? err.message : 'The scan failed.' };
  }
}
