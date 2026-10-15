import { NextResponse } from 'next/server';
import { listLinks, LinkStatus } from '@/lib/db/sources';
import { serverError } from '@/lib/db/http';

const STATUSES = ['new', 'saved', 'used', 'dismissed', 'all'];

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const status = sp.get('status') ?? 'new';
    const links = await listLinks({
      status: (STATUSES.includes(status) ? status : 'new') as LinkStatus | 'all',
      sourceId: sp.get('source') || undefined,
      minRelevance: Number(sp.get('minRelevance')) || 0,
      q: sp.get('q') || undefined,
      limit: Number(sp.get('limit')) || 200,
    });
    return NextResponse.json({ links });
  } catch (err) {
    return serverError('GET /api/links', err);
  }
}
