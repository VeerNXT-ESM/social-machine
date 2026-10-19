import 'server-only';
import OpenAI from 'openai';
import { getSystemPrompt } from '@/lib/openai';
import { checkInsightPost } from '@/lib/insightRules';
import { getItem, updatePost } from '@/lib/db/items';
import { Platform, PlatformPost } from '@/types';

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
