import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Check an email and password with Supabase and set the session cookie. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // The same message whatever the reason, so the page never reveals which emails exist.
    const limited = error.status === 429;
    return NextResponse.json(
      { error: limited ? 'Too many attempts. Please wait a few minutes and try again.' : 'The email or password is not correct.' },
      { status: limited ? 429 : 401 }
    );
  }
  return NextResponse.json({ success: true });
}
