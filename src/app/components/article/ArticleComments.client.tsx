'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { Textarea } from '@/app/components/ui/Textarea';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';
import { FormattedDate } from '@/app/components/ui/FormattedDate';

type Comment = {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  users?: {
    username: string;
    display_name: string | null;
  } | null;
};

type CommentsResponse = {
  data: Comment[];
  meta?: { total?: number };
};

const COMMENT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

type ArticleCommentsProps = {
  articleId: number;
};

export default function ArticleComments({ articleId }: ArticleCommentsProps) {
  const user = useSelector(selectUser);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/articles/${articleId}/comments?limit=20`);
      if (!response.ok) {
        throw new Error('Δεν καταφέραμε να φορτώσουμε τα σχόλια');
      }
      const payload: CommentsResponse = await response.json();
      setComments(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    const trimmed = commentText.trim();
    if (!trimmed) {
      setError('Γράψε κάτι πριν το δημοσιεύσεις.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Αποτυχία αποστολής σχολίου');
      }
      setCommentText('');
      setSuccessMessage('Το σχόλιό σου δημοσιεύτηκε.');
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: number) => {
    if (!user) return;
    setEditError(null);
    const trimmed = editContent.trim();
    if (!trimmed) {
      setEditError('Το σχόλιο δεν μπορεί να είναι άδειο.');
      return;
    }

    setEditLoading(true);
    try {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: trimmed }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Αποτυχία ενημέρωσης σχολίου');
      }
      setEditingCommentId(null);
      setEditContent('');
      setSuccessMessage('Το σχόλιό σου ενημερώθηκε.');
      await fetchComments();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!user) return;
    if (!window.confirm('Θέλεις να διαγράψεις το σχόλιο;')) {
      return;
    }
    setDeleteLoading(commentId);
    setError(null);
    try {
      const response = await fetch(`/api/articles/${articleId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Αποτυχία διαγραφής σχολίου');
      }
      setSuccessMessage('Το σχόλιο διαγράφηκε.');
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά');
    } finally {
      setDeleteLoading(null);
    }
  };

  const canManageComment = useMemo(
    () => (comment: Comment) =>
      Boolean(user && (user.id === comment.user_id || hasAnyRole(user, ['admin', 'owner']))),
    [user],
  );

  return (
    <section className="mt-12 rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 text-[var(--hb-text)] shadow-[var(--hb-shadow-md)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[var(--hb-headline)]">Σχόλια</h3>
        <span className="text-xs uppercase tracking-[0.3em] text-[var(--hb-muted)]">
          {comments.length} σχόλια
        </span>
      </div>
      {loading ? (
        <div className="mt-6 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {comments.length === 0 ? (
            <p className="text-sm text-[var(--hb-muted)]">Δεν υπάρχουν ακόμα σχόλια.</p>
          ) : (
            comments.map(comment => (
              <article
                key={comment.id}
                className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4"
              >
                <div className="flex items-center justify-between text-xs text-[var(--hb-muted)]">
                  <span>
                    {comment.users?.display_name || comment.users?.username || 'Ανώνυμος'}
                  </span>
                  <FormattedDate
                    date={comment.created_at}
                    options={COMMENT_DATE_OPTIONS}
                    fallback="—"
                    className="text-xs"
                  />
                </div>
                {editingCommentId === comment.id ? (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      value={editContent}
                      rows={4}
                      onChange={event => setEditContent(event.target.value)}
                      placeholder="Επεξεργάσου το σχόλιο"
                      error={Boolean(editError)}
                    />
                    {editError && <p className="text-xs text-red-400">{editError}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleUpdate(comment.id)}
                        disabled={editLoading}
                        variant="primary"
                      >
                        {editLoading ? 'Αποθήκευση...' : 'Αποθήκευση'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingCommentId(null)}
                        disabled={editLoading}
                      >
                        Ακύρωση
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-sm leading-relaxed">{comment.content}</p>
                    {user && canManageComment(comment) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={'primary'}
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditContent(comment.content);
                            setEditError(null);
                          }}
                        >
                          Επεξεργασία
                        </Button>
                        <Button
                          variant={'secondary'}
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          disabled={deleteLoading === comment.id}
                        >
                          {deleteLoading === comment.id ? 'Διαγραφή...' : 'Διαγραφή'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </article>
            ))
          )}
        </div>
      )}

      <div className="mt-8 space-y-3">
        {!user && (
          <p className="text-xs text-[var(--hb-muted)]">
            Για να κάνεις σχόλιο χρειάζεται λογαριασμός.{' '}
            <Link
              href="/pages/auth/login"
              className="text-[var(--hb-primary)] underline-offset-4 hover:underline"
            >
              Σύνδεση
            </Link>{' '}
            ή{' '}
            <Link
              href="/pages/auth/register"
              className="text-[var(--hb-primary)] underline-offset-4 hover:underline"
            >
              Εγγραφή
            </Link>
            .
          </p>
        )}
        {user ? (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Textarea
              label="Το σχόλιό σου"
              value={commentText}
              onChange={event => setCommentText(event.target.value)}
              rows={4}
              placeholder="Πες μας τη γνώμη σου"
              error={Boolean(error)}
            />
            {successMessage && <p className="text-sm text-[var(--hb-primary)]">{successMessage}</p>}
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Αποστολή...' : 'Δημοσίευση σχολίου'}
            </Button>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button href="/pages/auth/login" variant="outline">
              Σύνδεση
            </Button>
            <Button href="/pages/auth/register" variant="primary">
              Εγγραφή
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
