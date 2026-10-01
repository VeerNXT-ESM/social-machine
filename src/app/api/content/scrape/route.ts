import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const lowerUrl = url.toLowerCase();
    // Do NOT scrape social media sites as per requirement
    if (
      lowerUrl.includes('twitter.com') ||
      lowerUrl.includes('x.com') ||
      lowerUrl.includes('linkedin.com') ||
      lowerUrl.includes('facebook.com') ||
      lowerUrl.includes('instagram.com')
    ) {
      return NextResponse.json(
        {
          error:
            "Social media URLs cannot be directly extracted due to privacy policies. Please paste the text or article directly.",
        },
        { status: 400 }
      );
    }

    // Attempt server-side fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 VeerNXTReader/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { error: "We couldn't read this page. Paste the article text instead." },
        { status: 422 }
      );
    }

    const html = await res.text();

    // Extract title and text content using basic regex parsing
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Clean HTML tags to extract readable plain text
    const cleanText = html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
      .replace(/<header[^>]*>([\s\S]*?)<\/header>/gi, '')
      .replace(/<footer[^>]*>([\s\S]*?)<\/footer>/gi, '')
      .replace(/<nav[^>]*>([\s\S]*?)<\/nav>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText || cleanText.length < 50) {
      return NextResponse.json(
        { error: "We couldn't read this page. Paste the article text instead." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      title: title || 'Extracted Article',
      extractedText: cleanText.substring(0, 4000),
      url,
    });
  } catch {
    return NextResponse.json(
      { error: "We couldn't read this page. Paste the article text instead." },
      { status: 500 }
    );
  }
}
