import 'server-only';
import { lookup } from 'dns/promises';
import { isIP } from 'net';

/**
 * A careful HTTP fetcher for reading public web pages and feeds:
 *  - only http/https, never to private, loopback or link-local addresses (blocks SSRF),
 *  - redirects are followed manually and every hop is re-checked,
 *  - hard limits on time and response size,
 *  - honours robots.txt and spaces out requests to the same site.
 */

export const USER_AGENT =
  'VeerNXT-SocialMachine/1.0 (link discovery for veteran-focused content; contact: qc@quantum-climb.com)';
const UA_TOKEN = 'veernxt-socialmachine';

const MAX_REDIRECTS = 4;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const MIN_GAP_MS = 3_000;
const MAX_CRAWL_DELAY_MS = 10_000;

// ------------------------------------------------------------------ address safety

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const PRIVATE_V4: [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const n = ipv4ToInt(ip);
    return PRIVATE_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) >>> 0 === (ipv4ToInt(base) & mask) >>> 0;
    });
  }
  const v6 = ip.toLowerCase();
  if (v6 === '::1' || v6 === '::') return true;
  if (v6.startsWith('fc') || v6.startsWith('fd')) return true; // unique local
  if (v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb')) return true; // link-local
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]);
  return false;
}

/** Throws unless the URL is a public http(s) address. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('That is not a valid web address.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only http and https addresses are allowed.');
  if (url.username || url.password) throw new Error('Addresses with embedded credentials are not allowed.');

  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Internal addresses are not allowed.');
  }
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new Error('Internal addresses are not allowed.');
    return url;
  }
  const addresses = await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error('That address resolves to an internal network and is not allowed.');
  }
  return url;
}

// ------------------------------------------------------------------ robots.txt

interface RobotsRules {
  allow: string[];
  disallow: string[];
  crawlDelayMs: number;
  fetchedAt: number;
}

const robotsCache = new Map<string, RobotsRules>();
const ROBOTS_TTL_MS = 6 * 60 * 60 * 1000;

function parseRobots(text: string): RobotsRules {
  const groups: { agents: string[]; allow: string[]; disallow: string[]; delay: number }[] = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], allow: [], disallow: [], delay: 0 };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (field === 'allow' && value) current.allow.push(value);
    else if (field === 'disallow' && value) current.disallow.push(value);
    else if (field === 'crawl-delay') current.delay = Number(value) || 0;
  }

  const specific = groups.find((g) => g.agents.some((a) => a !== '*' && UA_TOKEN.includes(a)));
  const wildcard = groups.find((g) => g.agents.includes('*'));
  const chosen = specific ?? wildcard;
  return {
    allow: chosen?.allow ?? [],
    disallow: chosen?.disallow ?? [],
    crawlDelayMs: Math.min((chosen?.delay ?? 0) * 1000, MAX_CRAWL_DELAY_MS),
    fetchedAt: Date.now(),
  };
}

function ruleMatches(rule: string, path: string): number {
  // Supports * wildcards and a trailing $ anchor. Returns the match length (longest rule wins) or -1.
  const anchored = rule.endsWith('$');
  const pattern = (anchored ? rule.slice(0, -1) : rule)
    .split('*')
    .map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp('^' + pattern + (anchored ? '$' : '')).test(path) ? rule.length : -1;
}

async function getRobots(origin: string): Promise<RobotsRules> {
  const cached = robotsCache.get(origin);
  if (cached && Date.now() - cached.fetchedAt < ROBOTS_TTL_MS) return cached;

  let rules: RobotsRules = { allow: [], disallow: [], crawlDelayMs: 0, fetchedAt: Date.now() };
  try {
    const res = await rawFetch(origin + '/robots.txt', DEFAULT_TIMEOUT_MS, 256 * 1024);
    // A missing robots.txt (404) means no restrictions; server errors are treated as "no rules" too.
    if (res.status === 200) rules = parseRobots(res.text);
  } catch {
    // unreachable robots.txt: proceed without rules, the page fetch will surface real network errors
  }
  robotsCache.set(origin, rules);
  return rules;
}

export async function isAllowedByRobots(url: URL): Promise<boolean> {
  const rules = await getRobots(url.origin);
  const path = url.pathname + url.search;
  const bestAllow = Math.max(-1, ...rules.allow.map((r) => ruleMatches(r, path)));
  const bestDisallow = Math.max(-1, ...rules.disallow.map((r) => ruleMatches(r, path)));
  return bestDisallow === -1 || bestAllow >= bestDisallow;
}

// ------------------------------------------------------------------ throttling

const lastRequestAt = new Map<string, number>();

async function politeWait(host: string, crawlDelayMs: number) {
  const gap = Math.max(MIN_GAP_MS, crawlDelayMs);
  const last = lastRequestAt.get(host) ?? 0;
  const wait = last + gap - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt.set(host, Date.now());
}

// ------------------------------------------------------------------ fetching

export interface FetchResult {
  status: number;
  text: string;
  contentType: string;
  finalUrl: string;
}

async function readLimited(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error('The page is larger than the allowed size.');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/** One request with manual, re-validated redirects. No robots or throttling: internal use. */
async function rawFetch(startUrl: string, timeoutMs: number, maxBytes: number, accept?: string): Promise<FetchResult> {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'User-Agent': USER_AGENT, Accept: accept ?? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = new URL(res.headers.get('location')!, url).toString();
        continue;
      }
      const text = await readLimited(res, maxBytes);
      return { status: res.status, text, contentType: res.headers.get('content-type') ?? '', finalUrl: url.toString() };
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('Too many redirects.');
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  accept?: string;
  /** Set false only for the user's explicit one-off page read; scheduled scans always respect robots.txt. */
  respectRobots?: boolean;
}

export async function safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<FetchResult> {
  const url = await assertPublicUrl(rawUrl);
  const respectRobots = options.respectRobots ?? true;

  if (respectRobots && !(await isAllowedByRobots(url))) {
    throw new Error(`${url.hostname} asks automated tools not to read this page (robots.txt).`);
  }
  const rules = await getRobots(url.origin);
  await politeWait(url.host, rules.crawlDelayMs);

  return rawFetch(rawUrl, options.timeoutMs ?? DEFAULT_TIMEOUT_MS, options.maxBytes ?? DEFAULT_MAX_BYTES, options.accept);
}

/**
 * Download one picture from a public address (redirects re-checked, size and time limited).
 * Used when a person chooses to reuse an article's picture. Returns the raw bytes.
 */
export async function fetchImageBytes(startUrl: string, maxBytes = 10 * 1024 * 1024, timeoutMs = 15_000): Promise<Buffer> {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(current);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'User-Agent': USER_AGENT, Accept: 'image/png,image/jpeg,image/webp,image/*;q=0.8' },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = new URL(res.headers.get('location')!, url).toString();
        continue;
      }
      if (res.status !== 200) throw new Error('The picture could not be downloaded.');
      if (!/^image\//i.test(res.headers.get('content-type') ?? '')) throw new Error('That address is not a picture.');
      const reader = res.body?.getReader();
      if (!reader) throw new Error('The picture could not be downloaded.');
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > maxBytes) {
          await reader.cancel();
          throw new Error('The picture is larger than 10 MB.');
        }
        chunks.push(value);
      }
      return Buffer.concat(chunks);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('Too many redirects.');
}
