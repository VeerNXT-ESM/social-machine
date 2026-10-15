import { NextResponse } from 'next/server';
import { addSource, listSources, scanAndSave } from '@/lib/db/sources';
import { badRequest, serverError } from '@/lib/db/http';
import { assertPublicUrl } from '@/lib/scraper/safeFetch';
import { scanSource } from '@/lib/scraper/scan';

export async function GET() {
  try {
    return NextResponse.json({ sources: await listSources() });
  } catch (err) {
    return serverError('GET /api/sources', err);
  }
}

export const maxDuration = 60;

/** Add a source. The address is tested first, so a broken feed or page is reported instead of saved. */
export async function POST(req: Request) {
  try {
    const { name, url, kind, note } = await req.json();
    if (typeof name !== 'string' || !name.trim()) return badRequest('Give the source a name.');
    if (typeof url !== 'string' || !url.trim()) return badRequest('Enter the web address to read.');
    if (kind !== 'rss' && kind !== 'html') return badRequest('Choose RSS feed or web page.');

    let parsed: URL;
    try {
      parsed = await assertPublicUrl(url.trim());
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : 'That address is not allowed.');
    }

    const test = await scanSource({ name, siteUrl: parsed.origin, feedUrl: parsed.toString(), kind });
    if (test.error) {
      return NextResponse.json({ error: `This address did not work: ${test.error}` }, { status: 422 });
    }

    let source;
    try {
      source = await addSource({
        name: name.trim(),
        siteUrl: parsed.origin + '/',
        feedUrl: parsed.toString(),
        kind,
        note: typeof note === 'string' ? note.trim() || null : null,
      });
    } catch (err) {
      return badRequest(err instanceof Error ? err.message : 'Could not add the source.');
    }
    const scan = await scanAndSave(source);
    return NextResponse.json({ source, scan });
  } catch (err) {
    return serverError('POST /api/sources', err);
  }
}
