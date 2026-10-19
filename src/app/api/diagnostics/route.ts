import { NextResponse } from 'next/server';
import { optimizeImage, ensureMediaBucket } from '@/lib/db/media';
import { getWorkspaceUserId } from '@/lib/db/workspace';

/**
 * A health check for the people running the site (sign-in applies on the online site).
 * It reports what works and the plain reason for anything that does not. It never returns secret values.
 */
export const maxDuration = 60;

const step = async (fn: () => Promise<unknown>): Promise<string> => {
  try {
    await fn();
    return 'ok';
  } catch (err) {
    return 'FAILED: ' + (err instanceof Error ? `${err.name}: ${err.message}`.slice(0, 400) : 'unknown error');
  }
};

export async function GET() {
  const names = ['OPENAI_API_KEY', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'DATABASE_URL', 'BUFFER_API_KEY'];
  const settings = Object.fromEntries(names.map((n) => [n, process.env[n] ? 'set' : 'MISSING']));

  // 1x1 PNG
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

  const checks = {
    imageTool: await step(async () => {
      const out = await optimizeImage(png);
      if (!out.bytes.length) throw new Error('no output');
    }),
    storage: await step(() => ensureMediaBucket()),
    workspace: await step(async () => {
      await getWorkspaceUserId();
    }),
    buffer: await step(async () => {
      const key = process.env.BUFFER_API_KEY;
      if (!key) throw new Error('BUFFER_API_KEY is missing');
      const res = await fetch('https://api.buffer.com', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'query { account { organizations { id } } }' }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`Buffer answered ${res.status}`);
      const json = await res.json();
      if (json.errors?.length) throw new Error(json.errors[0].message);
    }),
  };

  return NextResponse.json({ node: process.version, platform: `${process.platform}-${process.arch}`, settings, checks });
}
