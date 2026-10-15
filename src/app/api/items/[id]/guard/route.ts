import { NextResponse } from 'next/server';
import { enforceInsightRules } from '@/lib/contentGuard';
import { getItem } from '@/lib/db/items';
import { getSourceNameForItem } from '@/lib/db/sources';
import { badRequest, notFound, serverError } from '@/lib/db/http';

// Each failing post may be rewritten up to twice, one request at a time.
export const maxDuration = 120;

/**
 * Check an item made from a source article against the insight rules and rewrite any posts that fail.
 * The source name comes from the link the item was created from, or from the request body.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    if (!(await getItem(id))) return notFound();

    const sourceName =
      (typeof body.sourceName === 'string' && body.sourceName.trim()) || (await getSourceNameForItem(id));
    if (!sourceName) return badRequest('This item was not made from a source article, so there is no source to credit.');

    const reports = await enforceInsightRules(id, sourceName);
    return NextResponse.json({ item: await getItem(id), reports });
  } catch (err) {
    return serverError('POST /api/items/[id]/guard', err);
  }
}
