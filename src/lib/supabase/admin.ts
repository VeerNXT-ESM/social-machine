import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only client authenticated with the Supabase secret key.
 * It bypasses Row Level Security, so use it only in API routes and server code.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env');
  }
  return createSupabaseClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
