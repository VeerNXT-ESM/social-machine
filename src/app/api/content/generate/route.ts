import { NextResponse } from 'next/server';
import { addSourceLink } from '@/lib/db/items';
import { AiError, generateSocialContent } from '@/lib/openai';
import { generatePostImage } from '@/lib/imageGen';
import { createItem, NewPost } from '@/lib/db/items';
import { getSourceNameForItem, updateLink } from '@/lib/db/sources';
import { enforceInsightRules, enforceProhibitedWords } from '@/lib/contentGuard';
import { getItem } from '@/lib/db/items';
import { isOwnMediaUrl } from '@/lib/db/media';
import { badRequest, isPlatform, serverError } from '@/lib/db/http';
import { Platform } from '@/types';

// Generating text, an image and (for source articles) rule checks can take a while.
export const maxDuration = 120;

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
      sourceLinkId,
      imageUrl: ownImageUrl,
    } = body;

    const requested: unknown[] = Array.isArray(body.selectedPlatforms)
      ? body.selectedPlatforms
      : ['linkedin', 'x', 'instagram', 'facebook'];
    const selectedPlatforms = requested.filter(isPlatform) as Platform[];

    if (!sourceContent && !title) {
      return NextResponse.json({ error: 'Please provide either source content or a title' }, { status: 400 });
    }
    if (ownImageUrl !== undefined && ownImageUrl !== null && !isOwnMediaUrl(ownImageUrl)) {
      return badRequest('The image must be one uploaded through this app.');
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

    // One image per content item, shared by all of its platform posts.
    // A person's own uploaded image replaces the AI image (and saves its cost).
    const vd = aiResult.visual_direction;
    const imageUrl = ownImageUrl
      ? ownImageUrl
      : await generatePostImage(
          vd?.image_prompt || vd?.concept || `${title || 'VeerNXT'}: ${aiResult.core_message}`,
          vd?.aspect_ratio || '1:1',
          title || 'VeerNXT post'
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
        cta: single.cta || cta || 'Learn more at https://veernxt.in',
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

    // Content created from a discovered link: mark the link as used (best effort; the content is already saved)
    let finalItem = item;
    let guard: Awaited<ReturnType<typeof enforceInsightRules>> | null = null;
    if (typeof sourceLinkId === 'string' && sourceLinkId) {
      try {
        await updateLink(sourceLinkId, { status: 'used', content_item_id: item.id });
        // Posts made from an outside article are checked against the insight rules and fixed if needed
        const sourceName = await getSourceNameForItem(item.id);
        if (sourceName) {
          guard = await enforceInsightRules(item.id, sourceName);
          finalItem = (await getItem(item.id)) ?? item;
        }
      } catch (err) {
        console.error('Source link handling failed (the content itself is saved):', err);
      }
    }

    // Brand rule: no prohibited word may remain in any post (rewritten if the AI used one)
    let brandCheck: Awaited<ReturnType<typeof enforceProhibitedWords>> = [];
    try {
      brandCheck = await enforceProhibitedWords(finalItem.id);
      if (brandCheck.length > 0) finalItem = (await getItem(finalItem.id)) ?? finalItem;
    } catch (err) {
      console.error('Prohibited-word check failed (the content itself is saved):', err);
    }

    // The article's own address goes at the end of each post (after any rewriting, so it cannot be lost)
    if (typeof sourceUrl === 'string' && /^https?:\/\//.test(sourceUrl)) {
      try {
        const linked = await addSourceLink(finalItem.id, sourceUrl);
        if (linked) finalItem = linked;
      } catch (err) {
        console.error('Adding the article link failed (the content itself is saved):', err);
      }
    }

    return NextResponse.json({ success: true, item: finalItem, ai_result: aiResult, guard, brand_check: brandCheck });
  } catch (err) {
    if (err instanceof AiError) return NextResponse.json({ error: err.message }, { status: 502 });
    return serverError('POST /api/content/generate', err);
  }
}
