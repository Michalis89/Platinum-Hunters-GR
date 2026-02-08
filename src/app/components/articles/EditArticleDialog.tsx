'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import ErrorState from '../ui/ErrorState';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { ArticleCategory, ArticleTopic, ArticleStatus, ArticleRow } from '@/types/database';
import { validatePlainText } from '@/utils/validation/text';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import dynamic from 'next/dynamic';
import { uploadArticleCoverImage } from '@/lib/media/uploadArticleCover';

const RichTextEditor = dynamic(() => import('../editor/RichTextEditor.client'), {
  ssr: false,
});
interface EditArticleDialogProps {
  isOpen: boolean;
  article: ArticleRow;
  onClose: () => void;
  onSuccess?: (article: ArticleRow) => void;
  onDelete?: () => void;
}

interface CategoryConfig {
  label: string;
  topics: { value: ArticleTopic; label: string }[];
}

const CATEGORIES: Record<ArticleCategory, CategoryConfig> = {
  games: {
    label: 'Games',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  anime: {
    label: 'Anime',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  manga: {
    label: 'Manga',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  books: {
    label: 'Βιβλία',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  movies: {
    label: 'Movies',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  tv: {
    label: 'TV Series',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  coding: {
    label: 'Coding',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
      { value: 'tutorials', label: 'Tutorials' },
      { value: 'weird-cases', label: 'Weird Cases' },
    ],
  },
  pet: {
    label: 'Pet',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
      { value: 'care', label: 'Φροντίδα' },
      { value: 'experiences', label: 'Εμπειρίες' },
      { value: 'health', label: 'Υγεία' },
    ],
  },
  vape: {
    label: 'Vape',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
      { value: 'devices', label: 'Ατμοποιητές/Συσκευές' },
      { value: 'liquids', label: 'Υγρά' },
      { value: 'experiences', label: 'Εμπειρίες' },
      { value: 'reviews', label: 'Κριτικές' },
    ],
  },
};

const STATUS_OPTIONS: { value: ArticleStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

function normalizeSlug(value: string) {
  const trimmed = value.replace(/^-+/, '').replace(/-+$/, '');
  return trimmed || value;
}

const stripEmptyParagraphs = (html: string) => {
  return html.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
};

export default function EditArticleDialog({
  isOpen,
  article,
  onClose,
  onSuccess,
  onDelete,
}: Readonly<EditArticleDialogProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const initialCategoryRef = useRef<ArticleCategory>(article.category);

  const [category, setCategory] = useState<ArticleCategory>(article.category);
  const [topic, setTopic] = useState<ArticleTopic>(article.topic);
  const [title, setTitle] = useState(article.title);
  const [description, setDescription] = useState(article.description ?? '');
  const [coverImage, setCoverImage] = useState(article.cover_image ?? '');
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [contentHtml, setContentHtml] = useState(article.content_html ?? '');
  const [tags, setTags] = useState((article.tags ?? []).join(', '));
  const [status, setStatus] = useState<ArticleStatus>(article.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCoverPreviewValid, setIsCoverPreviewValid] = useState(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog?.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    initialCategoryRef.current = article.category;
    setCategory(article.category);
    setTopic(article.topic);
    setTitle(article.title);
    setDescription(article.description ?? '');
    setCoverImage(article.cover_image ?? '');
    setContentHtml(article.content_html ?? '');
    setTags((article.tags ?? []).join(', '));
    setStatus(article.status);
    setError(null);
    setWarning(null);
    setIsCoverPreviewValid(true);
  }, [article, isOpen]);

  useEffect(() => {
    if (!category) return;
    if (category !== initialCategoryRef.current) {
      setTopic('articles');
    }
  }, [category]);

  useEffect(() => {
    setIsCoverPreviewValid(true);
  }, [coverImage]);

  const handleCoverUploadClick = () => {
    coverFileInputRef.current?.click();
  };

  const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setCoverUploadError(null);
    setIsCoverUploading(true);
    try {
      const uploadedUrl = await uploadArticleCoverImage(file);
      setCoverImage(uploadedUrl);
      setIsCoverPreviewValid(true);
    } catch (uploadErr) {
      console.error('Cover upload failed:', uploadErr);
      setCoverUploadError(
        uploadErr instanceof Error
          ? uploadErr.message
          : 'Αποτυχία ανέβασμα εικόνας. Δοκίμασε ξανά.',
      );
    } finally {
      setIsCoverUploading(false);
    }
  };

  const titleValidation = validatePlainText(title, 'Ο τίτλος');
  const descriptionValidation = validatePlainText(description, 'Η περιγραφή');
  const tagsValidation = validatePlainText(tags, 'Τα tags');
  const hasPlainTextError =
    !titleValidation.isValid || !descriptionValidation.isValid || !tagsValidation.isValid;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Παρακαλώ εισάγετε τίτλο');
      return;
    }
    if (!titleValidation.isValid) {
      setError(titleValidation.error || 'Ο τίτλος δεν πρέπει να περιέχει HTML.');
      return;
    }
    if (!descriptionValidation.isValid) {
      setError(descriptionValidation.error || 'Η περιγραφή δεν πρέπει να περιέχει HTML.');
      return;
    }
    if (!tagsValidation.isValid) {
      setError(tagsValidation.error || 'Τα tags δεν πρέπει να περιέχουν HTML.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
      const cleanedContentHtml = stripEmptyParagraphs(contentHtml || '').trim();
      const sanitizedContentHtml = sanitizeHtmlContent(cleanedContentHtml).trim();
      if (sanitizedContentHtml !== cleanedContentHtml) {
        setWarning('Unsupported formatting was removed for security.');
      } else {
        setWarning(null);
      }

      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: normalizeSlug(article.slug),
          description: description.trim() || null,
          category,
          topic,
          tags: tagsArray,
          cover_image: coverImage.trim() || null,
          content_html: sanitizedContentHtml || null,
          status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Αποτυχία ενημέρωσης');
      }

      const data = await response.json();
      const payload = data?.data ?? data;
      onSuccess?.(payload.article);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Θες να διαγράψεις οριστικά αυτό το άρθρο; Η ενέργεια δεν αναστρέφεται.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Αποτυχία διαγραφής άρθρου');
      }

      onDelete?.();
      onClose();
    } catch (deleteError) {
      console.error('Error deleting article:', deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Κάτι πήγε στραβά κατά τη διαγραφή. Δοκίμασε ξανά.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const availableTopics = category ? CATEGORIES[category].topics : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hb-dialog-overlay absolute inset-0"
            onClick={onClose}
          />

          <dialog
            ref={dialogRef}
            className="hb-dialog-surface fixed left-1/2 top-1/2 z-10 m-0 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--hb-dialog-border)] p-0 backdrop:bg-transparent"
            onClose={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="flex h-full max-h-[90vh] flex-col"
            >
              <div className="flex items-center justify-between border-b border-[var(--hb-border)] px-6 py-4">
                <h2 className="text-xl font-semibold text-[var(--hb-headline)]">
                  Επεξεργασία Άρθρου
                </h2>
                <Button variant={'ghost'} onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {error && <ErrorState error={error} />}
                  {warning && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                      {warning}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[var(--hb-headline)]">
                        Κατηγορία
                      </label>
                      <select
                        value={category}
                        onChange={event => setCategory(event.target.value as ArticleCategory)}
                        className="hover:border-[var(--hb-primary-strong)]/70 focus:ring-[var(--hb-primary-strong)]/50 w-full rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 text-sm text-[var(--hb-text)] transition focus:border-[var(--hb-primary-strong)] focus:outline-none focus:ring-2"
                      >
                        {(Object.keys(CATEGORIES) as ArticleCategory[]).map(cat => (
                          <option key={cat} value={cat}>
                            {CATEGORIES[cat].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[var(--hb-headline)]">
                        Υποκατηγορία
                      </label>
                      <select
                        value={topic}
                        onChange={event => setTopic(event.target.value as ArticleTopic)}
                        className="hover:border-[var(--hb-primary-strong)]/70 focus:ring-[var(--hb-primary-strong)]/50 w-full rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 text-sm text-[var(--hb-text)] transition focus:border-[var(--hb-primary-strong)] focus:outline-none focus:ring-2"
                      >
                        {availableTopics.map(item => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[var(--hb-headline)]">
                        Κατάσταση
                      </label>
                      <select
                        value={status}
                        onChange={event => setStatus(event.target.value as ArticleStatus)}
                        className="hover:border-[var(--hb-primary-strong)]/70 focus:ring-[var(--hb-primary-strong)]/50 w-full rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 text-sm text-[var(--hb-text)] transition focus:border-[var(--hb-primary-strong)] focus:outline-none focus:ring-2"
                      >
                        {STATUS_OPTIONS.map(item => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Τίτλος *"
                    placeholder="Εισάγετε τον τίτλο του άρθρου"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    error={!titleValidation.isValid}
                  />
                  {!titleValidation.isValid && (
                    <p className="text-xs text-red-400">Ο τίτλος δεν πρέπει να περιέχει HTML.</p>
                  )}

                  <Textarea
                    label="Περιγραφή"
                    placeholder="Σύντομη περιγραφή του άρθρου"
                    rows={3}
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    className={!descriptionValidation.isValid ? 'border-red-500' : undefined}
                  />
                  {!descriptionValidation.isValid && (
                    <p className="text-xs text-red-400">Η περιγραφή δεν πρέπει να περιέχει HTML.</p>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[var(--hb-headline)]">
                      Εικόνα εξωφύλλου
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex min-w-[220px] flex-1 flex-col gap-2">
                        <Input
                          placeholder="URL εικόνας"
                          value={coverImage}
                          onChange={event => {
                            setCoverImage(event.target.value);
                            setCoverUploadError(null);
                          }}
                          className="flex-1"
                        />
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--hb-muted)]">
                          <Button
                            variant="ghost"
                            icon={
                              isCoverUploading ? (
                                <LoadingSpinner size="sm" inline />
                              ) : (
                                <ImageIcon size={16} />
                              )
                            }
                            onClick={handleCoverUploadClick}
                            disabled={isCoverUploading}
                          >
                            {isCoverUploading ? 'Ανεβαίνει...' : 'Ανέβασε αρχείο'}
                          </Button>
                          <span>Το URL προέρχεται από το Supabase storage.</span>
                        </div>
                        {coverUploadError && (
                          <p className="text-xs text-amber-300">{coverUploadError}</p>
                        )}
                      </div>
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-[var(--hb-border)]">
                        {coverImage && isCoverPreviewValid ? (
                          <Image
                            src={coverImage}
                            alt="Preview"
                            fill
                            sizes="48px"
                            className="object-cover"
                            onError={() => setIsCoverPreviewValid(false)}
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[var(--hb-card)]">
                            <ImageIcon size={20} className="text-[var(--hb-muted)]" />
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={coverFileInputRef}
                      className="hidden"
                      onChange={handleCoverFileChange}
                    />
                  </div>

                  <RichTextEditor
                    label="Περιεχόμενο"
                    value={contentHtml}
                    onChange={setContentHtml}
                    placeholder="Γράψτε το περιεχόμενο του άρθρου..."
                  />

                  <Input
                    label="Tags"
                    placeholder="Χωρισμένα με κόμμα"
                    value={tags}
                    onChange={event => setTags(event.target.value)}
                    error={!tagsValidation.isValid}
                  />
                  {!tagsValidation.isValid && (
                    <p className="text-xs text-red-400">
                      {tagsValidation.error || 'Τα tags δεν πρέπει να περιέχουν HTML.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--hb-border)] px-6 py-4">
                <div className="flex items-center gap-2">
                  <Button variant={'secondary'} onClick={onClose}>
                    Ακύρωση
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSubmitting || isDeleting}
                  >
                    {isDeleting ? <LoadingSpinner size="sm" inline /> : 'Διαγραφή άρθρου'}
                  </Button>
                </div>
                <Button
                  variant="primary"
                  icon={isSubmitting ? <LoadingSpinner size="sm" inline /> : <Save size={16} />}
                  onClick={handleSubmit}
                  disabled={isSubmitting || hasPlainTextError}
                >
                  Αποθήκευση
                </Button>
              </div>
            </motion.div>
          </dialog>
        </div>
      )}
    </AnimatePresence>
  );
}
