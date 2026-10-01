import { NextResponse } from 'next/server';
import { refinePlatformPost } from '@/lib/openai';

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

    const refined = await refinePlatformPost({
      platform,
      currentText,
      action,
      sourceContent,
    });

    return NextResponse.json({
      success: true,
      post: refined,
    });
  } catch (err) {
    console.error('API /api/content/refine error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to refine post' },
      { status: 500 }
    );
  }
}
