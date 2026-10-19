import { NextResponse } from 'next/server';
import { buildAnalytics } from '@/lib/analytics';
import { serverError } from '@/lib/db/http';

export const maxDuration = 60;

/** Real figures: posts Buffer has published and what each platform reported for them. */
export async function GET() {
  try {
    return NextResponse.json(await buildAnalytics());
  } catch (err) {
    return serverError('GET /api/analytics', err);
  }
}
