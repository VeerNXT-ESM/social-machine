import OpenAI from 'openai';
import { GeneratedPostsSchema, Platform, ContentType, SinglePlatformPost, BrandSettings } from '@/types';
import { getBrandSettings } from '@/lib/db/brand';

const FIXED_RULES = `
CRITICAL MANDATORY RULES:
1. NEVER mention "Agniveer" or anything related to it anywhere in your generated text, hashtags, or UI recommendations.
2. ALWAYS use the term "Ex-Service Men (ESM)" or "veteran transition" where appropriate.
3. NEVER invent facts, fake statistics, fake testimonials, fake dates, fake URLs, or unverified claims not present in the source material.
4. Sound like a competent, human senior communications director—NOT generic AI.
5. AVOID corporate clichés and AI fluff like: "In today's fast-paced digital world", "game-changer", "paradigm shift", "unlocking potential", "dive deep", "harnessing power".
6. AVOID excessive emojis, excessive hashtags (limit 3-5 high-value hashtags), clickbait titles, or fake urgency.
7. The audience is INDIA. Write for Indian Ex-Service Men (ESM), their families and Indian employers. For "visual_direction.image_prompt", describe Indian people and Indian settings, veterans in civilian attire, and no flags, insignia or Western military imagery.
8. PRESERVE all names, figures, and factual statements provided in the source material accurately.

PLATFORM SPECIFIC GUIDELINES:
- LINKEDIN:
  Style: Editorial + Insight + Context.
  Structure: Professional opening, detailed background on the topic, explanation of why this matters to veteran career transition and VeerNXT's vision, original article/link context, clean paragraphs. Never sound like a hard sales pitch.
- X (TWITTER):
  Style: Concise, sharp, easy to scan, impactful hook.
  Can include single post or short thread (clearly formatted with 1/ 2/ 3/ if a thread is appropriate).
- INSTAGRAM:
  Style: Visual-first caption. Strong opening hook, clear punchy message, clear call to action, 4-6 curated hashtags.
- FACEBOOK:
  Style: Conversational, approachable, community-oriented. Slightly more detailed context than X, warm and encouraging tone, clear CTA.
`;

const listOrNone = (items: string[]) => (items.length ? items.join('; ') : '(none set)');

/** The instructions the AI always receives: the saved brand voice, then the rules that can never be changed. */
export function buildSystemPrompt(brand: BrandSettings): string {
  return `
You are the Lead Editorial Communications Strategist for "${brand.brand_name}".
${brand.brand_description}

BRAND VOICE (set by the team; follow it):
- Audience: ${brand.audience}
- Tone: ${listOrNone(brand.tone)}
- Prefer these terms where they fit naturally: ${listOrNone(brand.words_to_use)}
- Never use these words or ideas: ${listOrNone(brand.words_to_avoid)}
- Key messages (use only when relevant to the source, never as claims the source does not make): ${listOrNone(brand.key_messages)}
- Call to action style: ${brand.cta_style || '(none set)'}
${FIXED_RULES}`;
}

/** The system prompt for the brand voice currently saved on the Settings page. */
export async function getSystemPrompt(): Promise<string> {
  return buildSystemPrompt(await getBrandSettings());
}

/** The AI service is unavailable; the message is safe to show to the person using the app. */
export class AiError extends Error {}

export async function generateSocialContent(params: {
  title: string;
  sourceContent: string;
  sourceType: string;
  sourceUrl?: string;
  contentType: ContentType;
  campaign?: string;
  cta?: string;
  selectedPlatforms: Platform[];
  additionalInstructions?: string;
  brandSettings?: BrandSettings;
}): Promise<GeneratedPostsSchema> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new AiError('The AI service is not set up: OPENAI_API_KEY is missing on the server.');
  }

  try {
    const openai = new OpenAI({ apiKey });
    const systemPrompt = await getSystemPrompt();

    const promptText = `
Source Title: "${params.title}"
Source Type: ${params.sourceType}
Content Type: ${params.contentType}
${params.sourceUrl ? `Source URL: ${params.sourceUrl}` : ''}
${params.campaign ? `Campaign: ${params.campaign}` : ''}
${params.cta ? `Custom Call To Action: ${params.cta}` : ''}
${params.additionalInstructions ? `Additional Instructions: ${params.additionalInstructions}` : ''}

SOURCE CONTENT MATERIAL:
"""
${params.sourceContent}
"""

Target Platforms: ${params.selectedPlatforms.join(', ')}

Please generate platform-specific social posts strictly in JSON format following this exact JSON schema:
{
  "source_summary": "Short 2-sentence synthesis of source material",
  "core_message": "Core value proposition",
  "suggested_angle": "Editorial angle taken for VeerNXT audience",
  "posts": {
    "linkedin": { "text": "...", "hashtags": ["#tag1"], "cta": "..." },
    "x": { "text": "...", "hashtags": ["#tag1"], "cta": "..." },
    "instagram": { "caption": "...", "hashtags": ["#tag1"], "cta": "..." },
    "facebook": { "text": "...", "hashtags": ["#tag1"], "cta": "..." }
  },
  "visual_direction": {
    "concept": "Visual concept description",
    "image_prompt": "Detailed AI image prompt",
    "aspect_ratio": "16:9"
  }
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content returned from OpenAI');

    const parsed = JSON.parse(content) as GeneratedPostsSchema;

    // Sanity check filter to ensure no 'Agniveer' mention crept in
    return sanitizeOutput(parsed);
  } catch (err) {
    console.error('Error generating content with OpenAI:', err);
    throw new AiError('The AI service could not write the posts just now. Please try again in a moment.');
  }
}

function sanitizeOutput(output: GeneratedPostsSchema): GeneratedPostsSchema {
  const jsonStr = JSON.stringify(output);
  if (jsonStr.toLowerCase().includes('agniveer')) {
    const cleanedStr = jsonStr.replace(/agniveer/gi, 'Ex-Service Men');
    return JSON.parse(cleanedStr);
  }
  return output;
}

export async function refinePlatformPost(params: {
  platform: Platform;
  currentText: string;
  action: 'shorten' | 'expand' | 'hook' | 'professional' | 'conversational' | 'cta' | 'regenerate';
  sourceContent?: string;
  brandSettings?: BrandSettings;
}): Promise<SinglePlatformPost> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new AiError('The AI service is not set up: OPENAI_API_KEY is missing on the server.');
  }

  try {
    const openai = new OpenAI({ apiKey });
    const systemPrompt = await getSystemPrompt();

    const prompt = `
Platform: ${params.platform.toUpperCase()}
Action Requested: "${params.action}"
Current Post Text:
"""
${params.currentText}
"""

Please refine ONLY this single post according to the requested action.
Do not mention "Agniveer". Use "Ex-Service Men (ESM)".
Return JSON:
{
  "text": "Refined post text here",
  "hashtags": ["#tag1", "#tag2"],
  "cta": "Call to action string"
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      text: parsed.text || params.currentText,
      hashtags: parsed.hashtags || ['#VeerNXT', '#ExServiceMen'],
      cta: parsed.cta || 'Learn more at VeerNXT',
    };
  } catch (err) {
    console.error('Error refining post with OpenAI:', err);
    throw new AiError('The AI service could not change this post just now. Please try again in a moment.');
  }
}
