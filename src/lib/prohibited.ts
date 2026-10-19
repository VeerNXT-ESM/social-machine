/**
 * Find prohibited words or phrases in a piece of text.
 * Matching ignores capital letters and only counts whole words, so "charity" is found in
 * "a charity drive" but "Hero complex" is not found in "heroic". Web addresses are skipped, because an
 * article's own address can contain words the brand avoids.
 */
export function findProhibited(text: string, words: string[]): string[] {
  const clean = text.replace(/https?:\/\/\S+/gi, ' ');
  const found: string[] = [];
  for (const word of words) {
    const w = word.trim();
    if (!w) continue;
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    if (new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu').test(clean) && !found.includes(w)) found.push(w);
  }
  return found;
}

/** Everything a reader sees in one post: its text, call to action and hashtags. */
export function postReadableText(post: { text?: string; cta?: string; hashtags?: string[] }): string {
  return [post.text ?? '', post.cta ?? '', (post.hashtags ?? []).join(' ')].join('\n');
}
