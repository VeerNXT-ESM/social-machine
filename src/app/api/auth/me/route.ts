import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Tells the page whether sign-in is in force and who is signed in. */
export async function GET() {
  const required = process.env.NODE_ENV === 'production' || process.env.REQUIRE_SIGN_IN === 'true';
  if (!required) return NextResponse.json({ required: false, email: null });
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return NextResponse.json({ required: true, email: data.user?.email ?? null });
}
