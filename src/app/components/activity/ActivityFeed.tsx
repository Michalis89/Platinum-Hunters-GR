'use client';

import { memo, useState, useEffect, createContext, useContext } from 'react';
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
import { getActivityHref } from './activityHelpers';
import EmptyState from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle, ErrorAlert } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { selectUser } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';

// Context to pass down category alert state to FeedText
type CategoryAlertState = {
  showCategoryAlert: (category: string) => void;
  userCategories: string[] | null;
};

const CategoryAlertContext = createContext<CategoryAlertState | null>(null);

type ActivityType =
  | 'backlog_added'
  | 'backlog_status'
  | 'media_added'
  | 'media_status'
  | 'media_favorite'
  | 'article_created'
  | 'article_updated'
  | 'article_deleted'
  | 'article_liked'
  | 'article_unliked'
  | 'article_comment'
  | 'article_commented'
  | 'article_comment_deleted';

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

// Hydration-safe relative time component
function RelativeTime({ date }: { date: string }) {
  const [relativeTime, setRelativeTime] = useState<string | null>(null);

  useEffect(() => {
    // Calculate immediately on mount
    setRelativeTime(timeAgo(date));

    // Update every minute
    const interval = setInterval(() => {
      setRelativeTime(timeAgo(date));
    }, 60000);

    return () => clearInterval(interval);
  }, [date]);

  return <span suppressHydrationWarning>{relativeTime ?? '...'}</span>;
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
    games: { article: 'το', label: 'παιχνίδι' },
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
  if (item.type === 'media_added') {
    const cat = categoryWithArticle[category] || { article: 'το', label: 'media' };
    const status = (p.status || 'planned').toString();

    // Different verbs based on category
    const isBook = category === 'books';
    const isGame = category === 'games';

    let currentVerb: string;
    let plannedVerb: string;

    if (isGame) {
      currentVerb = `παίζει τώρα ${cat.article}`;
      plannedVerb = `πρόσθεσε ${cat.article} ${cat.label} στο backlog`;
    } else if (isBook) {
      currentVerb = `ξεκίνησε να διαβάζει ${cat.article}`;
      plannedVerb = `πρόσθεσε ${cat.article}`;
    } else {
      currentVerb = `ξεκίνησε να παρακολουθεί ${cat.article}`;
      plannedVerb = `πρόσθεσε ${cat.article}`;
    }

    const statusActions: Record<string, string> = {
      planned: plannedVerb,
      current: currentVerb,
      completed: `ολοκλήρωσε ${cat.article}`,
      dropped: `παράτησε ${cat.article}`,
    };
    const action = statusActions[status] || `πρόσθεσε ${cat.article}`;
    // For games with planned status, don't repeat "παιχνίδι" twice
    if (isGame && status === 'planned') {
      return `${name} ${action}: ${mediaTitle}`;
    }
    return `${name} ${action} ${cat.label}: ${mediaTitle}`;
  }
  if (item.type === 'media_status') {
    const cat = categoryWithArticle[category] || { article: 'το', label: 'media' };
    const status = (p.status || '').toString();
    const isBook = category === 'books';
    const isGame = category === 'games';

    let currentVerb: string;
    let plannedVerb: string;

    if (isGame) {
      currentVerb = `παίζει τώρα ${cat.article}`;
      plannedVerb = `πρόσθεσε ${cat.article} ${cat.label} στο backlog`;
    } else if (isBook) {
      currentVerb = `διαβάζει ${cat.article}`;
      plannedVerb = `πρόσθεσε ${cat.article}`;
    } else {
      currentVerb = `παρακολουθεί ${cat.article}`;
      plannedVerb = `πρόσθεσε ${cat.article}`;
    }

    const statusActions: Record<string, string> = {
      planned: plannedVerb,
      current: currentVerb,
      completed: `ολοκλήρωσε ${cat.article}`,
      dropped: `παράτησε ${cat.article}`,
    };

    // For games with planned status, don't repeat "παιχνίδι" twice
    if (isGame && status === 'planned') {
      return `${name} ${statusActions[status] || 'άλλαξε status'}: ${mediaTitle}`;
    }
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
  if (item.type === 'article_unliked') {
    return `${name} αφαίρεσε το like από: ${contentTitle}`;
  }
  if (item.type === 'article_comment') {
    return `${name} σχολίασε στο: ${contentTitle}`;
  }
  if (item.type === 'article_commented') {
    return `${name} σχολίασε στο: ${contentTitle}`;
  }
  if (item.type === 'article_comment_deleted') {
    return `${name} διέγραψε σχόλιο στο: ${contentTitle}`;
  }
  return `${name} έκανε μια ενέργεια`;
}

function iconFor(item: ActivityItem) {
  if (item.type === 'backlog_added') return <Gamepad2 className="h-4 w-4 text-primary" />;
  if (item.type === 'backlog_status') {
    const status = (item.payload?.status || '').toString();
    if (status === 'platinumed') return <TrophyIcon className="h-4 w-4 text-warning" />;
    if (status === 'dropped') return <Flag className="h-4 w-4 text-destructive" />;
    if (status === 'playing') return <Gamepad2 className="h-4 w-4 text-emerald-500" />;
    if (item.payload?.favoriteAction === 'added')
      return <Heart className="h-4 w-4 text-rose-500" />;
    if (item.payload?.favoriteAction === 'removed')
      return <Heart className="h-4 w-4 text-muted-foreground" />;
    return <Gamepad2 className="h-4 w-4 text-primary" />;
  }
  if (item.type === 'media_added') return <Sparkles className="h-4 w-4 text-primary" />;
  if (item.type === 'media_status') return <Gamepad2 className="h-4 w-4 text-emerald-500" />;
  if (item.type === 'media_favorite') return <Heart className="h-4 w-4 text-rose-500" />;
  // Article/Review icons - use Star for reviews
  const isReview = item.payload?.topic === 'reviews';
  if (item.type === 'article_created') {
    return isReview ? (
      <Star className="h-4 w-4 text-warning" />
    ) : (
      <FileText className="h-4 w-4 text-primary" />
    );
  }
  if (item.type === 'article_updated') {
    return isReview ? (
      <Star className="h-4 w-4 text-warning" />
    ) : (
      <Pencil className="h-4 w-4 text-primary" />
    );
  }
  if (item.type === 'article_deleted') return <Trash2 className="h-4 w-4 text-destructive" />;
  if (item.type === 'article_liked') return <Heart className="h-4 w-4 text-rose-500" />;
  if (item.type === 'article_unliked') return <Heart className="h-4 w-4 text-muted-foreground" />;
  if (item.type === 'article_comment') return <MessageSquare className="h-4 w-4 text-primary" />;
  if (item.type === 'article_commented') return <MessageSquare className="h-4 w-4 text-primary" />;
  if (item.type === 'article_comment_deleted')
    return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  return <UserIcon className="h-4 w-4 text-muted-foreground" />;
}

// Category labels for alerts
const categoryLabels: Record<string, string> = {
  anime: 'Anime',
  manga: 'Manga',
  movies: 'Ταινίες',
  books: 'Βιβλία',
  tv: 'Σειρές',
  games: 'Παιχνίδια',
};

function ActivityFeedComponent({
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
  const feedTextClass = '  font-medium transition-colors hover:text-primary';

  return (
    <div className="p-4 sm:p-5">
      {/* Category access alert */}
      {alertCategory && (
        <Alert variant="info" className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Κατηγορία μη διαθέσιμη</AlertTitle>
          <AlertDescription>
            <span>
              Δεν έχεις επιλέξει την κατηγορία{' '}
              <strong>{categoryLabels[alertCategory] || alertCategory}</strong> στο προφίλ σου.{' '}
              <Link
                href="/pages/profile/edit#categories"
                className="font-semibold text-primary underline hover:opacity-85"
              >
                Πρόσθεσέ την εδώ
              </Link>
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title || 'Τελευταίες ενέργειες'}</h3>
        <div className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium">
          <Clock className="h-3.5 w-3.5" />
          <span>Live</span>
        </div>
      </div>

      {isLoading && (
        <div className="inline-flex items-center gap-2">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">Φόρτωση...</span>
        </div>
      )}
      {error && <ErrorAlert message="Σφάλμα φόρτωσης activity. Προσπάθησε ξανά αργότερα." />}
      {!isLoading && !error && activities.length === 0 && (
        <EmptyState title="Καμία πρόσφατη ενέργεια." />
      )}

      <CategoryAlertContext.Provider value={{ showCategoryAlert, userCategories }}>
        <div
          className="space-y-2.5 overflow-y-auto pr-1"
          style={{ maxHeight: `${height ?? 360}px` }}
        >
          {activities.map(item => (
            <div
              key={item.id}
              className={`group flex items-start gap-3 rounded-[16px] border bg-card/80 p-3 ${
                compact ? 'text-sm' : 'text-base'
              }`}
            >
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-card">
                {iconFor(item)}
              </div>
              <div className="min-w-0 flex-1">
                <FeedText item={item} textClass={feedTextClass} />
                <p className="text-xs">
                  <RelativeTime date={item.created_at} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </CategoryAlertContext.Provider>
    </div>
  );
}

export const ActivityFeed = memo(ActivityFeedComponent);

function FeedText({ item, textClass }: { item: ActivityItem; textClass: string }) {
  const text = renderText(item);
  const payload = item.payload || {};
  const alertContext = useContext(CategoryAlertContext);

  // Article activities - link to article
  if (
    (item.type === 'article_created' ||
      item.type === 'article_updated' ||
      item.type === 'article_liked' ||
      item.type === 'article_unliked' ||
      item.type === 'article_comment' ||
      item.type === 'article_commented' ||
      item.type === 'article_comment_deleted') &&
    payload.articleSlug
  ) {
    const articleSlug = normalizeSlug(payload.articleSlug as string);
    return (
      <Link href={`/pages/news/${articleSlug}`} className={textClass}>
        {text}
      </Link>
    );
  }

  if (item.type === 'backlog_status' || item.type === 'backlog_added') {
    const category = payload.category as string | undefined;
    const userCategories = alertContext?.userCategories ?? [];
    const hasCategory = !category || userCategories.includes(category);

    if (category && !hasCategory && alertContext?.showCategoryAlert) {
      return (
        <Button variant={'primary'} onClick={() => alertContext.showCategoryAlert(category)}>
          {text}
        </Button>
      );
    }

    const backlogUrl = `/pages/backlog${category ? `?category=${category}` : ''}`;
    return (
      <Link href={backlogUrl} className={textClass}>
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
        <Button variant={'primary'} onClick={() => alertContext.showCategoryAlert(category)}>
          {text}
        </Button>
      );
    }

    const href = getActivityHref(item);
    if (!href) {
      return <p className="font-medium">{text}</p>;
    }

    return (
      <Link href={href} className={textClass}>
        {text}
      </Link>
    );
  }
  return <p className="font-medium">{text}</p>;
}
