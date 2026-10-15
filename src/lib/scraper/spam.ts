/**
 * Safety filters applied to every scan. Some sites in this niche have been hijacked with gambling and
 * adult SEO posts (seen in a real feed during testing), and those must never reach the interface.
 */
const SPAM =
  /\b(casino|casinos|betting|sportsbook|bookmaker|slots?|poker|gambl\w*|jackpot|roulette|lottery|pin-?up|1xbet|mostbet|melbet|aviator|bahis|yat[ıi]rma|crypto (casino|exchange)|payday loans?|viagra|cialis|escort|porn\w*|adult chat|xxx|forex signals?|binary options|sex (cam|chat))\b/i;

export function looksLikeSpam(title: string, summary: string, url: string): boolean {
  return SPAM.test(title) || SPAM.test(summary) || SPAM.test(decodeURIComponent(url).replace(/[-_/]+/g, ' '));
}

/** A link must stay on the source's own site (or a subdomain of it). */
export function isSameSite(linkUrl: string, siteUrl: string): boolean {
  try {
    const link = new URL(linkUrl).hostname.replace(/^www\./, '');
    const site = new URL(siteUrl).hostname.replace(/^www\./, '');
    return link === site || link.endsWith('.' + site) || site.endsWith('.' + link);
  } catch {
    return false;
  }
}
