import {
  Bell,
  Download,
  FileText,
  Heart,
  MessageCircle,
  Palette,
  Plug,
  Scroll,
  Search,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type RoadmapStatus = 'done' | 'in-progress' | 'planned';
export type RoadmapArea = 'core' | 'social' | 'dnd' | 'import' | 'ui';

export type RoadmapItem = {
  title: string;
  description: string;
  status: RoadmapStatus;
  area: RoadmapArea;
  icon: LucideIcon;
};

export const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    title: 'Light Mode',
    description: 'Εναλλαγή light/dark theme σε όλη την εφαρμογή.',
    status: 'done',
    area: 'ui',
    icon: Palette,
  },
  {
    title: 'Comments & Likes',
    description: 'Αλληλεπίδραση χρηστών με σχόλια και reactions σε περιεχόμενο.',
    status: 'done',
    area: 'social',
    icon: Heart,
  },
  {
    title: 'API Integrations',
    description:
      'Σύνδεση με εξωτερικά APIs (RAWG, TMDB, MAL, Google Books) για αυτόματο metadata και covers.',
    status: 'done',
    area: 'core',
    icon: Plug,
  },
  {
    title: 'Profiles & Social Graph',
    description: 'Public προφίλ, follow system και βασικές social συνδέσεις.',
    status: 'in-progress',
    area: 'social',
    icon: Users,
  },
  {
    title: 'Notifications',
    description: 'Ειδοποιήσεις για σχόλια, replies, tickets και προσωπικά μηνύματα.',
    status: 'in-progress',
    area: 'core',
    icon: Bell,
  },
  {
    title: 'D&D Campaign Toolkit',
    description: 'Εργαλεία για DMs: campaigns, sessions, NPCs, handouts και rule search.',
    status: 'planned',
    area: 'dnd',
    icon: Scroll,
  },
  {
    title: 'Direct Messages',
    description: 'Ιδιωτικά μηνύματα μεταξύ χρηστών.',
    status: 'planned',
    area: 'social',
    icon: MessageCircle,
  },
  {
    title: 'Rulebook Search (SRD + PDFs)',
    description: 'Αναζήτηση σε SRD κανόνες και προσωπικά PDFs (μόνο search, όχι ανάγνωση).',
    status: 'planned',
    area: 'dnd',
    icon: Search,
  },
  {
    title: 'Character Sheets (Automation)',
    description: 'Διαχείριση χαρακτήρων με αυτόματους υπολογισμούς (π.χ. level, proficiency).',
    status: 'planned',
    area: 'dnd',
    icon: FileText,
  },
  {
    title: 'Import / Export',
    description: 'Εισαγωγή λιστών από MAL, Letterboxd, Steam και εξαγωγή σε CSV/JSON.',
    status: 'planned',
    area: 'import',
    icon: Download,
  },
];

const COMMON_STATUS_LABELS: Record<'done' | 'in-progress', string> = {
  done: 'ΟΛΟΚΛΗΡΩΘΗΚΕ',
  'in-progress': 'ΣΕ ΕΞΕΛΙΞΗ',
};

const PLANNED_LABELS: Record<'teaser' | 'full', string> = {
  teaser: 'ΣΥΝΤΟΜΑ',
  full: 'ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΟ',
};

const TEASER_PLANNED_ITEMS = new Set(['Import / Export', 'Notifications']);

export function getStatusLabel(status: RoadmapStatus, context: 'teaser' | 'full'): string {
  if (status === 'planned') {
    return PLANNED_LABELS[context];
  }
  return COMMON_STATUS_LABELS[status];
}

export function getTeaserRoadmapItems(): RoadmapItem[] {
  const inProgress = ROADMAP_ITEMS.filter(item => item.status === 'in-progress');
  const planned = ROADMAP_ITEMS.filter(
    item => item.status === 'planned' && TEASER_PLANNED_ITEMS.has(item.title),
  );
  return [...inProgress, ...planned];
}
