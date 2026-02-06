'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { ClipboardCopy, Heart, Pencil, Share2, Trash2 } from 'lucide-react';
import type { ArticleRow } from '@/types/database';
import { selectCanEditArticles, selectIsAuthorOf } from '@/store/slices/authSlice';
import EditArticleDialog from '@/app/components/articles/EditArticleDialog';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';

type ActionRowProps = {
  article: ArticleRow;
};

type LikeState = {
  liked: boolean;
  count: number;
};

export default function ActionRow({ article }: ActionRowProps) {
  const router = useRouter();
  const canEdit = useSelector(selectCanEditArticles);
  const isAuthor = useSelector(selectIsAuthorOf(article.author_id));
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [likeState, setLikeState] = useState<LikeState>({
    liked: false,
    count: article.likes || 0,
  });
  const [likeLoading, setLikeLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackBase = article.topic === 'reviews' ? '/pages/reviews' : '/pages/news';
  const fallbackHref = `${fallbackBase}?category=${article.category}`;

  useEffect(() => {
    let active = true;
    fetch(`/api/articles/${article.id}/like`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active || !data) return;
        const payload = data?.data ?? data;
        setLikeState({
          liked: !!payload.liked,
          count: typeof payload.count === 'number' ? payload.count : article.likes || 0,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [article.id, article.likes]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: article.description || '',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled or share failed
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
    } catch {
      // ignore clipboard failure
    }
  };

  const handleCopyLink = async () => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      // ignore clipboard failures
    }
  };

  const toggleLike = async () => {
    if (likeLoading || isAuthor) return;
    setLikeLoading(true);

    try {
      const method = likeState.liked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/articles/${article.id}/like`, { method });
      if (!response.ok) {
        setLikeLoading(false);
        return;
      }

      const data = await response.json();
      const payload = data?.data ?? data;
      setLikeState({
        liked: !!payload.liked,
        count: typeof payload.count === 'number' ? payload.count : likeState.count,
      });
    } catch {
      // ignore like failures
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Θέλεις να διαγράψεις οριστικά το άρθρο; Η ενέργεια δεν αναστρέφεται.')) {
      return;
    }

    setIsDeleteLoading(true);
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Αποτυχία διαγραφής άρθρου');
      }

      router.push(fallbackHref);
    } catch (deleteError) {
      console.error('Error deleting article:', deleteError);
      window.alert(
        deleteError instanceof Error
          ? deleteError.message
          : 'Κάτι πήγε στραβά κατά τη διαγραφή. Δοκίμασε ξανά.',
      );
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-[44px] items-center justify-center gap-3">
        <Button
          type="button"
          iconOnly
          size={'icon'}
          variant={'secondary'}
          onClick={handleShare}
          aria-label="Κοινοποίηση"
          title="Κοινοποίηση"
          className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-[16px] text-[var(--hb-text)] transition hover:text-[var(--hb-primary)]"
        >
          <Share2 size={14} />
        </Button>
        <Button
          type="button"
          iconOnly
          size={'icon'}
          variant={'secondary'}
          onClick={handleCopyLink}
          aria-label="Αντιγραφή συνδέσμου"
          title={copied ? 'Ο σύνδεσμος αντιγράφηκε' : 'Αντιγραφή συνδέσμου'}
          className={`rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-[11px] transition ${
            copied ? 'text-[var(--hb-primary)]' : 'text-[var(--hb-text)]'
          }`}
        >
          <ClipboardCopy size={14} />
        </Button>
        <Button
          type="button"
          iconOnly
          size={'icon'}
          variant={'secondary'}
          onClick={toggleLike}
          aria-label={
            isAuthor
              ? 'Δεν μπορείτε να κάνετε like στο δικό σας άρθρο'
              : likeState.liked
                ? 'Αφαίρεση like'
                : 'Like'
          }
          title={
            isAuthor
              ? 'Δεν μπορείς να κάνεις like στο δικό σου άρθρο'
              : likeState.liked
                ? 'Αφαίρεση like'
                : 'Like'
          }
          className={`rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-[11px] transition ${
            likeState.liked ? 'text-[var(--hb-primary)]' : 'text-[var(--hb-text)]'
          } ${isAuthor ? 'cursor-not-allowed opacity-70' : 'hover:text-[var(--hb-primary)]'}`}
          disabled={likeLoading || isAuthor}
        >
          <Heart size={14} />
        </Button>
        {canEdit && (
          <Button
            type="button"
            iconOnly
            size={'icon'}
            variant={'secondary'}
            onClick={() => setIsEditOpen(true)}
            aria-label="Επεξεργασία"
            title="Επεξεργασία"
            className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-[11px] text-[var(--hb-text)] transition hover:text-[var(--hb-primary)]"
          >
            <Pencil size={14} />
          </Button>
        )}
        {canEdit && (
          <Button
            type="button"
            variant={'secondary'}
            iconOnly
            size={'icon'}
            onClick={handleDelete}
            aria-label="Διαγραφή"
            title="Διαγραφή άρθρου"
            className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-[11px] text-red-400 transition hover:text-red-500 disabled:text-red-400/40"
            disabled={isDeleteLoading}
          >
            {isDeleteLoading ? (
              <LoadingSpinner size="sm" inline className="text-red-400" />
            ) : (
              <Trash2 size={14} />
            )}
          </Button>
        )}
      </div>
      {canEdit && (
        <EditArticleDialog
          isOpen={isEditOpen}
          article={article}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            setIsEditOpen(false);
            router.refresh();
          }}
          onDelete={() => {
            setIsEditOpen(false);
            router.push(fallbackHref);
          }}
        />
      )}
    </>
  );
}
