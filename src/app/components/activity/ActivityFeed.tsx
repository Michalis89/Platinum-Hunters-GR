'use client';

import { useState, createContext, useContext } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  Clock,
  Gamepad2,
  Sparkles,
  User as UserIcon,
  Trophy as TrophyIcon,
  Flag,
  Heart,
  FileText,
  MessageSquare,
  Pencil,
  Trash2,
  Star,
} from 'lucide-react';
import { normalizeSlug } from '@/utils/slugify';
import EmptyState from '@/app/components/ui/EmptyState';
import ErrorState from '@/app/components/ui/ErrorState';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import AlertMessage from '@/app/components/ui/AlertMessage';
import { selectUser } from '@/store/slices/authSlice';

// Context to pass down category alert state to FeedText
type CategoryAlertState = {
  showCategoryAlert: (category: string) => void;
  userCategories: string[] | null;
};

const CategoryAlertContext = createContext<CategoryAlertState | null>(null);

type ActivityType =
  | 'backlog_added'
  | 'backlog_status'
  | 'guide_created'
  | 'step_completed'
  | 'media_added'
  | 'media_status'
  | 'media_favorite'
  | 'article_created'
  | 'article_updated'
  | 'article_deleted'
  | 'article_liked'
  | 'article_comment';

type ActivityItem = {
  id: number;
  user_id: string;
  type: ActivityType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
  created_at: string;
};

type ActivityFeedProps = {
  scope: 'global' | 'me';
  limit?: number;
  title?: string;
  compact?: boolean;
  height?: number;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

function timeAgo(date: string) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s πριν`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m πριν`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h πριν`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d πριν`;
}

function renderText(item: ActivityItem) {
  const p = item.payload || {};
  const name = p.display_name || p.username || 'Χρήστης';
  const title = p.gameTitle || p.articleTitle || 'περιεχόμενο';
  const category = (p.category || '').toString();
  const mediaTitle = p.title || title;
  // Category labels with proper Greek articles (singular)
  const categoryWithArticle: Record<string, { article: string; label: string }> = {
    anime: { article: 'το', label: 'Anime' },
    manga: { article: 'το', label: 'manga' },
    movies: { article: 'την', label: 'ταινία' },
    books: { article: 'το', label: 'βιβλίο' },
    tv: { article: 'την', label: 'σειρά' },
  };
  if (item.type === 'backlog_added') {
    return `${name} πρόσθεσε στο backlog: ${title}`;
  }
  if (item.type === 'backlog_status') {
    if (item.payload?.favoriteAction === 'added') return `${name} έκανε favorite: ${title}`;
    if (item.payload?.favoriteAction === 'removed')
      return `${name} αφαίρεσε από favorites: ${title}`;
    const status = (p.status || '').toString();
    const statusLabel: Record<string, string> = {
      platinumed: 'πήρε πλατίνα',
      completed: 'ολοκλήρωσε',
      playing: 'παίζει τώρα',
      to_play: 'πρόσθεσε στο backlog',
      dropped: 'το άφησε',
    };
    return `${name} ${statusLabel[status] || 'άλλαξε status σε ' + status}: ${title}`;
  }
  if (item.type === 'guide_created') {
    if (item.payload?.action === 'updated') {
      return `${name} ενημέρωσε οδηγό για ${title}`;
    }
    return `${name} ανέβασε οδηγό για ${title}`;
  }
  if (item.type === 'step_completed') {
    return `${name} ολοκλήρωσε βήμα: ${p.stepTitle || 'guide step'}`;
  }
  if (item.type === 'media_added') {
    const cat = categoryWithArticle[category] || { article: 'το', label: 'media' };
    const status = (p.status || 'planned').toString();

    // Different verbs for books vs video content
    const isBook = category === 'books';
    const currentVerb = isBook
      ? `ξεκίνησε να διαβάζει ${cat.article}`
      : `ξεκίνησε να παρακολουθεί ${cat.article}`;

    const statusActions: Record<string, string> = {
      planned: `πρόσθεσε ${cat.article}`,
      current: currentVerb,
      completed: `ολοκλήρωσε ${cat.article}`,
      dropped: `παράτησε ${cat.article}`,
    };
    const action = statusActions[status] || `πρόσθεσε ${cat.article}`;
    return `${name} ${action} ${cat.label}: ${mediaTitle}`;
  }
  if (item.type === 'media_status') {
    const cat = categoryWithArticle[category] || { article: 'το', label: 'media' };
    const status = (p.status || '').toString();
    const isBook = category === 'books';
    const currentVerb = isBook ? `διαβάζει ${cat.article}` : `παρακολουθεί ${cat.article}`;

    const statusActions: Record<string, string> = {
      planned: `πρόσθεσε ${cat.article}`,
      current: currentVerb,
      completed: `ολοκλήρωσε ${cat.article}`,
      dropped: `παράτησε ${cat.article}`,
    };
    return `${name} ${statusActions[status] || 'άλλαξε status'} ${cat.label}: ${mediaTitle}`;
  }
  if (item.type === 'media_favorite') {
    const cat = categoryWithArticle[category] || { article: 'το', label: 'media' };
    const action = p.favoriteAction === 'removed' ? 'αφαίρεσε από favorites' : 'έκανε favorite';
    return `${name} ${action} ${cat.article} ${cat.label}: ${mediaTitle}`;
  }
  // Article/Review activities - check topic to distinguish
  const isReview = p.topic === 'reviews';
  const contentType = isReview ? 'το review' : 'άρθρο';
  const contentTitle = p.articleTitle || (isReview ? 'review' : 'άρθρο');

  if (item.type === 'article_created') {
    return `${name} δημοσίευσε ${contentType}: ${contentTitle}`;
  }
  if (item.type === 'article_updated') {
    return `${name} ενημέρωσε ${contentType}: ${contentTitle}`;
  }
  if (item.type === 'article_deleted') {
    return `${name} διέγραψε ${contentType}: ${contentTitle}`;
  }
  if (item.type === 'article_liked') {
    return `${name} έκανε like στο: ${contentTitle}`;
  }
  if (item.type === 'article_comment') {
    return `${name} σχολίασε στο: ${contentTitle}`;
  }
  return `${name} έκανε μια ενέργεια`;
}

function iconFor(item: ActivityItem) {
  if (item.type === 'backlog_added') return <Gamepad2 className="h-4 w-4 text-sky-300" />;
  if (item.type === 'backlog_status') {
    const status = (item.payload?.status || '').toString();
    if (status === 'platinumed') return <TrophyIcon className="h-4 w-4 text-blue-300" />;
    if (status === 'dropped') return <Flag className="h-4 w-4 text-red-300" />;
    if (status === 'playing') return <Gamepad2 className="h-4 w-4 text-emerald-300" />;
    if (item.payload?.favoriteAction === 'added') return <Heart className="h-4 w-4 text-red-300" />;
    if (item.payload?.favoriteAction === 'removed')
      return <Heart className="h-4 w-4 text-slate-500" />;
    return <Gamepad2 className="h-4 w-4 text-amber-300" />;
  }
  if (item.type === 'guide_created') return <Sparkles className="h-4 w-4 text-violet-300" />;
  if (item.type === 'step_completed') return <TrophyIcon className="h-4 w-4 text-amber-300" />;
  if (item.type === 'media_added') return <Sparkles className="h-4 w-4 text-sky-300" />;
  if (item.type === 'media_status') return <Gamepad2 className="h-4 w-4 text-emerald-300" />;
  if (item.type === 'media_favorite') return <Heart className="h-4 w-4 text-rose-300" />;
  // Article/Review icons - use Star for reviews
  const isReview = item.payload?.topic === 'reviews';
  if (item.type === 'article_created') {
    return isReview
      ? <Star className="h-4 w-4 text-amber-300" />
      : <FileText className="h-4 w-4 text-emerald-300" />;
  }
  if (item.type === 'article_updated') {
    return isReview
      ? <Star className="h-4 w-4 text-amber-300" />
      : <Pencil className="h-4 w-4 text-blue-300" />;
  }
  if (item.type === 'article_deleted') return <Trash2 className="h-4 w-4 text-red-300" />;
  if (item.type === 'article_liked') return <Heart className="h-4 w-4 text-rose-300" />;
  if (item.type === 'article_comment') return <MessageSquare className="h-4 w-4 text-cyan-300" />;
  return <UserIcon className="h-4 w-4 text-slate-300" />;
}

// Category labels for alerts
const categoryLabels: Record<string, string> = {
  anime: 'Anime',
  manga: 'Manga',
  movies: 'Ταινίες',
  books: 'Βιβλία',
  tv: 'Σειρές',
};

export function ActivityFeed({
  scope,
  limit = 10,
  title,
  compact = false,
  height,
}: ActivityFeedProps) {
  const { data, error, isLoading } = useSWR(
    `/api/activity?scope=${scope}&limit=${limit}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const user = useSelector(selectUser);
  const userCategories = user?.categories ?? null;

  // State for category access alert
  const [alertCategory, setAlertCategory] = useState<string | null>(null);

  const showCategoryAlert = (category: string) => {
    setAlertCategory(category);
  };

  const activities: ActivityItem[] = data?.activities ?? [];

  return (
    <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-4 shadow-[0_12px_30px_rgba(3,7,18,0.45)]">
      {/* Category access alert */}
      {alertCategory && (
        <AlertMessage
          type="info"
          title="Κατηγορία μη διαθέσιμη"
          message={
            <span>
              Δεν έχεις επιλέξει την κατηγορία <strong>{categoryLabels[alertCategory] || alertCategory}</strong> στο προφίλ σου.{' '}
              <Link
                href="/pages/profile/edit#categories"
                className="font-semibold text-[var(--hb-primary)] hover:text-[var(--hb-accent)] underline"
              >
                Πρόσθεσέ την εδώ
              </Link>
            </span>
          }
          duration={0}
          onClose={() => setAlertCategory(null)}
          showProgress={false}
        />
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--hb-headline)]">
          {title || 'Τελευταίες ενέργειες'}
        </h3>
        <div className="flex items-center gap-1 text-xs text-[var(--hb-muted)]">
          <Clock className="h-3.5 w-3.5" />
          <span>Live</span>
        </div>
      </div>

      {isLoading && <LoadingSpinner size="sm" label="Φόρτωση..." />}
      {error && (
        <ErrorState error="Σφάλμα φόρτωσης activity. Προσπάθησε ξανά αργότερα." />
      )}
      {!isLoading && !error && activities.length === 0 && (
        <EmptyState title="Καμία πρόσφατη ενέργεια." />
      )}

      <CategoryAlertContext.Provider value={{ showCategoryAlert, userCategories }}>
        <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: `${height ?? 360}px` }}>
          {activities.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 ${
                compact ? 'text-sm' : 'text-base'
              }`}
            >
              <div className="mt-0.5">{iconFor(item)}</div>
              <div className="flex-1">
                <FeedText item={item} />
                <p className="text-xs text-[var(--hb-muted)]">{timeAgo(item.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </CategoryAlertContext.Provider>
    </div>
  );
}

function slugifyTitle(title: string) {
  return title
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function FeedText({ item }: { item: ActivityItem }) {
  const text = renderText(item);
  const payload = item.payload || {};
  const alertContext = useContext(CategoryAlertContext);

  // Article activities - link to article
  if (
    (item.type === 'article_created' ||
      item.type === 'article_updated' ||
      item.type === 'article_liked' ||
      item.type === 'article_comment') &&
    payload.articleSlug
  ) {
    const articleSlug = normalizeSlug(payload.articleSlug as string);
    return (
      <Link
        href={`/pages/news/${articleSlug}`}
        className="text-[var(--hb-headline)] transition-colors hover:text-[var(--hb-primary-strong)]"
      >
        {text}
      </Link>
    );
  }

  // Game/guide activities
  const slug =
    (payload.gameSlug as string | undefined) ||
    (payload.slug as string | undefined) ||
    (payload.gameTitle ? slugifyTitle(payload.gameTitle as string) : undefined);

  if (
    (item.type === 'guide_created' ||
      item.type === 'backlog_status' ||
      item.type === 'backlog_added') &&
    slug
  ) {
    return (
      <Link
        href={`/pages/guides/${slug}`}
        className="text-[var(--hb-headline)] transition-colors hover:text-[var(--hb-primary-strong)]"
      >
        {text}
      </Link>
    );
  }

  // Media activities - check if user has access to the category
  if (
    (item.type === 'media_added' ||
      item.type === 'media_status' ||
      item.type === 'media_favorite') &&
    payload.category
  ) {
    const category = payload.category as string;
    const userCategories = alertContext?.userCategories;
    const hasCategory = userCategories?.includes(category);

    // If user doesn't have this category, show alert on click instead of navigating
    if (!hasCategory && alertContext) {
      return (
        <button
          onClick={() => alertContext.showCategoryAlert(category)}
          className="text-left text-[var(--hb-headline)] transition-colors hover:text-[var(--hb-primary-strong)]"
        >
          {text}
        </button>
      );
    }

    // User has the category, navigate normally
    return (
      <Link
        href={`/pages/backlog?category=${payload.category}`}
        className="text-[var(--hb-headline)] transition-colors hover:text-[var(--hb-primary-strong)]"
      >
        {text}
      </Link>
    );
  }
  return <p className="text-[var(--hb-headline)]">{text}</p>;
}
