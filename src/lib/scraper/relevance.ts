/**
 * Rule-based relevance for the VeerNXT audience (Ex-Service Men, their families, employers).
 * Transparent on purpose: every point comes from a listed keyword, so the reason for a score is
 * always visible in the interface. No AI call, no cost.
 */

interface Rule {
  label: string;
  pattern: RegExp;
  points: number;
}

const RULES: Rule[] = [
  // Directly about the audience
  { label: 'veterans', pattern: /\bveterans?\b/i, points: 30 },
  { label: 'ex-servicemen', pattern: /\bex[- ]?service ?(men|man|personnel)\b|\bESM\b/i, points: 30 },
  { label: 'resettlement', pattern: /\bresettle(ment)?\b|\bDGR\b|directorate general of resettlement/i, points: 30 },
  { label: 'second career', pattern: /second career|career transition|post[- ]retirement|lateral (entry|induction)/i, points: 25 },
  { label: 'pension', pattern: /\bpension(s|ers)?\b|\bOROP\b|one rank one pension/i, points: 20 },
  { label: 'welfare', pattern: /\bECHS\b|\bSainik\b|war widow|ex-servicemen welfare|\bKSB\b|kendriya sainik/i, points: 25 },
  { label: 'employment', pattern: /employab|employment|reskill|upskill|skill(ing| development)|vocational/i, points: 15 },
  { label: 'defence personnel', pattern: /armed forces personnel|defence personnel|service(men|women)|soldiers?\b|jawans?/i, points: 10 },
  // Context: useful background for the community
  { label: 'recruitment', pattern: /recruit(ment|ing)|induction|\bPBOR\b|short service commission/i, points: 8 },
  { label: 'training', pattern: /\btraining\b|leadership|\bcourse\b|staff college|\bNDA\b|\bIMA\b/i, points: 6 },
  { label: 'defence reform', pattern: /defence (reform|policy|budget|ministry)|theatre command|atmanirbhar|make in india/i, points: 6 },
  { label: 'defence news', pattern: /\b(army|navy|air force|military|defence)\b/i, points: 4 },
];

// Terms our brand rules do not allow in generated posts. Sources may discuss them, so the link is
// kept but flagged to make sure the wording is not repeated in published content.
const RESTRICTED = /agniveer|agnipath/i;

export interface Relevance {
  score: number; // 0 to 100
  matched: string[];
  mentionsRestrictedTerm: boolean;
}

export function scoreRelevance(title: string, summary: string, categories: string[] = []): Relevance {
  const matched = new Set<string>();
  let score = 0;

  for (const rule of RULES) {
    // A match in the title counts double: titles say what an article is about.
    const inTitle = rule.pattern.test(title);
    const inBody = rule.pattern.test(summary) || categories.some((c) => rule.pattern.test(c));
    if (inTitle) {
      score += rule.points * 2;
      matched.add(rule.label);
    } else if (inBody) {
      score += rule.points;
      matched.add(rule.label);
    }
  }

  return {
    score: Math.min(100, score),
    matched: [...matched],
    mentionsRestrictedTerm: RESTRICTED.test(title) || RESTRICTED.test(summary),
  };
}
