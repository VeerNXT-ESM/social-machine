import { NextResponse } from 'next/server';
import { approveItem } from '@/lib/db/items';
import { badRequest, isPlatform, notFound, serverError } from '@/lib/db/http';

/** Approve every post of an item (or only the listed platforms) that is not already scheduled or published. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    let platforms;
    if (body.platforms !== undefined) {
      if (!Array.isArray(body.platforms) || !body.platforms.every(isPlatform)) return badRequest('Invalid platforms');
      platforms = body.platforms;
    }
    const item = await approveItem(id, platforms);
    return item ? NextResponse.json({ item }) : notFound();
  } catch (err) {
    return serverError('POST /api/items/[id]/approve', err);
  }
}
