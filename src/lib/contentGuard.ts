import 'server-only';
import OpenAI from 'openai';
import { getSystemPrompt } from '@/lib/openai';
import { checkInsightPost } from '@/lib/insightRules';
import { getItem, updatePost } from '@/lib/db/items';
import { Platform, PlatformPost } from '@/types';
import { getBrandSettings } from '@/lib/db/brand';
import { findProhibited, postReadableText } from '@/lib/prohibited';

const MAX_REPAIRS = 2;

export interface GuardReport {
  platform: Platform;
  /** Problems found in the original text. */
  before: string[];
  /** Problems left after repair attempts (empty means the post now passes). */
  after: string[];
  repaired: boolean;
}

async function rewrite(post: PlatformPost, issues: string[], sourceName: string, articleText: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') return null;

  const openai = new OpenAI({ apiKey });
  const systemPrompt = await getSystemPrompt();
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Rewrite this ${post.platform.toUpperCase()} post so it fixes every problem listed. Keep the same platform style and keep it faithful to the article.

PROBLEMS TO FIX:
${issues.map((i) => `- ${i}`).join('\n')}

RULES THAT STILL APPLY:
- Write in your own words, credit ${sourceName} as the source in the text, use only facts and figures from the article.
- Do not claim that the topic creates jobs, opportunities, demand for skills or career paths for Ex-Service Men.
- Do not mention VeerNXT. No hashtags in the text. Never use the word "Agniveer".
- Include one genuine question to the reader (not required on X).

ARTICLE (source: ${sourceName}):
"""
${articleText}
"""

CURRENT POST:
"""
${post.text}
"""

Return JSON only: {"text": "the rewritten post"}`,
      },
    ],
  });
  try {
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}');
    return typeof parsed.text === 'string' && parsed.text.trim() ? parsed.text.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Check every post of an item made from a source article against the insight rules and rewrite
 * any that fail (up to two attempts each), saving the improved text. Returns what was found and fixed.
 */
export async function enforceInsightRules(itemId: string, sourceName: string): Promise<GuardReport[]> {
  const item = await getItem(itemId);
  if (!item) return [];
  const article = item.source_content;
  const reports: GuardReport[] = [];

  for (const [platform, post] of Object.entries(item.posts ?? {}) as [Platform, PlatformPost][]) {
    const check = (text: string) =>
      checkInsightPost({ platform, text, hashtags: post.hashtags, sourceName, articleText: article });

    let text = post.text;
    const before = check(text);
    let issues = before;
    let attempts = 0;

    while (issues.length > 0 && attempts < MAX_REPAIRS) {
      attempts += 1;
      const candidate = await rewrite({ ...post, text }, issues, sourceName, article);
      if (!candidate) break;
      text = candidate;
      issues = check(text);
    }

    const repaired = text !== post.text;
    if (repaired) await updatePost(itemId, platform, { text });
    reports.push({ platform, before, after: issues, repaired });
  }
  return reports;
}


export interface ProhibitedReport {
  platform: Platform;
  /** The prohibited words found in the original post. */
  found: string[];
  /** Words still present after the repair attempts (empty means the post is clean now). */
  remaining: string[];
}

/** Ask the AI to rewrite one post without the listed words. Returns null if it could not. */
export async function rewriteWithoutWords(
  post: { platform: Platform; text: string; cta?: string; hashtags?: string[] },
  words: string[]
): Promise<{ text: string; cta: string; hashtags: string[] } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') return null;
  const openai = new OpenAI({ apiKey });
  const systemPrompt = await getSystemPrompt();
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Rewrite this ${post.platform.toUpperCase()} post so that none of these words or phrases appear anywhere in it (text, call to action or hashtags): ${words.map((w) => `"${w}"`).join(', ')}.
Keep the meaning, the facts, the platform style and any web address exactly as they are. Do not add new claims.

TEXT:
"""
${post.text}
"""
CALL TO ACTION: ${post.cta ?? ''}
HASHTAGS: ${(post.hashtags ?? []).join(' ')}

Return JSON only: {"text": "...", "cta": "...", "hashtags": ["#tag"]}`,
      },
    ],
  });
  try {
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}');
    if (typeof parsed.text !== 'string' || !parsed.text.trim()) return null;
    return {
      text: parsed.text.trim(),
      cta: typeof parsed.cta === 'string' ? parsed.cta.trim() : post.cta ?? '',
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.filter((h: unknown): h is string => typeof h === 'string') : post.hashtags ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Check every post of an item for the brand's prohibited words and rewrite any that contain them
 * (up to two attempts each). Returns what was found; `remaining` lists words the AI could not remove.
 */
export async function enforceProhibitedWords(itemId: string): Promise<ProhibitedReport[]> {
  const item = await getItem(itemId);
  if (!item) return [];
  const { words_to_avoid } = await getBrandSettings();
  const reports: ProhibitedReport[] = [];

  for (const [platform, post] of Object.entries(item.posts ?? {}) as [Platform, PlatformPost][]) {
    const found = findProhibited(postReadableText(post), words_to_avoid);
    if (found.length === 0) continue;

    let current = { text: post.text, cta: post.cta, hashtags: post.hashtags };
    let remaining = found;
    for (let attempt = 0; attempt < MAX_REPAIRS && remaining.length > 0; attempt++) {
      const candidate = await rewriteWithoutWords({ platform, ...current }, remaining).catch(() => null);
      if (!candidate) break;
      current = candidate;
      remaining = findProhibited(postReadableText(current), words_to_avoid);
    }
    if (remaining.length < found.length || remaining.length === 0) {
      await updatePost(itemId, platform, { text: current.text, cta: current.cta, hashtags: current.hashtags });
    }
    reports.push({ platform, found, remaining });
  }
  return reports;
}
