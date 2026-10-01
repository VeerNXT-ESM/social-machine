import { NextResponse } from 'next/server';
import { deleteItem, getItem } from '@/lib/db/items';
import { notFound, serverError } from '@/lib/db/http';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await getItem(id);
    return item ? NextResponse.json({ item }) : notFound();
  } catch (err) {
    return serverError('GET /api/items/[id]', err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteItem(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError('DELETE /api/items/[id]', err);
  }
}
