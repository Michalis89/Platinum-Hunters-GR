import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import scrapePSNGuide from '@/lib/scraper/index';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 🔍 Εξαγωγή τίτλου από το URL
    const extractTitleFromURL = (url: string) => {
      const regex = /guide\/\d+-(.*?)-trophy-guide/;
      const matches = regex.exec(url);
      return matches ? matches[1].replace(/-/g, ' ').replace(/\d+/g, '').trim() : url;
    };

    const extractedTitle = extractTitleFromURL(url).trim();

    // 🛑 1️⃣ Ακριβής Έλεγχος στη βάση
    const checkQuery = `SELECT * FROM games WHERE LOWER(title) = LOWER($1)`;
    let result = await pool.query(checkQuery, [extractedTitle]);

    if (result.rows.length > 0) {
      return NextResponse.json(
        {
          message: `⚠️ Ο οδηγός "${result.rows[0].title}" υπάρχει ήδη στη βάση!`,
          existingData: result.rows[0],
        },
        { status: 409 }
      );
    }

    // 🔄 2️⃣ Δοκιμή Fuzzy Matching (αν δεν βρέθηκε exact match)
    const fuzzyQuery = `
      SELECT * FROM games
      WHERE SIMILARITY(LOWER(title), LOWER($1)) > 0.5
      ORDER BY SIMILARITY(LOWER(title), LOWER($1)) DESC
      LIMIT 1;
    `;
    result = await pool.query(fuzzyQuery, [extractedTitle]);

    if (result.rows.length > 0) {
      return NextResponse.json(
        {
          message: `⚠️ Ο οδηγός "${result.rows[0].title}" υπάρχει ήδη στη βάση (πιθανό match)!`,
          existingData: result.rows[0],
        },
        { status: 409 }
      );
    }

    // ✅ Αν δεν υπάρχει, ξεκινάμε το Scraping
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
