import puppeteer from 'puppeteer';
import { ScrapedGameData } from '@/types/interfaces';
import { SELECTORS } from './selectors';

export default async function scrapePSNGuide(url: string): Promise<ScrapedGameData | null> {
  try {
    console.log('🔍 Puppeteer about to launch...');
    const browser = await puppeteer.launch({
      headless: false, // Δες αν φορτώνεται η σελίδα
    });

    console.log('✅ Puppeteer launched successfully!');
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load' });

    // Περιμένουμε 3 δευτερόλεπτα για να φορτώσουν όλα
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'debug-before-selectors.png', fullPage: true });

    // Ελέγχουμε αν υπάρχει ο τίτλος
    const titleExists = await page.$(SELECTORS.TITLE);
    if (!titleExists) {
      console.error('❌ Το #desc-name δεν βρέθηκε στη σελίδα!');
      await page.screenshot({ path: 'debug-missing-title.png', fullPage: true });
      return null;
    }

    const title = await page
      .$eval(SELECTORS.TITLE, (el) => el.textContent?.trim() ?? 'Δεν βρέθηκε')
      .catch(() => 'Δεν βρέθηκε');

    console.log(`✅ Βρέθηκε τίτλος: ${title}`);

    await browser.close();
    return { title } as ScrapedGameData;
  } catch (error) {
    console.error('❌ Σφάλμα στο scraping:', error);
    return null;
  }
}
