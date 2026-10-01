import 'server-only';
import { NextResponse } from 'next/server';
import { Platform, PostStatus } from '@/types';

export const PLATFORMS: Platform[] = ['linkedin', 'x', 'instagram', 'facebook'];
export const STATUSES: PostStatus[] = ['DRAFT', 'GENERATING', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED'];

export const isPlatform = (v: unknown): v is Platform => typeof v === 'string' && (PLATFORMS as string[]).includes(v);
export const isStatus = (v: unknown): v is PostStatus => typeof v === 'string' && (STATUSES as string[]).includes(v);

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(what = 'Item') {
  return NextResponse.json({ error: `${what} not found` }, { status: 404 });
}

/** Log the real error on the server and return a generic message to the browser. */
export function serverError(route: string, err: unknown) {
  console.error(`${route} failed:`, err);
  return NextResponse.json({ error: 'Something went wrong while saving. Please try again.' }, { status: 500 });
}
