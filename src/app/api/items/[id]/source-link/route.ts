import { NextResponse } from 'next/server';
import { addSourceLink, getItem } from '@/lib/db/items';
import { badRequest, notFound, serverError } from '@/lib/db/http';

/** Add the item's article address to the end of each of its posts (a post that already has it is left alone). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await getItem(id);
    if (!item) return notFound();
    if (!item.source_url) return badRequest('This item has no article address.');
    return NextResponse.json({ item: await addSourceLink(id, item.source_url) });
  } catch (err) {
    return serverError('POST /api/items/[id]/source-link', err);
  }
}
