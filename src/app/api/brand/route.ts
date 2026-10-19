import { NextResponse } from 'next/server';
import { BrandValidationError, getBrandSettings, parseBrandInput, saveBrandSettings } from '@/lib/db/brand';
import { serverError } from '@/lib/db/http';

export async function GET() {
  try {
    return NextResponse.json({ settings: await getBrandSettings() });
  } catch (err) {
    return serverError('GET /api/brand', err);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    let settings;
    try {
      settings = parseBrandInput(body);
    } catch (err) {
      if (err instanceof BrandValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
      throw err;
    }
    return NextResponse.json({ settings: await saveBrandSettings(settings) });
  } catch (err) {
    return serverError('PUT /api/brand', err);
  }
}
