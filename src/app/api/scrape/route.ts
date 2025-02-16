import { NextResponse } from "next/server";
import scrapePSNGuide from "@/lib/scraper/index";
import supabase from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 🔍 Εξαγωγή τίτλου από το URL
    const extractTitleFromURL = (url: string) => {
      const regex = /guide\/\d+-(.*?)-trophy-guide/;
      const matches = regex.exec(url);
      return matches ? matches[1].replace(/-/g, " ").replace(/\d+/g, "").trim() : url;
    };

    const extractedTitle = extractTitleFromURL(url).trim();

    // 🛑 1️⃣ Ακριβής Έλεγχος στη βάση
    const { data: exactMatch } = await supabase
      .from("games")
      .select("*")
      .ilike("title", extractedTitle) // Case-insensitive match
      .single();

    if (exactMatch) {
      return NextResponse.json(
        {
          message: `⚠️ Ο οδηγός "${exactMatch.title}" υπάρχει ήδη στη βάση!`,
          existingData: exactMatch,
        },
        { status: 409 }
      );
    }

    // 🔄 2️⃣ Δοκιμή Fuzzy Matching (αν δεν βρέθηκε exact match)
    const { data, error } = await supabase.rpc("fuzzy_search", {
      search_title: extractedTitle,
    });

    if (error) {
      console.error("❌ Fuzzy Match Error:", error);
      return NextResponse.json({ error: "Database error during fuzzy search" }, { status: 500 });
    }

    if (data.length > 0 && data[0].similarity > 0.8) {
      return NextResponse.json(
        {
          message: `⚠️ Ο οδηγός "${data[0].title}" υπάρχει ήδη στη βάση (πιθανό match)!`,
          existingData: data[0],
        },
        { status: 409 }
      );
    }

    // ✅ Αν δεν υπάρχει, ξεκινάμε το Scraping
    const scrapedData = await scrapePSNGuide(url);
    if (!scrapedData) {
      console.error("❌ Scraping failed!");
      return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
    }

    return NextResponse.json(scrapedData);
  } catch (error) {
    console.error("❌ Σφάλμα:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
