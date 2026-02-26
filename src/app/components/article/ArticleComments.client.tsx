'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';
import { FormattedDate } from '@/utils/components/FormattedDate';

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
  const [pendingDeleteConfirmId, setPendingDeleteConfirmId] = useState<number | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/articles/${articleId}/comments?limit=20`);
      if (!response.ok) {
        throw new Error('Failed to load comments');
      }
      const payload: CommentsResponse = await response.json();
      setComments(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
      setError('Write a comment before posting.');
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
        throw new Error(payload?.error || 'Failed to post comment');
      }
      setCommentText('');
      setSuccessMessage('Your comment was posted.');
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: number) => {
    if (!user) {
      return;
    }
    setEditError(null);
    const trimmed = editContent.trim();
    if (!trimmed) {
      setEditError('Comment cannot be empty.');
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
        throw new Error(payload?.error || 'Failed to update comment');
      }
      setEditingCommentId(null);
      setEditContent('');
      setSuccessMessage('Your comment was updated.');
      await fetchComments();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!user) {
      return;
    }
    if (pendingDeleteConfirmId !== commentId) {
      setPendingDeleteConfirmId(commentId);
      return;
    }
    const previousComments = comments;
    setDeleteLoading(commentId);
    setError(null);
    setPendingDeleteConfirmId(null);
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
      setEditContent('');
      setEditError(null);
    }
    try {
      const response = await fetch(`/api/articles/${articleId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete comment');
      }
      setSuccessMessage('Comment deleted.');
    } catch (err) {
      setComments(previousComments);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      await fetchComments();
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
    <section className="mt-12 rounded-3xl border border-border bg-card p-6 text-foreground shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">Comments</h3>
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {comments.length} comments
        </span>
      </div>
      {loading ? (
        <div className="mt-6 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            comments.map(comment => (
              <article key={comment.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {comment.users?.display_name || comment.users?.username || 'Anonymous'}
                  </span>
                  <FormattedDate
                    date={comment.created_at}
                    options={COMMENT_DATE_OPTIONS}
                    fallback="-"
                    className="text-xs"
                  />
                </div>
                {editingCommentId === comment.id ? (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      value={editContent}
                      rows={4}
                      onChange={event => setEditContent(event.target.value)}
                      placeholder="Edit your comment"
                      className={editError ? 'border-red-500 focus-visible:ring-red-500/30' : ''}
                    />
                    {editError && <p className="text-xs text-red-400">{editError}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleUpdate(comment.id)}
                        disabled={editLoading}
                        variant="primary"
                      >
                        {editLoading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingCommentId(null)}
                        disabled={editLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-sm leading-relaxed">{comment.content}</p>
                    {user && canManageComment(comment) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {pendingDeleteConfirmId === comment.id ? (
                          <>
                            <Button
                              variant="secondary"
                              type="button"
                              onClick={() => handleDelete(comment.id)}
                              disabled={deleteLoading === comment.id}
                            >
                              {deleteLoading === comment.id ? 'Deleting...' : 'Confirm delete'}
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              onClick={() => setPendingDeleteConfirmId(null)}
                              disabled={deleteLoading === comment.id}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="primary"
                              onClick={() => {
                                setPendingDeleteConfirmId(null);
                                setEditingCommentId(comment.id);
                                setEditContent(comment.content);
                                setEditError(null);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              type="button"
                              onClick={() => handleDelete(comment.id)}
                              disabled={deleteLoading === comment.id}
                            >
                              {deleteLoading === comment.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </>
                        )}
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
          <p className="text-xs text-muted-foreground">
            You need an account to comment.{' '}
            <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
              Log in
            </Link>{' '}
            or{' '}
            <Link href="/auth/register" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
            .
          </p>
        )}
        {user ? (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Your comment</label>
              <Textarea
                value={commentText}
                onChange={event => setCommentText(event.target.value)}
                rows={4}
                placeholder="Share your thoughts"
                className={error ? 'border-red-500 focus-visible:ring-red-500/30' : ''}
              />
            </div>
            {successMessage && <p className="text-sm text-primary">{successMessage}</p>}
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post comment'}
            </Button>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button href="/auth/login" variant="outline">
              Log in
            </Button>
            <Button href="/auth/register" variant="primary">
              Sign up
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
