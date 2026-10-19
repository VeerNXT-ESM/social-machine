import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceUserId } from './workspace';
import type { BrandSettings } from '@/types';

const COLUMNS = 'brand_name, brand_description, audience, tone, words_to_use, words_to_avoid, key_messages, cta_style';

/** Words that can never be removed from the prohibited list. */
export const LOCKED_PROHIBITED = ['Agniveer'];

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const list = (v: unknown) => (Array.isArray(v) ? v.map(text).filter(Boolean) : []);

function normalise(row: Record<string, unknown>): BrandSettings {
  const avoid = list(row.words_to_avoid);
  for (const w of LOCKED_PROHIBITED) if (!avoid.some((a) => a.toLowerCase() === w.toLowerCase())) avoid.unshift(w);
  return {
    brand_name: text(row.brand_name),
    brand_description: text(row.brand_description),
    audience: text(row.audience),
    tone: list(row.tone),
    words_to_use: list(row.words_to_use),
    words_to_avoid: avoid,
    key_messages: list(row.key_messages),
    cta_style: text(row.cta_style),
  };
}

/**
 * The brand voice. The first time it is read, a row is created and the database's own starting values
 * are used; after that the row is the single source of truth and is edited on the Settings page.
 */
export async function getBrandSettings(): Promise<BrandSettings> {
  const supabase = createAdminClient();
  const userId = await getWorkspaceUserId();
  const { data, error } = await supabase.from('brand_settings').select(COLUMNS).eq('user_id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return normalise(data);

  const { data: created, error: insertError } = await supabase.from('brand_settings').insert({ user_id: userId }).select(COLUMNS).single();
  if (insertError) {
    // Two requests can race to create the first row; the loser reads the winner's.
    const { data: again } = await supabase.from('brand_settings').select(COLUMNS).eq('user_id', userId).maybeSingle();
    if (again) return normalise(again);
    throw new Error(insertError.message);
  }
  return normalise(created);
}

export class BrandValidationError extends Error {}

/** Check what the browser sent: only known fields, sensible lengths. */
export function parseBrandInput(body: unknown): BrandSettings {
  const b = (body ?? {}) as Record<string, unknown>;
  const settings = normalise(b);
  if (!settings.brand_name) throw new BrandValidationError('Brand name cannot be empty.');
  if (settings.brand_name.length > 80) throw new BrandValidationError('Brand name is too long.');
  for (const [label, value] of [['Description', settings.brand_description], ['Audience', settings.audience], ['Call to action style', settings.cta_style]] as const) {
    if (value.length > 1000) throw new BrandValidationError(`${label} is too long (1000 characters at most).`);
  }
  for (const [label, items] of [['Tone', settings.tone], ['Preferred terms', settings.words_to_use], ['Prohibited words', settings.words_to_avoid], ['Key messages', settings.key_messages]] as const) {
    if (items.length > 60) throw new BrandValidationError(`${label}: too many entries (60 at most).`);
    if (items.some((i) => i.length > 400)) throw new BrandValidationError(`${label}: an entry is too long.`);
  }
  return settings;
}

export async function saveBrandSettings(settings: BrandSettings): Promise<BrandSettings> {
  const supabase = createAdminClient();
  const userId = await getWorkspaceUserId();
  await getBrandSettings(); // makes sure the row exists
  const { error } = await supabase
    .from('brand_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return getBrandSettings();
}
