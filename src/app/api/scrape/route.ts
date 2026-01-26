import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

/**
 * Scraper API Route
 * POST /api/scrape
 *
 * This endpoint uses Playwright which requires a browser binary.
 * It is disabled in production (Vercel) via the SCRAPER_ENABLED flag.
 *
 * To enable locally: set SCRAPER_ENABLED=true in .env.local
 */

const isScraperEnabled = process.env.SCRAPER_ENABLED === 'true';

export async function POST(req: Request) {
  // Feature flag check - return 503 when disabled
  if (!isScraperEnabled) {
    return NextResponse.json(
      {
        error: 'Scraper is disabled in this environment',
        hint: 'Set SCRAPER_ENABLED=true to enable (development only)',
      },
      { status: 503 },
    );
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const extractTitleFromURL = (url: string) => {
      const regex = /guide\/\d+-(.*?)-trophy-guide/;
      const matches = regex.exec(url);
      return matches ? matches[1].replace(/-/g, ' ').replace(/\d+/g, '').trim() : url;
    };

    const extractedTitle = extractTitleFromURL(url).trim();

    const { data: exactMatch } = await supabase
      .from('games')
      .select('*')
      .ilike('title', extractedTitle)
      .single();

    if (exactMatch) {
      return NextResponse.json(
        {
          message: `⚠️ Ο οδηγός "${exactMatch.title}" υπάρχει ήδη στη βάση!`,
          existingData: exactMatch,
        },
        { status: 409 },
      );
    }

    try {
      const { data, error } = await supabase.rpc('fuzzy_search', {
        search_title: extractedTitle,
      });

      if (error) {
        throw error;
      }

      if (data.length > 0 && data[0].similarity > 0.8) {
        return NextResponse.json(
          {
            message: `⚠️ Ο οδηγός "${data[0].title}" υπάρχει ήδη στη βάση (πιθανό match)!`,
            existingData: data[0],
          },
          { status: 409 },
        );
      }
    } catch (fuzzyError) {
      console.error('❌ Fuzzy Match Error:', fuzzyError);
      // Continue without blocking scrape; just skip fuzzy match if RPC fails
    }

    // Dynamic import to prevent Playwright from being bundled when scraper is disabled
    const { default: scrapePSNGuide } = await import('@/lib/scraper/index');

    const scrapedData = await scrapePSNGuide(url);
    if (!scrapedData) {
      console.error('❌ Scraping failed!');
      return NextResponse.json({ error: 'Scraping failed' }, { status: 500 });
    }

    return NextResponse.json(scrapedData);
  } catch (error) {
    console.error('❌ Σφάλμα:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
