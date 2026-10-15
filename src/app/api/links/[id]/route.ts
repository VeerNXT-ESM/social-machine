import { NextResponse } from 'next/server';
import { updateLink } from '@/lib/db/sources';
import { badRequest, serverError } from '@/lib/db/http';

const STATUSES = ['new', 'saved', 'used', 'dismissed'] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (!STATUSES.includes(status)) return badRequest('Invalid status');
    await updateLink(id, { status });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError('PATCH /api/links/[id]', err);
  }
}
