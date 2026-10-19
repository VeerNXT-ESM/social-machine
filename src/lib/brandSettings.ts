import { BrandSettings } from '@/types';

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

/**
 * Browser storage is now used only for brand settings. Content items and posts are stored in the
 * database through the API routes (see src/lib/db and src/lib/api.ts).
 */
class BrandSettingsStore {
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

export const brandSettingsStore = new BrandSettingsStore();
