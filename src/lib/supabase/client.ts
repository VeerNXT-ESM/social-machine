import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // NEXT_PUBLIC_* names are required for the browser bundle; the publishable key replaces the legacy anon key.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-key';

  return createBrowserClient(supabaseUrl, supabaseKey);
}
