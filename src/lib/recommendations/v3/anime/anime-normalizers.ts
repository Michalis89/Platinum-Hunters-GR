import { extractFranchiseKey, extractSequenceNumber } from '../utils/franchise';

const LOW_VALUE_DERIVATIVE_MARKERS: RegExp[] = [
  /\b(movie|film)\b/i,
  /\bova\b/i,
  /\bona\b/i,
  /\bspecial\b/i,
  /\brecap\b/i,
  /\bsummary\b/i,
  /\bcompilation\b/i,
  /\bside\s+story\b/i,
  /\bthe\s+final\s+chapters?\b/i,
];

const MAJOR_PROGRESS_MARKERS: RegExp[] = [
  /\bseason\s+\d+\b/i,
  /\b(2nd|3rd|4th|5th|final)\s+season\b/i,
  /\bcour\s+\d+\b/i,
  /\bpart\s+\d+\b/i,
];

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function getAnimeFranchiseKey(title: string): string {
  return extractFranchiseKey(title);
}

export function getAnimeInstallmentNumber(title: string): number | null {
  return extractSequenceNumber(title);
}

export function isLowValueDerivative(title: string): boolean {
  return LOW_VALUE_DERIVATIVE_MARKERS.some(pattern => pattern.test(title));
}

export function isMajorProgressionEntry(title: string): boolean {
  if (MAJOR_PROGRESS_MARKERS.some(pattern => pattern.test(title))) {
    return true;
  }

  if (!isLowValueDerivative(title)) {
    return true;
  }

  return false;
}
