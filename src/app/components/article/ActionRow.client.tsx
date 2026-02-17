'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { ClipboardCopy, Heart, Pencil, Share2, Trash2 } from 'lucide-react';
import type { ArticleRow } from '@/types/database';
import { selectCanEditArticles, selectIsAuthorOf } from '@/store/slices/authSlice';
import EditArticleDialog from '@/app/components/articles/EditArticleDialog';
import { Spinner } from '@/components/ui/spinner';
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
  const fallbackBase = article.topic === 'reviews' ? '/review' : '/articles';
  const fallbackHref = `${fallbackBase}?category=${article.category}`;

  useEffect(() => {
    let active = true;
    fetch(`/api/articles/${article.id}/like`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active || !data) {
          return;
        }
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
    if (likeLoading || isAuthor) {
      return;
    }
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
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this article? This action cannot be undone.',
      )
    ) {
      return;
    }

    setIsDeleteLoading(true);
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to delete the article.');
      }

      router.push(fallbackHref);
    } catch (deleteError) {
      console.error('Error deleting article:', deleteError);
      window.alert(
        deleteError instanceof Error
          ? deleteError.message
          : 'Something went wrong while deleting. Please try again.',
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
          size="icon"
          variant="secondary"
          onClick={handleShare}
          aria-label="Share"
          title="Share"
          className="h-12 w-12 rounded-full border border-border bg-card text-foreground shadow-sm transition-all hover:scale-110 hover:text-primary active:scale-95"
        >
          <Share2 size={28} strokeWidth={2.2} /> {/* Larger icon & thicker stroke */}
        </Button>

        <Button
          type="button"
          iconOnly
          size="icon"
          variant="secondary"
          onClick={handleCopyLink}
          aria-label="Copy link"
          title={copied ? 'Link copied!' : 'Copy link'}
          className={`h-12 w-12 rounded-full border border-border bg-card shadow-sm transition-all active:scale-95 ${
            copied ? 'text-primary' : 'text-foreground hover:text-primary'
          }`}
        >
          <ClipboardCopy size={28} strokeWidth={2.2} />
        </Button>

        <Button
          type="button"
          iconOnly
          size="icon"
          variant="secondary"
          onClick={toggleLike}
          disabled={likeLoading || isAuthor}
          className={`h-12 w-12 rounded-full border border-border bg-card shadow-sm transition-all active:scale-90 ${
            likeState.liked ? 'text-primary' : 'text-foreground'
          } ${isAuthor ? 'cursor-not-allowed opacity-40' : 'hover:text-primary'}`}
        >
          <Heart size={28} fill={likeState.liked ? 'currentColor' : 'none'} strokeWidth={2.2} />
        </Button>

        {canEdit && (
          <Button
            type="button"
            iconOnly
            size="icon"
            variant="secondary"
            onClick={() => setIsEditOpen(true)}
            className="h-12 w-12 rounded-full border border-border bg-card text-foreground shadow-sm transition-all hover:text-primary active:scale-95"
          >
            <Pencil size={28} strokeWidth={2.2} />
          </Button>
        )}

        {canEdit && (
          <Button
            type="button"
            variant="secondary"
            iconOnly
            size="icon"
            onClick={handleDelete}
            disabled={isDeleteLoading}
            className="h-12 w-12 rounded-full border border-border bg-card text-destructive shadow-sm transition-all hover:bg-destructive/10 active:scale-95"
          >
            {isDeleteLoading ? (
              <Spinner className="size-4 text-destructive" />
            ) : (
              <Trash2 size={28} strokeWidth={2.2} />
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
