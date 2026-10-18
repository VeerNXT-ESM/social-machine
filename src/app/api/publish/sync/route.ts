import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updatePost } from '@/lib/db/items';
import { getBufferPostState, isBufferId } from '@/lib/publishing/buffer';
import { serverError } from '@/lib/db/http';
import type { Platform } from '@/types';

/**
 * Ask Buffer what happened to every scheduled post and update ours to match:
 * sent -> Published, failed -> Failed, deleted in Buffer -> back to Approved.
 */
export async function POST() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('platform_posts')
      .select('content_item_id, platform, external_post_id')
      .eq('status', 'SCHEDULED');
    if (error) throw new Error(error.message);

    const rows = (data ?? []).filter((r) => isBufferId(r.external_post_id));
    let changed = 0;
    const problems: string[] = [];

    for (const r of rows) {
      try {
        const s = await getBufferPostState(r.external_post_id as string);
        const item = r.content_item_id as string;
        const platform = r.platform as Platform;
        if (s.state === 'published') {
          await updatePost(item, platform, { status: 'PUBLISHED', published_at: s.sentAt, external_url: s.externalUrl });
          changed++;
        } else if (s.state === 'failed') {
          await updatePost(item, platform, { status: 'FAILED', error_message: s.error });
          changed++;
        } else if (s.state === 'gone') {
          await updatePost(item, platform, { status: 'APPROVED', scheduled_at: null, external_post_id: null } as never);
          changed++;
        }
      } catch (err) {
        problems.push(err instanceof Error ? err.message : 'lookup failed');
      }
    }
    return NextResponse.json({ checked: rows.length, changed, problems: problems.slice(0, 3) });
  } catch (err) {
    return serverError('POST /api/publish/sync', err);
  }
}
