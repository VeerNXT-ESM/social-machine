import type { Platform } from '@/types';
import { X_LINK_LENGTH, X_MAX, xLength } from './xText';

const PLACEHOLDER = /\s*[\[(](?:link|url|insert[^\])]*|read more|here|article link)[\])]/gi;

/**
 * Return the post text with the article's address at the end.
 *  - Placeholders such as "[link]" are removed first.
 *  - Instagram captions are left alone: a link in a caption cannot be tapped.
 *  - On X the address counts as 23 characters; if the text is too long to leave room, it is shortened at a word.
 * Text that already contains the address is returned unchanged.
 */
export function withSourceLink(platform: Platform, text: string, url: string): string {
  const cleaned = text.replace(PLACEHOLDER, '').trim();
  if (platform === 'instagram' || !url) return cleaned;
  if (cleaned.includes(url)) return cleaned;

  if (platform === 'x') {
    const room = X_MAX - X_LINK_LENGTH - 2; // two characters for the blank line
    let body = cleaned;
    if (xLength(body) > room) {
      body = body.slice(0, room - 1).replace(/\s+\S*$/, '').replace(/[.,;:!?\s]+$/, '') + '…';
    }
    return `${body}\n\n${url}`;
  }
  return `${cleaned}\n\nRead the full article: ${url}`;
}
