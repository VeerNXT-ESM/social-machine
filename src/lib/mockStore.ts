import { Campaign, MediaItem, BrandSettings, AnalyticsSummary } from '@/types';

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brand_name: 'VeerNXT',
  brand_description: 'VeerNXT is a dedicated platform connecting Ex-Service Men (ESM) with high-impact civilian careers, skills upgrading, and forward-thinking corporate employers.',
  audience: 'Ex-Service Men (ESM), corporate talent leaders, hiring managers, vocational training partners, and military transition advocates.',
  tone: ['Professional', 'Supportive', 'Confident', 'Practical', 'Human'],
  words_to_use: ['Ex-Service Men', 'ESM', 'Career Transition', 'Leadership', 'Agility', 'Civilian Opportunities', 'Empowerment'],
  words_to_avoid: ['Agniveer', 'Charity', 'Unskilled', 'Hero complex', 'Cheap labor', 'Outdated jargon'],
  key_messages: [
    'Ex-Service Men possess unmatched operational discipline, strategic agility, and leadership.',
    'VeerNXT bridges defense experience with high-growth civilian industry roles.'
  ],
  cta_style: 'Clear, direct invitation to join or partner with VeerNXT for career transition.',
  publishing_mode: 'mock',
  timezone: 'Asia/Kolkata',
};

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    title: 'VeerNXT Platform Launch',
    description: 'National launch campaign introducing VeerNXT to Ex-Service Men and hiring partners.',
    status: 'ACTIVE',
    start_date: new Date().toISOString(),
    post_count: 4,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'camp-2',
    title: 'Employer Partner Spotlight',
    description: 'Showcasing corporate organizations creating structured career paths for veterans.',
    status: 'PLANNED',
    post_count: 2,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'camp-3',
    title: 'Upskilling & Career Pathways',
    description: 'Educational resources on tech certifications and executive transition courses.',
    status: 'ACTIVE',
    post_count: 3,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  }
];

export const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'med-1',
    filename: 'veernxt-launch-hero.png',
    type: 'image',
    mime_type: 'image/png',
    size_bytes: 420000,
    width: 1200,
    height: 630,
    storage_path: '/logo.png',
    public_url: '/logo.png',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'med-2',
    filename: 'veteran-leadership.jpg',
    type: 'image',
    mime_type: 'image/jpeg',
    size_bytes: 650000,
    width: 1080,
    height: 1080,
    storage_path: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1080&auto=format&fit=crop&q=80',
    public_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1080&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'med-3',
    filename: 'career-upskilling.jpg',
    type: 'image',
    mime_type: 'image/jpeg',
    size_bytes: 512000,
    width: 1200,
    height: 630,
    storage_path: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
    public_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

export const MOCK_ANALYTICS: AnalyticsSummary = {
  total_impressions: 48500,
  total_likes: 3420,
  total_comments: 489,
  total_shares: 612,
  total_clicks: 1840,
  total_saves: 295,
  by_platform: {
    linkedin: { posts_count: 14, impressions: 24500, engagement: 8.4 },
    x: { posts_count: 22, impressions: 12800, engagement: 5.2 },
    instagram: { posts_count: 8, impressions: 7100, engagement: 9.1 },
    facebook: { posts_count: 10, impressions: 4100, engagement: 6.8 },
  }
};

/**
 * Browser storage is now used only for brand settings. Content items and posts are stored in the
 * database through the API routes (see src/lib/db and src/lib/api.ts).
 */
class LocalRepository {
  private brandKey = 'veernxt_brand_settings';

  getBrandSettings(): BrandSettings {
    if (typeof window === 'undefined') return DEFAULT_BRAND_SETTINGS;
    const raw = localStorage.getItem(this.brandKey);
    return raw ? JSON.parse(raw) : DEFAULT_BRAND_SETTINGS;
  }

  saveBrandSettings(settings: BrandSettings): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.brandKey, JSON.stringify(settings));
    }
  }
}

export const mockRepo = new LocalRepository();
