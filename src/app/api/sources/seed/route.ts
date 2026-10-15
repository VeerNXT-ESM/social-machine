import { NextResponse } from 'next/server';
import { addSuggestedSources, listSources } from '@/lib/db/sources';
import { serverError } from '@/lib/db/http';

/** Add the suggested starting sources that are not already present. */
export async function POST() {
  try {
    const added = await addSuggestedSources();
    return NextResponse.json({ added, sources: await listSources() });
  } catch (err) {
    return serverError('POST /api/sources/seed', err);
  }
}
