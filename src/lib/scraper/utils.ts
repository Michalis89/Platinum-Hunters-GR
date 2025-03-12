import { TrophiesRecord } from '@/types/interfaces';
import { Page } from 'playwright';

export async function extractNumericValue(page: Page, selector: string): Promise<string> {
  const element = await page.$(selector);
  if (!element) return 'Άγνωστο';
  const text = await element.evaluate(el => el.textContent?.trim() ?? '');
  const match = /\d+\/?\d*/.exec(text);
  return match ? match[0] : 'Άγνωστο';
}

export async function extractBackgroundColor(page: Page, selector: string): Promise<string> {
  const element = await page.$(selector);
  if (!element) return '#FFFFFF';
  const style = await element.evaluate(el => el.getAttribute('style') ?? '');
  const match = /background-color:\s*(#[0-9a-fA-F]+)/.exec(style);
  return match ? match[1] : '#FFFFFF';
}

export function calculateTotalPoints(trophies: TrophiesRecord): number {
  return (
    (parseInt(trophies.Platinum) || 0) * 300 +
    (parseInt(trophies.Gold) || 0) * 90 +
    (parseInt(trophies.Silver) || 0) * 30 +
    (parseInt(trophies.Bronze) || 0) * 15
  );
}
