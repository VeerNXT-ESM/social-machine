import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { assertPublicUrl, safeFetch } from '@/lib/scraper/safeFetch';

const SOCIAL_HOSTS = ['twitter.com', 'x.com', 'linkedin.com', 'facebook.com', 'instagram.com'];
const MAX_TEXT_CHARS = 6000;

const UNREADABLE = "We couldn't read this page. Paste the article text instead.";

/**
 * Read one web page the user chose and return its title and main text, for use as source material.
 * The address is checked so it cannot point at internal networks, and the page size and time are limited.
 */
export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = await assertPublicUrl(url);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'That address is not allowed.' }, { status: 400 });
    }

    // Social media pages cannot be read for privacy reasons
    const host = parsed.hostname.replace(/^www\./, '');
    if (SOCIAL_HOSTS.some((h) => host === h || host.endsWith('.' + h))) {
      return NextResponse.json(
        {
          error:
            'Social media URLs cannot be directly extracted due to privacy policies. Please paste the text or article directly.',
        },
        { status: 400 }
      );
    }

    // This is a single page the user asked for, so robots.txt is not applied; limits still are.
    const res = await safeFetch(parsed.toString(), { respectRobots: false, timeoutMs: 10_000 });
    if (res.status !== 200 || !/html|xml/i.test(res.contentType)) {
      return NextResponse.json({ error: UNREADABLE }, { status: 422 });
    }

    const $ = cheerio.load(res.text);
    const title =
      $('meta[property="og:title"]').attr('content')?.trim() || $('title').first().text().replace(/\s+/g, ' ').trim() || '';

    // Prefer the article body; drop navigation, scripts and page furniture.
    $('script, style, noscript, nav, header, footer, aside, form, iframe, .menu, .sidebar, .comments, .share').remove();
    const container = ['article', '[role="main"]', 'main', '.entry-content', '.post-content', '.article-content', 'body']
      .map((sel) => $(sel).first())
      .find((el) => el.length > 0 && el.text().replace(/\s+/g, ' ').trim().length > 200);
    const text = (container ?? $('body'))
      .find('p, li, h1, h2, h3, blockquote')
      .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter((t) => t.length > 0)
      .join('\n\n');

    const clean = text.length >= 50 ? text : $('body').text().replace(/\s+/g, ' ').trim();
    if (!clean || clean.length < 50) {
      return NextResponse.json({ error: UNREADABLE }, { status: 422 });
    }

    // Quality gate: an article has real sentences. A page that is mostly menus, a video or a PDF viewer
    // would otherwise hand the AI navigation text to "summarise".
    const used = clean.substring(0, MAX_TEXT_CHARS); // check the same slice the AI will receive
    const fullSentences = used.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.split(/\s+/).length >= 8).length;
    if (fullSentences < 4) {
      return NextResponse.json(
        { error: 'This page has very little article text (it may be mostly a video or a menu). Paste the article text instead.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      title: title || 'Extracted Article',
      extractedText: clean.substring(0, MAX_TEXT_CHARS),
      url,
    });
  } catch (err) {
    console.error('POST /api/content/scrape failed:', err);
    return NextResponse.json({ error: UNREADABLE }, { status: 500 });
  }
}
