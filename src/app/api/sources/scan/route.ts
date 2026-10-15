import { NextResponse } from 'next/server';
import { scanSources } from '@/lib/db/sources';
import { serverError } from '@/lib/db/http';

// Several sites are read one after another, with a pause between requests to the same site.
export const maxDuration = 120;

/** Scan one source (body: { sourceId }) or every enabled source. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sourceId = typeof body.sourceId === 'string' ? body.sourceId : undefined;
    const summaries = await scanSources(sourceId);
    return NextResponse.json({ summaries, added: summaries.reduce((n, s) => n + s.added, 0) });
  } catch (err) {
    return serverError('POST /api/sources/scan', err);
  }
}
