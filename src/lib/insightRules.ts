import { xLength } from './xText';
import type { Platform } from '@/types';

/**
 * Rules for "insight" posts: short posts based on an article from an outside source.
 * Shared by the composer (instructions to the AI) and the checker (verification of the result),
 * so what we ask for and what we test can never drift apart. No server-only code here.
 */

// Claims the source articles do not make, and words our brand rules do not allow.
export const BANNED_PHRASES =
  /(opens?|opening) (the )?doors?|in[- ]demand|career paths?|\bopportunit(y|ies)\b|\btransition(s|ing)?\b|civilian careers?|stepping[- ]stone|agniveer/i;

export const X_LIMIT = 280;

/** The name as it should appear in a credit line, without any bracketed expansion. */
export function shortSourceName(name: string): string {
  return name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
}

/** Plain-language instructions sent to the AI when writing from an article. */
export function insightInstructions(sourceName: string, subject?: string): string {
  const short = shortSourceName(sourceName);
  return [
    `This post is a short insight based on an article from ${short}.`,
    'Rules:',
    '(1) Write entirely in your own words; never copy sentences or quote at length.',
    `(2) Credit ${short} as the source inside the post text.`,
    '(3) Use only facts, names and figures that appear in the article; invent nothing.',
    "(4) Summarise two or three of the article's own points accurately and plainly.",
    '(5) Do NOT state or imply that the topic creates jobs, opportunities, demand for skills or career paths for Ex-Service Men; the article does not say so. ' +
      "Avoid phrases such as 'opens doors', 'in demand', 'career path', 'transition', 'opportunity' and 'civilian career'.",
    '(6) Do not mention VeerNXT inside the post text; the call to action does that.',
    '(7) Include one genuine question that invites serving personnel, Ex-Service Men and their families to share their view or experience (not required on X).',
    '(8) Do not put hashtags inside the post text.',
    'Never use the word "Agniveer".',
    subject ? `Subject area for context: ${subject}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

const numbersIn = (t: string) => new Set(t.match(/\d[\d,.]*\d|\d/g) ?? []);

/** Returns what is wrong with a post, as plain instructions for fixing it. Empty means it passes. */
export function checkInsightPost(args: {
  platform: Platform;
  text: string;
  hashtags: string[];
  sourceName: string;
  articleText: string;
}): string[] {
  const { platform, text, hashtags, sourceName, articleText } = args;
  const issues: string[] = [];

  const banned = [...new Set([...text.matchAll(new RegExp(BANNED_PHRASES.source, 'gi'))].map((m) => m[0].toLowerCase()))];
  if (banned.length > 0) issues.push(`Remove these phrases and any claim they carry: ${banned.map((b) => `"${b}"`).join(', ')}.`);

  if (!text.toLowerCase().includes(shortSourceName(sourceName).toLowerCase())) {
    issues.push(`Credit "${shortSourceName(sourceName)}" as the source in the text.`);
  }
  if (platform !== 'x' && !text.includes('?')) issues.push('Include one genuine question to the reader.');
  if (/veernxt/i.test(text)) issues.push('Do not mention VeerNXT in the text.');
  if (/\[(link|url|insert[^\]]*|read more|here)\]/i.test(text)) issues.push('Remove placeholder text such as [link]; the link is added separately.');
  // Hashtags belong in their own field everywhere except X, where they may sit inside the tweet.
  if (platform !== 'x' && /#\w/.test(text)) issues.push('Remove hashtags from the text.');

  const known = numbersIn(articleText);
  const invented = [...numbersIn(text)].filter((n) => !known.has(n) && !['1', '2', '3'].includes(n));
  if (invented.length > 0) issues.push(`These figures do not appear in the article, remove them: ${invented.join(', ')}.`);

  if (platform === 'x') {
    // Count only hashtags that are not already inside the text
    const extra = hashtags.filter((h) => !text.includes(h));
    const total = xLength(text) + (extra.length ? extra.join(' ').length + 1 : 0);
    if (total > X_LIMIT) issues.push(`Shorten it: the text plus hashtags must be at most ${X_LIMIT} characters (now ${total}).`);
  }
  return issues;
}
