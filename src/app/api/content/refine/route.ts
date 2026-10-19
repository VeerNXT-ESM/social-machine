import { NextResponse } from 'next/server';
import { AiError, refinePlatformPost } from '@/lib/openai';
import { rewriteWithoutWords } from '@/lib/contentGuard';
import { getBrandSettings } from '@/lib/db/brand';
import { findProhibited, postReadableText } from '@/lib/prohibited';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { platform, currentText, action, sourceContent } = body;

    if (!platform || !currentText || !action) {
      return NextResponse.json(
        { error: 'Missing platform, currentText, or action' },
        { status: 400 }
      );
    }

    let refined = await refinePlatformPost({
      platform,
      currentText,
      action,
      sourceContent,
    });

    // Brand rule: the new version must not contain a prohibited word either
    const { words_to_avoid } = await getBrandSettings();
    let found = findProhibited(postReadableText(refined), words_to_avoid);
    for (let attempt = 0; attempt < 2 && found.length > 0; attempt++) {
      const fixed = await rewriteWithoutWords({ platform, text: refined.text ?? '', cta: refined.cta, hashtags: refined.hashtags }, found).catch(() => null);
      if (!fixed) break;
      refined = { ...refined, ...fixed };
      found = findProhibited(postReadableText(refined), words_to_avoid);
    }

    return NextResponse.json({
      success: true,
      post: refined,
      prohibited_remaining: found,
    });
  } catch (err) {
    if (err instanceof AiError) return NextResponse.json({ error: err.message }, { status: 502 });
    console.error('API /api/content/refine error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to refine post' },
      { status: 500 }
    );
  }
}
