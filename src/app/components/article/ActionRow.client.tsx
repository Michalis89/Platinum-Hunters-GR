'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Heart, Pencil, Share2 } from 'lucide-react';
import type { ArticleRow } from '@/types/database';
import { selectUser } from '@/store/slices/authSlice';
import EditArticleDialog from '@/app/components/articles/EditArticleDialog';

type ActionRowProps = {
  article: ArticleRow;
};

type LikeState = {
  liked: boolean;
  count: number;
};

export default function ActionRow({ article }: ActionRowProps) {
  const router = useRouter();
  const currentUser = useSelector(selectUser);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [likeState, setLikeState] = useState<LikeState>({
    liked: false,
    count: article.likes || 0,
  });
  const [likeLoading, setLikeLoading] = useState(false);

  const canEdit =
    !!currentUser && (currentUser.role === 'admin' || currentUser.role === 'author');

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

  const toggleLike = async () => {
    if (likeLoading) return;
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

  return (
    <>
      <div className="flex min-h-[36px] items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          aria-label="Κοινοποίηση"
          title="Κοινοποίηση"
          className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-[11px] text-[var(--hb-text)] transition hover:text-[var(--hb-primary)]"
        >
          <Share2 size={14} />
        </button>
        <button
          type="button"
          onClick={toggleLike}
          aria-label={likeState.liked ? 'Αφαίρεση like' : 'Like'}
          title={likeState.liked ? 'Αφαίρεση like' : 'Like'}
          className={`rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-[11px] transition ${
            likeState.liked ? 'text-[var(--hb-primary)]' : 'text-[var(--hb-text)]'
          }`}
          disabled={likeLoading}
        >
          <Heart size={14} />
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            aria-label="Επεξεργασία"
            title="Επεξεργασία"
            className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1 text-[11px] text-[var(--hb-text)] transition hover:text-[var(--hb-primary)]"
          >
            <Pencil size={14} />
          </button>
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
        />
      )}
    </>
  );
}
