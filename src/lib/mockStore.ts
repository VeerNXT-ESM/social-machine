import { ContentItem, Campaign, MediaItem, BrandSettings, AnalyticsSummary, Platform, PostStatus, PlatformPost } from '@/types';

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

export const INITIAL_CONTENT_ITEMS: ContentItem[] = [
  {
    id: 'item-1',
    campaign_id: 'camp-1',
    campaign_name: 'VeerNXT Platform Launch',
    title: 'Launching VeerNXT',
    source_type: 'announcement' as any,
    source_content: 'We are launching VeerNXT, a platform designed to help Ex-Service Men transition into civilian careers through jobs, learning, skills development and employer connections.',
    content_type: 'Announcement',
    status: 'APPROVED',
    selected_platforms: ['linkedin', 'x', 'instagram', 'facebook'],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    visual_direction: {
      concept: 'A forward-looking professional Ex-Service Man stepping onto a modern tech campus bathed in warm morning light.',
      image_prompt: 'Cinematic corporate portrait of a confident veteran professional in business attire standing outside a modern glass office building at sunrise, high-tech, gold and deep navy theme.',
      aspect_ratio: '16:9',
      headline_suggestion: 'Bridging Military Leadership with Civilian Innovation'
    },
    posts: {
      linkedin: {
        id: 'post-1-li',
        content_item_id: 'item-1',
        platform: 'linkedin',
        provider: 'mock',
        text: `An essential development in the national workforce landscape is how we enable our defense personnel to transition into corporate roles. Ex-Service Men (ESM) bring unmatched crisis leadership, strategic execution, and operational discipline, yet navigating civilian job markets can present unique challenges.\n\nThis is precisely the mission behind VeerNXT. We are launching VeerNXT as a comprehensive platform dedicated to supporting Ex-Service Men through targeted upskilling, industry-recognized learning pathways, direct job matching, and strategic employer partnerships.\n\nBy connecting corporate India with world-class veteran talent, we create lasting value for both organizations and transitioning professionals. Learn more about our ecosystem and how your organization can participate.`,
        hashtags: ['#VeerNXT', '#ExServiceMen', '#VeteranCareers', '#Leadership', '#CorporateTalent'],
        cta: 'Explore career transition pathways at https://veernxt.com',
        status: 'APPROVED',
        scheduled_at: new Date(Date.now() + 86400000 * 1).toISOString(),
        media_urls: ['/logo.png'],
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      },
      x: {
        id: 'post-1-x',
        content_item_id: 'item-1',
        platform: 'x',
        provider: 'mock',
        text: `We are proud to launch VeerNXT! 🚀\n\nOur mission: Empower Ex-Service Men (ESM) to transition into thriving civilian careers with direct job matching, upskilling modules & employer networks.\n\nBridge military excellence with civilian leadership.👇\nhttps://veernxt.com`,
        hashtags: ['#VeerNXT', '#ExServiceMen', '#CareerTransition'],
        cta: 'Join VeerNXT today: https://veernxt.com',
        status: 'APPROVED',
        scheduled_at: new Date(Date.now() + 86400000 * 1).toISOString(),
        media_urls: ['/logo.png'],
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      },
      instagram: {
        id: 'post-1-ig',
        content_item_id: 'item-1',
        platform: 'instagram',
        provider: 'mock',
        text: `From defending the nation to leading civilian innovation. 🇮🇳✨\n\nWe are launching VeerNXT — a purpose-built platform helping Ex-Service Men (ESM) transition into corporate roles, technology careers, and entrepreneurial ventures.\n\nThrough structured skill mapping, corporate mentorship, and direct hiring drives, VeerNXT ensures no veteran walks the transition journey alone.`,
        hashtags: ['#VeerNXT', '#ExServiceMen', '#VeteranCareers', '#Empowerment', '#TransitionJourney'],
        cta: 'Tap the link in bio to learn more!',
        status: 'APPROVED',
        scheduled_at: new Date(Date.now() + 86400000 * 1).toISOString(),
        media_urls: ['https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1080&auto=format&fit=crop&q=80'],
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      },
      facebook: {
        id: 'post-1-fb',
        content_item_id: 'item-1',
        platform: 'facebook',
        provider: 'mock',
        text: `Welcome to VeerNXT! Today marks an important milestone as we officially launch our platform dedicated to Ex-Service Men (ESM) across India.\n\nTransitioning from military service to civilian employment requires clear pathways, supportive networks, and relevant skills. VeerNXT brings all these elements together — connecting veterans with top employers, specialized training courses, and career mentors.\n\nWhether you are an Ex-Service Man looking for your next career move or an employer seeking proven leaders, VeerNXT is built for you. Join our growing community today!`,
        hashtags: ['#VeerNXT', '#ExServiceMen', '#CareerTransition', '#Community'],
        cta: 'Visit https://veernxt.com to join the initiative.',
        status: 'APPROVED',
        scheduled_at: new Date(Date.now() + 86400000 * 1).toISOString(),
        media_urls: ['/logo.png'],
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      }
    }
  },
  {
    id: 'item-2',
    campaign_id: 'camp-2',
    campaign_name: 'Employer Partner Spotlight',
    title: '5 Strategic Skills Ex-Service Men Bring to Corporate Tech',
    source_type: 'article',
    source_content: 'Military personnel develop specialized capabilities in logistical strategy, cybersecurity operations, high-stress decision making, team communication, and rapid technology adaptation.',
    content_type: 'Educational',
    status: 'REVIEW',
    selected_platforms: ['linkedin', 'x', 'facebook'],
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 18000000).toISOString(),
    visual_direction: {
      concept: 'Infographic style breakdown highlighting 5 core transition skills.',
      image_prompt: 'Sleek dark tech background with gold icons highlighting Leadership, Security, Agility, Operations, and Discipline.',
      aspect_ratio: '1:1'
    },
    posts: {
      linkedin: {
        id: 'post-2-li',
        content_item_id: 'item-2',
        platform: 'linkedin',
        provider: 'mock',
        text: `When corporate technology firms look for resilient talent, technical skills are only half the equation. Execution discipline under pressure is the critical multiplier.\n\nEx-Service Men (ESM) bring 5 distinct advantages to fast-growing tech teams:\n1. Mission-Critical Decision Making\n2. Advanced Logistics & Supply Chain Security\n3. Cross-Functional Command & Communication\n4. Rapid Adaptability to Complex Systems\n5. Unwavering Integrity & Ownership\n\nAt VeerNXT, we help corporate talent teams tap into this talent pool through tailored onboarding programs.`,
        hashtags: ['#ExServiceMen', '#TechCareers', '#TalentAcquisition', '#VeerNXT'],
        cta: 'Discover how to hire ESM leaders on VeerNXT.',
        status: 'REVIEW',
        media_urls: ['https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80'],
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 18000000).toISOString()
      },
      x: {
        id: 'post-2-x',
        content_item_id: 'item-2',
        platform: 'x',
        provider: 'mock',
        text: `Why top tech companies hire Ex-Service Men (ESM):\n\n1️⃣ Rapid decision-making\n2️⃣ High-stress adaptability\n3️⃣ Cross-functional leadership\n4️⃣ Cybersecurity & operational rigor\n\nSee how VeerNXT matches ESM talent with tech leaders ⬇️\nhttps://veernxt.com/employers`,
        hashtags: ['#ExServiceMen', '#TechJobs', '#VeerNXT'],
        cta: 'Hire ESM leaders: https://veernxt.com',
        status: 'REVIEW',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 18000000).toISOString()
      },
      facebook: {
        id: 'post-2-fb',
        content_item_id: 'item-2',
        platform: 'facebook',
        provider: 'mock',
        text: `Thinking about how military experience translates into corporate tech? You might be surprised at how directly your skills apply.\n\nFrom managing complex operations to leading teams through rapid changes, Ex-Service Men have the exact qualities modern companies are searching for. VeerNXT is here to help you translate your service record into corporate achievement.`,
        hashtags: ['#ExServiceMen', '#CareerTransition', '#VeerNXT'],
        cta: 'Connect with VeerNXT hiring partners today.',
        status: 'DRAFT',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 18000000).toISOString()
      },
      instagram: {
        id: 'post-2-ig',
        content_item_id: 'item-2',
        platform: 'instagram',
        provider: 'mock',
        text: `5 Military Strengths That Elevate Corporate Teams 💡\n\n1. High-stress composure\n2. Strategic logistics\n3. Operational integrity\n4. Adaptability\n5. Team-first mindset\n\nVeerNXT makes career transition seamless for Ex-Service Men.`,
        hashtags: ['#ExServiceMen', '#CareerTransition', '#VeerNXT'],
        cta: 'Link in bio for career pathways!',
        status: 'DRAFT',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 18000000).toISOString()
      }
    }
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

class LocalRepository {
  private key = 'veernxt_social_items';
  private brandKey = 'veernxt_brand_settings';

  constructor() {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem(this.key)) {
        localStorage.setItem(this.key, JSON.stringify(INITIAL_CONTENT_ITEMS));
      }
      if (!localStorage.getItem(this.brandKey)) {
        localStorage.setItem(this.brandKey, JSON.stringify(DEFAULT_BRAND_SETTINGS));
      }
    }
  }

  getItems(): ContentItem[] {
    if (typeof window === 'undefined') return INITIAL_CONTENT_ITEMS;
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : INITIAL_CONTENT_ITEMS;
  }

  saveItems(items: ContentItem[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.key, JSON.stringify(items));
    }
  }

  getItemById(id: string): ContentItem | undefined {
    return this.getItems().find(i => i.id === id);
  }

  saveItem(item: ContentItem): ContentItem {
    const items = this.getItems();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      items[idx] = { ...item, updated_at: new Date().toISOString() };
    } else {
      items.unshift({ ...item, created_at: item.created_at || new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    this.saveItems(items);
    return item;
  }

  updatePostStatus(contentItemId: string, platform: Platform, status: PostStatus, scheduledAt?: string): ContentItem | null {
    const item = this.getItemById(contentItemId);
    if (!item || !item.posts || !item.posts[platform]) return null;

    item.posts[platform].status = status;
    if (scheduledAt) item.posts[platform].scheduled_at = scheduledAt;
    if (status === 'PUBLISHED') item.posts[platform].published_at = new Date().toISOString();

    // Calculate overall status
    const postStatuses = Object.values(item.posts).map(p => p.status);
    if (postStatuses.every(s => s === 'PUBLISHED')) item.status = 'PUBLISHED';
    else if (postStatuses.some(s => s === 'SCHEDULED' || s === 'PUBLISHED')) item.status = 'SCHEDULED';
    else if (postStatuses.every(s => s === 'APPROVED')) item.status = 'APPROVED';
    else if (postStatuses.some(s => s === 'REVIEW')) item.status = 'REVIEW';

    return this.saveItem(item);
  }

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
