import { getCanonicalKey } from '../utils/genre';

export function toCanonicalGenres(genres: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const genre of genres) {
    const key = getCanonicalKey(genre);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(key);
  }

  return normalized;
}

export function normalizeScore(score: number | null): number | null {
  if (score === null || Number.isNaN(score)) {
    return null;
  }
  return Math.max(0, Math.min(10, score));
}

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizePlatformKey(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (!normalized) {
    return '';
  }

  if (
    normalized.includes('android') ||
    normalized.includes('ios') ||
    normalized.includes('iphone') ||
    normalized.includes('ipad') ||
    normalized.includes('mobile')
  ) {
    return 'mobile';
  }
  if (
    normalized.includes('pc') ||
    normalized.includes('windows') ||
    normalized.includes('linux') ||
    normalized.includes('mac') ||
    normalized.includes('steam')
  ) {
    return 'pc';
  }
  if (normalized.includes('playstation') || normalized.startsWith('ps')) {
    if (normalized.includes('5') || normalized.includes('ps5')) {
      return 'ps5';
    }
    if (normalized.includes('4') || normalized.includes('ps4')) {
      return 'ps4';
    }
    if (normalized.includes('3') || normalized.includes('ps3')) {
      return 'ps3';
    }
    if (normalized.includes('2') || normalized.includes('ps2')) {
      return 'ps2';
    }
    return 'playstation';
  }
  if (normalized.includes('xbox')) {
    return 'xbox';
  }
  if (
    normalized.includes('switch') ||
    normalized.includes('nintendo') ||
    normalized.includes('wii') ||
    normalized.includes('3ds') ||
    normalized.includes('ds')
  ) {
    return 'nintendo';
  }

  return normalized;
}

export function normalizeGameIdentityKey(value: string): string {
  const original = titleToSlug(value);
  if (!original) {
    return '';
  }

  let normalized = normalizeSequelNumberTokens(normalizePossessiveTokens(original));

  let previous = '';
  while (normalized && normalized !== previous) {
    previous = normalized;
    normalized = normalized
      .replace(/-(?:game-of-the-year(?:-edition)?|goty(?:-edition)?)$/, '')
      .replace(/-(?:director-s-cut|directors-cut)$/, '')
      .replace(
        /-(?:free-)?next-gen-update$/,
        '',
      )
      .replace(
        /-(?:legendary|collection|anthology|master-collection|volume-\d+|episode-\d+|chapter-\d+)$/,
        '',
      )
      .replace(
        /-(?:definitive|complete|enhanced|ultimate|deluxe|gold|anniversary|standard)-edition$/,
        '',
      )
      .replace(/-(?:hd-remaster(?:ed)?|remaster(?:ed)?|remake)$/, '')
      .replace(
        /-(?:definitive|complete|enhanced|ultimate|deluxe|gold|anniversary|standard|edition)$/,
        '',
      )
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  return normalized || original;
}

const FRANCHISE_FAMILY_FALLBACKS: Array<{ family: string; patterns: RegExp[] }> = [
  // Temporary fallback for weak token-overlap cross-title families.
  { family: 'ghost-of-tsushima', patterns: [/\bghost[-\s]?of[-\s]?tsushima\b/, /\bghost[-\s]?of[-\s]?yotei\b/] },
  { family: 'final-fantasy-7', patterns: [/\bfinal[-\s]?fantasy[-\s]?(vii|7)\b/] },
];

const FAMILY_STOP_TOKENS = new Set([
  'the',
  'a',
  'an',
  'of',
  'and',
  'for',
  'to',
  'in',
  'on',
  'at',
  'with',
  'without',
  'edition',
  'remaster',
  'remastered',
  'remake',
  'definitive',
  'complete',
  'enhanced',
  'ultimate',
  'deluxe',
  'gold',
  'anniversary',
  'director',
  'directors',
  'cut',
  'collection',
  'anthology',
  'master',
  'volume',
  'episode',
  'chapter',
  'part',
  'season',
  'free',
  'next',
  'gen',
  'update',
  'dlc',
  'expansion',
  'pack',
]);

const FAMILY_TRAILING_TOKENS = new Set([
  'rebirth',
  'ragnarok',
  'ragnark',
  'forbidden',
  'west',
  'phantom',
  'liberty',
  'scholar',
  'first',
  'sin',
  'directors',
  'cut',
]);

const ROMAN_TO_ARABIC = new Map<string, number>([
  ['i', 1],
  ['ii', 2],
  ['iii', 3],
  ['iv', 4],
  ['v', 5],
  ['vi', 6],
  ['vii', 7],
  ['viii', 8],
  ['ix', 9],
  ['x', 10],
  ['xi', 11],
  ['xii', 12],
  ['xiii', 13],
  ['xiv', 14],
  ['xv', 15],
  ['xvi', 16],
  ['xvii', 17],
  ['xviii', 18],
  ['xix', 19],
  ['xx', 20],
]);

export function normalizeFranchiseFamilyKey(title: string): string {
  const normalized = normalizeGameIdentityKey(title);
  if (!normalized) {
    return '';
  }

  const genericFamily = buildGenericFranchiseFamilyKey(normalized);
  const probe = normalized.replace(/-/g, ' ');
  for (const fallback of FRANCHISE_FAMILY_FALLBACKS) {
    if (fallback.patterns.some(pattern => pattern.test(probe))) {
      return fallback.family;
    }
  }

  return genericFamily;
}

export function extractMainlineSequence(title: string): number | null {
  const normalized = normalizeGameIdentityKey(title).replace(/-/g, ' ');
  if (!normalized) {
    return null;
  }

  const markers: Array<[RegExp, number]> = [
    [/\bragnarok\b|\bragnark\b/, 2],
    [/\bforbidden west\b/, 2],
    [/\brebirth\b/, 2],
    [/\bremake\b/, 1],
    [/\bphantom liberty\b/, 3],
    [/\bscholar of the first sin\b/, 2],
  ];
  for (const [pattern, value] of markers) {
    if (pattern.test(normalized)) {
      return value;
    }
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i];
    if (/^\d+$/.test(token)) {
      return parseInt(token, 10);
    }
    const roman = ROMAN_TO_ARABIC.get(token);
    if (roman) {
      return roman;
    }
  }

  return null;
}

function normalizeSequelNumberTokens(value: string): string {
  const romanToArabic = new Map<string, string>([
    ['i', '1'],
    ['ii', '2'],
    ['iii', '3'],
    ['iv', '4'],
    ['v', '5'],
    ['vi', '6'],
    ['vii', '7'],
    ['viii', '8'],
    ['ix', '9'],
    ['x', '10'],
    ['xi', '11'],
    ['xii', '12'],
    ['xiii', '13'],
    ['xiv', '14'],
    ['xv', '15'],
    ['xvi', '16'],
    ['xvii', '17'],
    ['xviii', '18'],
    ['xix', '19'],
    ['xx', '20'],
  ]);

  const tokens = value.split('-').map(token => {
    const roman = romanToArabic.get(token);
    if (roman) {
      return roman;
    }
    if (/^\d+$/.test(token)) {
      return String(parseInt(token, 10));
    }
    return token;
  });

  return tokens.join('-');
}

function normalizePossessiveTokens(value: string): string {
  const tokens = value.split('-');
  const normalized: string[] = [];

  for (const token of tokens) {
    if (token === 's' && normalized.length > 0) {
      normalized[normalized.length - 1] = `${normalized[normalized.length - 1]}s`;
      continue;
    }
    normalized.push(token);
  }

  return normalized.join('-');
}

function buildGenericFranchiseFamilyKey(normalizedIdentity: string): string {
  const baseTokens = normalizedIdentity.split('-').filter(Boolean);
  if (baseTokens.length === 0) {
    return '';
  }

  const trimmed = [...baseTokens];
  while (trimmed.length > 1) {
    const tail = trimmed[trimmed.length - 1];
    if (!tail || FAMILY_TRAILING_TOKENS.has(tail) || FAMILY_STOP_TOKENS.has(tail)) {
      trimmed.pop();
      continue;
    }
    break;
  }

  const source = trimmed.length > 0 ? trimmed : baseTokens;
  const familyTokens = source.filter(token => !FAMILY_STOP_TOKENS.has(token));
  const cleaned = familyTokens.length > 0 ? familyTokens : source;

  if (cleaned.length > 1 && /^\d+$/.test(cleaned[cleaned.length - 1])) {
    const allowNumericTail =
      cleaned.length >= 2 &&
      cleaned[cleaned.length - 2] === 'fantasy' &&
      cleaned[cleaned.length - 1] === '7';
    if (!allowNumericTail) {
      cleaned.pop();
    }
  }

  return cleaned.slice(0, 4).join('-');
}

