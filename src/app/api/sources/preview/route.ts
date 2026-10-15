import { NextResponse } from 'next/server';
import { scanSource } from '@/lib/scraper/scan';
import { assertPublicUrl } from '@/lib/scraper/safeFetch';
import { badRequest, serverError } from '@/lib/db/http';

/**
 * Try a source without saving anything: read it, score the links, and return the best ones.
 * Used to check an address before adding it as a source.
 */
export async function POST(req: Request) {
  try {
    const { url, kind = 'rss', name = 'Preview' } = await req.json();
    if (typeof url !== 'string' || !url) return badRequest('A web address is required.');
    if (kind !== 'rss' && kind !== 'html') return badRequest('kind must be "rss" or "html".');

    try {
      await assertPublicUrl(url);
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : 'That address is not allowed.');
    }

    const origin = new URL(url).origin;
    const result = await scanSource({ name, siteUrl: origin, feedUrl: url, kind });

    return NextResponse.json({
      readUrl: result.readUrl,
      error: result.error ?? null,
      skipped: result.skipped ?? null,
      count: result.links.length,
      links: [...result.links].sort((a, b) => b.relevance - a.relevance).slice(0, 25),
    });
  } catch (err) {
    return serverError('POST /api/sources/preview', err);
  }
}
