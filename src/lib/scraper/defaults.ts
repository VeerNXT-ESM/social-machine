import { SourceConfig } from './scan';

export interface DefaultSource extends SourceConfig {
  /** Why this source is useful (shown in the interface). */
  note: string;
}

/**
 * Starting sources. Five publish RSS feeds, which is the most reliable and most respectful way to read
 * them. USI has no feed, so its publications page is read directly.
 */
export const DEFAULT_SOURCES: DefaultSource[] = [
  {
    name: 'IMR Media (Indian Military Review)',
    siteUrl: 'https://imrmedia.in/',
    feedUrl: 'https://imrmedia.in/',
    kind: 'html',
    note: 'Defence news and analysis. Read from the homepage because its RSS feed was found to be full of casino spam.',
  },
  {
    name: 'MP-IDSA',
    siteUrl: 'https://idsa.in/',
    feedUrl: 'https://idsa.in/',
    kind: 'html',
    note: 'Government think tank: current issue briefs and comments. Read from the homepage because its RSS feed is years out of date.',
  },
  {
    name: 'CLAWS',
    siteUrl: 'https://claws.co.in/',
    feedUrl: 'https://claws.co.in/feed/',
    kind: 'rss',
    note: 'Army-affiliated think tank: land warfare, national security, defence reform.',
  },
  {
    name: 'National Maritime Foundation',
    siteUrl: 'https://maritimeindia.org/',
    feedUrl: 'https://maritimeindia.org/feed/',
    kind: 'rss',
    note: 'Maritime and Indo-Pacific research and events.',
  },
  {
    name: 'Indian Defence Review',
    siteUrl: 'https://indiandefencereview.com/',
    feedUrl: 'https://indiandefencereview.com/feed/',
    kind: 'rss',
    note: 'Mixed content: defence plus general-interest stories, so relevance scores matter here.',
  },
  {
    name: 'USI of India (publications)',
    siteUrl: 'https://usiofindia.org/',
    feedUrl: 'https://usiofindia.org/publication-details.php?id=1188',
    kind: 'html',
    note: 'United Service Institution journal issues and essay competitions. No feed, so the page is read directly.',
  },
];
