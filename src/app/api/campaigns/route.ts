import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { serverError } from '@/lib/db/http';

/** Campaigns that exist in the database, each with how many content items belong to it. */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, title, description, status, start_date, end_date, created_at, content_items(count)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    const campaigns = (data ?? []).map((c) => {
      const counted = c.content_items as unknown as { count: number }[] | null;
      const { content_items, ...rest } = c;
      void content_items;
      return { ...rest, post_count: counted?.[0]?.count ?? 0 };
    });
    return NextResponse.json({ campaigns });
  } catch (err) {
    return serverError('GET /api/campaigns', err);
  }
}
