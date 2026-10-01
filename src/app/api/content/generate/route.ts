import { NextResponse } from 'next/server';
import { generateSocialContent } from '@/lib/openai';
import { generatePostImage } from '@/lib/imageGen';
import { createItem, NewPost } from '@/lib/db/items';
import { isPlatform, serverError } from '@/lib/db/http';
import { Platform } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      sourceContent,
      sourceType = 'idea',
      sourceUrl,
      contentType = 'Announcement',
      campaign,
      cta,
      additionalInstructions,
    } = body;

    const requested: unknown[] = Array.isArray(body.selectedPlatforms)
      ? body.selectedPlatforms
      : ['linkedin', 'x', 'instagram', 'facebook'];
    const selectedPlatforms = requested.filter(isPlatform) as Platform[];

    if (!sourceContent && !title) {
      return NextResponse.json({ error: 'Please provide either source content or a title' }, { status: 400 });
    }
    if (selectedPlatforms.length === 0) {
      return NextResponse.json({ error: 'Select at least one channel' }, { status: 400 });
    }

    const aiResult = await generateSocialContent({
      title: title || 'VeerNXT Post',
      sourceContent: sourceContent || title,
      sourceType,
      sourceUrl,
      contentType,
      campaign,
      cta,
      selectedPlatforms,
      additionalInstructions,
    });

    // One image per content item, shared by all of its platform posts
    const vd = aiResult.visual_direction;
    const imageUrl = await generatePostImage(
      vd?.image_prompt || vd?.concept || `${title || 'VeerNXT'}: ${aiResult.core_message}`,
      vd?.aspect_ratio || '1:1'
    );

    const posts: NewPost[] = [];
    for (const platform of selectedPlatforms) {
      const single = aiResult.posts[platform];
      if (!single) continue;
      posts.push({
        platform,
        provider: 'mock',
        text: single.text || single.caption || '',
        hashtags: single.hashtags || [],
        cta: single.cta || cta || 'Learn more at https://veernxt.com',
        status: 'REVIEW',
        media_urls: [imageUrl],
      });
    }

    const item = await createItem({
      title: title || 'New VeerNXT Content',
      source_type: sourceType,
      source_content: sourceContent || title,
      source_url: sourceUrl,
      master_idea: aiResult.core_message,
      content_type: contentType,
      campaign_name: campaign,
      status: 'REVIEW',
      selected_platforms: selectedPlatforms,
      visual_direction: aiResult.visual_direction,
      posts,
    });

    return NextResponse.json({ success: true, item, ai_result: aiResult });
  } catch (err) {
    return serverError('POST /api/content/generate', err);
  }
}
