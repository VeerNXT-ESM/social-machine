import OpenAI from 'openai';
import { GeneratedPostsSchema, Platform, ContentType, SinglePlatformPost, BrandSettings } from '@/types';

export const SYSTEM_PROMPT_VEERNXT = `
You are the Lead Editorial Communications Strategist for "VeerNXT".
VeerNXT is an AI-powered platform designed to empower Ex-Service Men (ESM) to transition into high-growth civilian careers through skill mapping, corporate employer connections, and learning pathways.

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
    // Return high-quality realistic fallback output matching user requirements
    return getFallbackGeneratedContent(params);
  }

  try {
    const openai = new OpenAI({ apiKey });

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
        { role: 'system', content: SYSTEM_PROMPT_VEERNXT },
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
    console.error('Error generating content with OpenAI, using fallback:', err);
    return getFallbackGeneratedContent(params);
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

export function getFallbackGeneratedContent(params: {
  title: string;
  sourceContent: string;
  contentType: string;
  sourceUrl?: string;
  cta?: string;
  selectedPlatforms: Platform[];
}): GeneratedPostsSchema {
  const title = params.title || 'VeerNXT Career Pathways';
  const ctaText = params.cta || 'Discover career transition opportunities at https://veernxt.com';
  const cleanSource = params.sourceContent || title;
  const linkText = params.sourceUrl ? `\n\nRead full source: ${params.sourceUrl}` : '';

  return {
    source_summary: `This announcement highlights key career transition initiatives for Ex-Service Men (ESM), focusing on structured skill mapping and corporate integration.`,
    core_message: `Ex-Service Men possess elite leadership and operational capabilities that translate directly into high-growth civilian leadership roles.`,
    suggested_angle: `Focus on mutual value creation between corporate hiring leaders and transitioning Ex-Service Men through VeerNXT.`,
    posts: {
      linkedin: {
        text: `An essential development in today's workforce landscape is how corporate leaders integrate experienced defense professionals into key management roles. Ex-Service Men (ESM) possess decades of structured leadership, operational discipline, and crisis management expertise—qualities that drive high performance in corporate environments.\n\n${cleanSource}\n\nAt VeerNXT, we work to address this transition by providing tailored upskilling programs, direct employer matching, and structured career transition frameworks. When companies hire Ex-Service Men, they gain proven leaders ready to execute on day one.${linkText}`,
        hashtags: ['#VeerNXT', '#ExServiceMen', '#CareerTransition', '#Leadership', '#CorporateTalent'],
        cta: ctaText
      },
      x: {
        text: `Bridging military excellence with civilian careers. 🇮🇳\n\n${cleanSource.substring(0, 180)}...\n\nEx-Service Men (ESM) bring unmatched discipline & operational execution to top corporate teams.\n\nLearn how VeerNXT makes transition seamless 👇\nhttps://veernxt.com`,
        hashtags: ['#VeerNXT', '#ExServiceMen', '#Careers'],
        cta: ctaText
      },
      instagram: {
        text: `Empowering Ex-Service Men (ESM) as they embark on their civilian career journey. 🚀\n\n${title}\n\n${cleanSource.substring(0, 150)}...\n\nVeerNXT bridges defense talent with corporate opportunity through skill development and direct employer connections.`,
        caption: `Empowering Ex-Service Men (ESM) as they embark on their civilian career journey. 🚀\n\n${title}\n\n${cleanSource.substring(0, 150)}...\n\nVeerNXT bridges defense talent with corporate opportunity through skill development and direct employer connections.`,
        hashtags: ['#VeerNXT', '#ExServiceMen', '#VeteranCareers', '#Leadership'],
        cta: 'Tap the link in bio to learn more about VeerNXT.'
      },
      facebook: {
        text: `We are excited to share an important step forward for Ex-Service Men (ESM) transitioning into civilian careers!\n\n${cleanSource}\n\nTransitioning from military service to the corporate world requires clear guidance, supportive networks, and skill validation. VeerNXT is built to support our veterans every step of the way—connecting talent with leading employers who value discipline and operational leadership.\n\nShare this with an Ex-Service Man or hiring manager in your network!`,
        hashtags: ['#VeerNXT', '#ExServiceMen', '#CareerTransition', '#Community'],
        cta: ctaText
      }
    },
    visual_direction: {
      concept: `A modern corporate workspace setting featuring an Ex-Service Man leading a strategic project meeting, reflecting confidence, authority, and technology integration.`,
      image_prompt: `High-resolution professional photo of a focused veteran professional in business attire collaborating with a team in a sleek glass conference room, subtle gold lighting, deep navy background accent, 4k.`,
      aspect_ratio: '16:9',
      headline_suggestion: `From Defense Excellence to Civilian Leadership`
    }
  };
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
    return getFallbackRefinedPost(params);
  }

  try {
    const openai = new OpenAI({ apiKey });

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
        { role: 'system', content: SYSTEM_PROMPT_VEERNXT },
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
    return getFallbackRefinedPost(params);
  }
}

function getFallbackRefinedPost(params: {
  platform: Platform;
  currentText: string;
  action: string;
}): SinglePlatformPost {
  let newText = params.currentText;

  if (params.action === 'shorten') {
    const lines = params.currentText.split('\n\n');
    newText = lines.slice(0, Math.max(1, lines.length - 1)).join('\n\n');
  } else if (params.action === 'expand') {
    newText = `${params.currentText}\n\nEx-Service Men (ESM) bring invaluable leadership and adaptability to corporate organizations. VeerNXT ensures this transition is backed by dedicated learning modules and employer partnerships.`;
  } else if (params.action === 'hook') {
    newText = `🔥 Ex-Service Men are shaping the future of corporate leadership.\n\n${params.currentText.replace(/^[^\n]+\n\n/, '')}`;
  } else if (params.action === 'professional') {
    newText = params.currentText.replace(/!/g, '.').replace(/🚀|🔥|✨/g, '');
  } else if (params.action === 'conversational') {
    newText = `Here is something important for our community:\n\n${params.currentText}`;
  } else if (params.action === 'cta') {
    newText = `${params.currentText}\n\n 👉 Take the next step in your career transition: Visit https://veernxt.com today.`;
  }

  return {
    text: newText,
    hashtags: ['#VeerNXT', '#ExServiceMen', '#CareerTransition'],
    cta: 'Visit https://veernxt.com to learn more.',
  };
}
