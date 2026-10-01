import { NextResponse } from 'next/server';
import { generateSocialContent } from '@/lib/openai';
import { generatePostImage } from '@/lib/imageGen';
import { ContentItem, PlatformPost, Platform } from '@/types';

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
      selectedPlatforms = ['linkedin', 'x', 'instagram', 'facebook'],
      additionalInstructions,
    } = body;

    if (!sourceContent && !title) {
      return NextResponse.json(
        { error: 'Please provide either source content or a title' },
        { status: 400 }
      );
    }

    // Call OpenAI / AI Generator engine
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

    // One image per content item (GPT Image 2.5 Flare, medium quality), shared by all platforms
    const vd = aiResult.visual_direction;
    const imageUrl = await generatePostImage(
      vd?.image_prompt || vd?.concept || `${title || 'VeerNXT'}: ${aiResult.core_message}`,
      vd?.aspect_ratio || '1:1'
    );

    // Construct ContentItem & PlatformPost objects
    const itemId = `item-${Date.now()}`;
    const posts: Record<string, PlatformPost> = {};

    selectedPlatforms.forEach((plat: Platform) => {
      const single = aiResult.posts[plat];
      if (single) {
        posts[plat] = {
          id: `post-${plat}-${Date.now()}`,
          content_item_id: itemId,
          platform: plat,
          provider: 'mock',
          text: single.text || single.caption || '',
          hashtags: single.hashtags || [],
          cta: single.cta || cta || 'Learn more at https://veernxt.com',
          status: 'REVIEW', // Set initial generated status to REVIEW
          media_urls: [imageUrl],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    });

    const newItem: ContentItem = {
      id: itemId,
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
      posts: posts as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Persistence happens client-side (localStorage) - the caller saves the returned item.

    return NextResponse.json({
      success: true,
      item: newItem,
      ai_result: aiResult,
    });
  } catch (err: any) {
    console.error('API /api/content/generate error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
