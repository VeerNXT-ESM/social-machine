import OpenAI from 'openai';
import { saveImage } from '@/lib/db/media';

export const IMAGE_MODEL = 'gpt-image-2.5-flare';
export const IMAGE_QUALITY = 'medium' as const;
const FALLBACK_IMAGE = '/logo.png';

// VeerNXT serves Indian Ex-Service Men, so every image must feel Indian and avoid
// foreign (e.g. US) military looks or any real insignia.
const INDIA_IMAGE_GUIDELINES = [
  'Audience and setting: India. Show Indian people (South Asian features, diverse ages and, where relevant, women and men) in authentic Indian settings such as Indian city offices, campuses, training rooms or towns.',
  'Ex-Service Men appear as Indian veterans in civilian clothing (formal shirts, kurtas or business casual), with a confident, dignified, approachable feel. Do not depict Western soldiers or US-style camouflage.',
  'No text, captions, logos, watermarks, national flags or real military insignia in the image. Photorealistic, natural lighting, editorial quality.',
].join(' ');

const SIZE_BY_RATIO = {
  '1:1': '1024x1024',
  '16:9': '1536x1024',
  '9:16': '1024x1536',
  '4:5': '1024x1536',
} as const;

/**
 * Generates an image with GPT Image 2.5 Flare (medium quality), uploads it to Supabase
 * Storage and returns its public URL. Falls back to the brand logo when no API key is
 * configured or generation or upload fails, so the flow never breaks.
 */
export async function generatePostImage(
  prompt: string,
  aspectRatio: keyof typeof SIZE_BY_RATIO = '1:1'
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') return FALLBACK_IMAGE;

  try {
    const openai = new OpenAI({ apiKey });
    const res = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: `${prompt}\n\n${INDIA_IMAGE_GUIDELINES}`,
      quality: IMAGE_QUALITY,
      size: SIZE_BY_RATIO[aspectRatio] ?? '1024x1024',
      n: 1,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image data returned');

    // Stored in Supabase Storage (permanent public URL), not on the server's disk.
    const size = SIZE_BY_RATIO[aspectRatio] ?? '1024x1024';
    const [width, height] = size.split('x').map(Number);
    return await saveImage({ bytes: Buffer.from(b64, 'base64'), mimeType: 'image/png', width, height });
  } catch (err) {
    console.error('Image generation failed, using fallback logo:', err);
    return FALLBACK_IMAGE;
  }
}
