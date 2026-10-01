import { NextResponse } from 'next/server';
import { listItems } from '@/lib/db/items';
import { serverError } from '@/lib/db/http';

export async function GET() {
  try {
    return NextResponse.json({ items: await listItems() });
  } catch (err) {
    return serverError('GET /api/items', err);
  }
}
