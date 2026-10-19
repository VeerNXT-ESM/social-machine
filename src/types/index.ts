export type Platform = 'linkedin' | 'x' | 'instagram' | 'facebook';

export type PostStatus = 
  | 'DRAFT' 
  | 'GENERATING' 
  | 'REVIEW' 
  | 'APPROVED' 
  | 'SCHEDULED' 
  | 'PUBLISHED' 
  | 'FAILED';

export type ContentType = 
  | 'Announcement'
  | 'Educational'
  | 'Thought Leadership'
  | 'Product'
  | 'Employer'
  | 'Jobs'
  | 'Career Advice'
  | 'Community'
  | 'Evergreen'
  | 'Other';

export type SourceType = 'article' | 'link' | 'notes' | 'idea';

export interface VisualDirection {
  concept: string;
  image_prompt: string;
  aspect_ratio: '1:1' | '16:9' | '9:16' | '4:5';
  headline_suggestion?: string;
}

export interface SinglePlatformPost {
  text?: string;
  hashtags: string[];
  cta: string;
  thread?: string[]; // For X threads
  caption?: string; // For Instagram
}

export interface GeneratedPostsSchema {
  source_summary: string;
  core_message: string;
  suggested_angle: string;
  posts: {
    linkedin?: SinglePlatformPost;
    x?: SinglePlatformPost;
    instagram?: SinglePlatformPost;
    facebook?: SinglePlatformPost;
  };
  visual_direction: VisualDirection;
}

export interface PlatformPost {
  id: string;
  content_item_id: string;
  platform: Platform;
  provider: 'mock' | 'manual' | 'buffer' | 'native';
  text: string;
  hashtags: string[];
  cta: string;
  media_urls?: string[];
  status: PostStatus;
  scheduled_at?: string; // ISO UTC
  published_at?: string; // ISO UTC
  external_post_id?: string;
  external_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  user_id?: string;
  campaign_id?: string;
  campaign_name?: string;
  title: string;
  source_type: SourceType;
  source_content: string;
  source_url?: string;
  master_idea?: string;
  content_type: ContentType;
  status: PostStatus; // Aggregate overall status
  selected_platforms: Platform[];
  visual_direction?: VisualDirection;
  posts?: Record<Platform, PlatformPost>;
  repurposed_from_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'PLANNED' | 'COMPLETED';
  start_date?: string;
  end_date?: string;
  post_count?: number;
  created_at: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  type: 'image' | 'video';
  mime_type: string;
  size_bytes: number;
  width?: number;
  height?: number;
  storage_path: string;
  public_url: string;
  created_at: string;
  /** Small copy for lists; missing for older images until backfilled. */
  thumb_url?: string | null;
  thumb_path?: string | null;
  /** Size of the file before it was compressed (only present on a fresh upload response). */
  original_bytes?: number;
}

export interface BrandSettings {
  brand_name: string;
  brand_description: string;
  audience: string;
  tone: string[];
  words_to_use: string[];
  words_to_avoid: string[];
  key_messages: string[];
  cta_style: string;
  publishing_mode: 'mock' | 'buffer' | 'native' | 'manual';
  timezone: string;
}

