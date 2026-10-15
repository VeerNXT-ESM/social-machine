import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';

/** A link found on a source. Only the link, title and a short excerpt are kept, never the full article. */
export interface ScrapedLink {
  url: string;
  title: string;
  summary: string;
  author?: string;
  publishedAt?: string; // ISO
  imageUrl?: string;
  categories: string[];
}

const EXCERPT_CHARS = 400;
const TRACKING_PARAMS = /^(utm_|fbclid|gclid|mc_|ref$|source$)/i;

/** Remove tracking parameters and fragments so the same article is not stored twice. */
export function normalizeUrl(raw: string, base?: string): string | null {
  try {
    const u = new URL(raw, base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    u.hash = '';
    [...u.searchParams.keys()].forEach((k) => TRACKING_PARAMS.test(k) && u.searchParams.delete(k));
    return u.toString();
  } catch {
    return null;
  }
}

/** Plain-text excerpt from an HTML snippet. */
export function excerpt(html: unknown, max = EXCERPT_CHARS): string {
  const text = cheerio.load(`<div>${String(html ?? '')}</div>`)('div').text().replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '...';
}

function text(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim();
  if (typeof v === 'object' && '#text' in (v as Record<string, unknown>)) return text((v as Record<string, unknown>)['#text']);
  return '';
}

function toIso(v: unknown): string | undefined {
  const s = text(v);
  if (!s) return undefined;
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
}

type Obj = Record<string, string>;

/** fast-xml-parser returns a single object for one element and an array for several; normalise to an array. */
function asArray<T>(v: unknown): T[] {
  if (v === undefined || v === null) return [];
  return (Array.isArray(v) ? v : [v]) as T[];
}

function imageFrom(item: Record<string, unknown>): string | undefined {
  const media = asArray<Obj>(item['media:content'])[0];
  if (media?.['@_url']) return media['@_url'];
  const thumb = asArray<Obj>(item['media:thumbnail'])[0];
  if (thumb?.['@_url']) return thumb['@_url'];
  const enclosure = item['enclosure'] as Record<string, string> | undefined;
  if (enclosure?.['@_url'] && /image/i.test(enclosure['@_type'] ?? '')) return enclosure['@_url'];
  const html = text(item['content:encoded']) || text(item['description']);
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1];
}

/** Parse an RSS 2.0 or Atom feed into links. */
export function parseFeed(xml: string, feedUrl: string): ScrapedLink[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', processEntities: true, trimValues: true });
  const doc = parser.parse(xml);
  const links: ScrapedLink[] = [];

  // RSS 2.0
  const rssItems = asArray<Record<string, unknown>>(doc?.rss?.channel?.item);
  for (const item of rssItems) {
    const url = normalizeUrl(text(item.link) || text(item.guid), feedUrl);
    const title = excerpt(text(item.title), 300);
    if (!url || !title) continue;
    links.push({
      url,
      title,
      summary: excerpt(text(item.description) || text(item['content:encoded'])),
      author: text(item['dc:creator']) || text(item.author) || undefined,
      publishedAt: toIso(item.pubDate) ?? toIso(item['dc:date']),
      imageUrl: imageFrom(item),
      categories: asArray<unknown>(item.category).map(text).filter(Boolean).slice(0, 8),
    });
  }

  // Atom
  const entries = asArray<Record<string, unknown>>(doc?.feed?.entry);
  for (const entry of entries) {
    const linkNodes = asArray<Obj>(entry.link);
    const href = (linkNodes.find((l) => !l['@_rel'] || l['@_rel'] === 'alternate') ?? linkNodes[0])?.['@_href'];
    const url = normalizeUrl(href ?? '', feedUrl);
    const title = excerpt(text(entry.title), 300);
    if (!url || !title) continue;
    const author = (entry.author as Record<string, unknown> | undefined)?.name;
    links.push({
      url,
      title,
      summary: excerpt(text(entry.summary) || text(entry.content)),
      author: text(author) || undefined,
      publishedAt: toIso(entry.published) ?? toIso(entry.updated),
      imageUrl: imageFrom(entry),
      categories: asArray<Obj>(entry.category)
        .map((c) => c['@_term'] ?? '')
        .filter(Boolean)
        .slice(0, 8),
    });
  }

  return links;
}

const BOILERPLATE_TEXT = /^(home|about|contact|login|log in|sign in|register|read more|more|menu|privacy|terms|sitemap|search|subscribe|forgot)/i;
// Links such as "View As PDF" say nothing about the article; the title sits in the same table row.
const GENERIC_LINK_TEXT = /^(view( as)? pdf|view|download( pdf)?|read( more)?|full text|pdf|click here)$/i;

function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Extract article-like links from an ordinary listing page (no feed available).
 * Heuristics: links in the main content, with a title-like text, on the same site; navigation,
 * header, footer and sidebars are ignored. Table rows (title, author, "View as PDF") are understood.
 */
export function parseListPage(html: string, pageUrl: string): ScrapedLink[] {
  const $ = cheerio.load(html);
  $('nav, header, footer, aside, script, style, noscript, form, [role="navigation"], .menu, .nav, .navbar, .footer, .sidebar').remove();

  const pageHost = new URL(pageUrl).hostname.replace(/^www\./, '');
  const seen = new Set<string>();
  const links: ScrapedLink[] = [];

  $('a[href]').each((_, el) => {
    const $a = $(el);
    const linkText = cleanText($a.text());
    let title = linkText;
    let author: string | undefined;

    if (GENERIC_LINK_TEXT.test(linkText)) {
      const cells = $a
        .closest('tr')
        .children('td, th')
        .map((__, c) => cleanText($(c).text()))
        .get()
        .filter((t) => t && t !== linkText && !/^\d+$/.test(t));
      const sorted = [...cells].sort((x, y) => y.length - x.length);
      title = sorted[0] ?? '';
      author = sorted[1] && sorted[1].length <= 140 ? sorted[1] : undefined;
    }

    if (title.length < 25 || title.length > 300 || BOILERPLATE_TEXT.test(title)) return;
    const url = normalizeUrl($a.attr('href') ?? '', pageUrl);
    if (!url) return;
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host !== pageHost) return;
    if (url === normalizeUrl(pageUrl)) return;
    if (seen.has(url)) return;
    seen.add(url);

    // use the surrounding block's text as a short excerpt, when it adds something beyond the title
    let summary = '';
    if (!author) {
      const block = cleanText($a.closest('li, article, tr, .card, .item, p, div').text());
      summary = block.length > title.length + 20 ? excerpt(block.replace(title, '').trim()) : '';
    }

    links.push({ url, title, summary, author, categories: [] });
  });

  return links;
}
