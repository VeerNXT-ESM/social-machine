import { NextResponse } from 'next/server';
import { deleteSource, updateSource } from '@/lib/db/sources';
import { badRequest, serverError } from '@/lib/db/http';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const patch: { enabled?: boolean; name?: string } = {};
    if ('enabled' in body) {
      if (typeof body.enabled !== 'boolean') return badRequest('enabled must be true or false');
      patch.enabled = body.enabled;
    }
    if ('name' in body) {
      if (typeof body.name !== 'string' || !body.name.trim()) return badRequest('name cannot be empty');
      patch.name = body.name.trim();
    }
    if (Object.keys(patch).length === 0) return badRequest('Nothing to update');
    await updateSource(id, patch);
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError('PATCH /api/sources/[id]', err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteSource(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError('DELETE /api/sources/[id]', err);
  }
}
