'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Eye, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import Button from '../ui/Button';
import ErrorState from '../ui/ErrorState';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { ArticleCategory, ArticleTopic, ArticleStatus } from '@/types/database';
import { validatePlainText } from '@/utils/validation/text';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import dynamic from 'next/dynamic';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';
import { uploadArticleCoverImage } from '@/lib/media/uploadArticleCover';
import {
  CONTENT_PUBLISHED_EVENT,
  ContentPublicationType,
  ContentPublishedEventDetail,
} from '@/app/constants/contentEvents';

const RichTextEditor = dynamic(() => import('../editor/RichTextEditor.client'), {
  ssr: false,
});

interface AddArticleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ContentType = ContentPublicationType;

interface CategoryConfig {
  label: string;
  topics: { value: ArticleTopic; label: string }[];
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'article', label: 'Άρθρο' },
  { value: 'review', label: 'Κριτική' },
];

const REVIEW_CATEGORIES: ArticleCategory[] = [
  'games',
  'anime',
  'manga',
  'books',
  'movies',
  'tv',
  'vape',
];

const CATEGORIES: Record<ArticleCategory, CategoryConfig> = {
  games: {
    label: 'Games',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
    ],
  },
  anime: {
    label: 'Anime',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
    ],
  },
  manga: {
    label: 'Manga',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
    ],
  },
  books: {
    label: 'Βιβλία',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
    ],
  },
  movies: {
    label: 'Movies',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
    ],
  },
  tv: {
    label: 'TV Series',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
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
    ],
  },
};

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const stripEmptyParagraphs = (html: string) => {
  return html.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
};

const dispatchContentPublishedEvent = (type: ContentPublicationType) => {
  if (typeof window === 'undefined') {
    return;
  }

  const event = new CustomEvent<ContentPublishedEventDetail>(CONTENT_PUBLISHED_EVENT, {
    detail: { type },
  });

  window.dispatchEvent(event);
};

export default function AddArticleDialog({
  isOpen,
  onClose,
  onSuccess,
}: Readonly<AddArticleDialogProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const user = useSelector(selectUser);
  const canWriteArticles = hasAnyRole(user, ['admin', 'owner', 'author']);
  const canWriteReviews = hasAnyRole(user, ['admin', 'owner', 'reviewer']);
  const availableContentTypes = useMemo(
    () =>
      CONTENT_TYPES.filter(type => {
        if (type.value === 'article') return canWriteArticles;
        if (type.value === 'review') return canWriteReviews;
        return false;
      }),
    [canWriteArticles, canWriteReviews],
  );

  // Form state
  const [contentType, setContentType] = useState<ContentType>('article');
  const [category, setCategory] = useState<ArticleCategory | ''>('');
  const [topic, setTopic] = useState<ArticleTopic>('articles');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [contentHtml, setContentHtml] = useState('');
  const [tags, setTags] = useState('');
  const [isCoverPreviewValid, setIsCoverPreviewValid] = useState(true);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Handle dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog?.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setContentType(availableContentTypes[0]?.value ?? 'article');
      setCategory('');
      setTopic('articles');
      setTitle('');
      setDescription('');
      setCoverImage('');
      setContentHtml('');
      setTags('');
      setError(null);
      setWarning(null);
      setIsCoverPreviewValid(true);
    }
  }, [isOpen, availableContentTypes]);

  useEffect(() => {
    if (!availableContentTypes.some(type => type.value === contentType)) {
      setContentType(availableContentTypes[0]?.value ?? 'article');
    }
  }, [availableContentTypes, contentType]);

  // Update topic when category changes
  useEffect(() => {
    if (!category) return;
    if (contentType === 'review') {
      setTopic('reviews');
      return;
    }
    const topics = CATEGORIES[category]?.topics ?? [];
    setTopic(topics[0]?.value ?? 'articles');
  }, [category, contentType]);

  useEffect(() => {
    if (!category) return;
    if (contentType === 'review' && !REVIEW_CATEGORIES.includes(category as ArticleCategory)) {
      setCategory('');
      setTopic('reviews');
    }
  }, [category, contentType]);

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

  const handleSubmit = async (saveStatus: ArticleStatus) => {
    if (noPermission) {
      setError('Δεν έχεις δικαίωμα για δημιουργία περιεχομένου.');
      return;
    }
    if (!category) {
      setError('Παρακαλώ επιλέξτε κατηγορία');
      return;
    }
    if (contentType === 'review' && !REVIEW_CATEGORIES.includes(category as ArticleCategory)) {
      setError('Η κατηγορία δεν υποστηρίζει reviews.');
      return;
    }
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
      const slug = generateSlug(title);
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const cleanedContentHtml = stripEmptyParagraphs(contentHtml || '').trim();
      const sanitizedContentHtml = sanitizeHtmlContent(cleanedContentHtml).trim();
      if (sanitizedContentHtml !== cleanedContentHtml) {
        setWarning('Unsupported formatting was removed for security.');
      } else {
        setWarning(null);
      }

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug,
          description: description.trim() || null,
          category,
          topic: contentType === 'review' ? 'reviews' : topic,
          tags: tagsArray,
          cover_image: coverImage.trim() || null,
          content_html: sanitizedContentHtml || null,
          status: saveStatus,
          published_at: saveStatus === 'published' ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Αποτυχία αποθήκευσης');
      }

      onSuccess?.();
      if (saveStatus === 'published') {
        dispatchContentPublishedEvent(contentType);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = contentType === 'review' ? 'Νέα Κριτική' : 'Νέο Άρθρο';
  const noPermission = availableContentTypes.length === 0;
  const availableTopics = category
    ? contentType === 'review'
      ? [{ value: 'reviews', label: 'Κριτικές' }]
      : CATEGORIES[category].topics
    : [];
  const availableCategories =
    contentType === 'review' ? REVIEW_CATEGORIES : (Object.keys(CATEGORIES) as ArticleCategory[]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog Container - Centered */}
          <dialog
            ref={dialogRef}
            className="fixed left-1/2 top-1/2 z-10 m-0 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-surface)] p-0 shadow-[var(--hb-shadow-md)] backdrop:bg-transparent"
            onClose={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="flex h-full max-h-[90vh] flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--hb-border)] px-6 py-4">
                <h2 className="text-xl font-semibold text-[var(--hb-headline)]">{dialogTitle}</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-[var(--hb-muted)] transition hover:bg-white/5 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Error message */}
                  {error && <ErrorState error={error} />}
                  {noPermission && (
                    <ErrorState error="Δεν έχεις δικαίωμα να δημιουργήσεις άρθρο ή review." />
                  )}
                  {warning && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                      {warning}
                    </div>
                  )}

                  {/* Type & Category Row */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Content Type */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[var(--hb-headline)]">Τύπος</label>
                      <select
                        value={contentType}
                        onChange={e => setContentType(e.target.value as ContentType)}
                        disabled={availableContentTypes.length <= 1}
                        className="hover:border-[var(--hb-primary-strong)]/70 focus:ring-[var(--hb-primary-strong)]/50 w-full rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 text-sm text-[var(--hb-text)] transition focus:border-[var(--hb-primary-strong)] focus:outline-none focus:ring-2"
                      >
                        {availableContentTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[var(--hb-headline)]">
                        Κατηγορία *
                      </label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value as ArticleCategory)}
                        className="hover:border-[var(--hb-primary-strong)]/70 focus:ring-[var(--hb-primary-strong)]/50 w-full rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 text-sm text-[var(--hb-text)] transition focus:border-[var(--hb-primary-strong)] focus:outline-none focus:ring-2"
                      >
                        <option value="">-- Επιλέξτε --</option>
                        {availableCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {CATEGORIES[cat].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Topic */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[var(--hb-headline)]">
                        Υποκατηγορία
                      </label>
                      <select
                        value={topic}
                        onChange={e => setTopic(e.target.value as ArticleTopic)}
                        disabled={!category || contentType === 'review'}
                        className="hover:border-[var(--hb-primary-strong)]/70 focus:ring-[var(--hb-primary-strong)]/50 w-full rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 text-sm text-[var(--hb-text)] transition focus:border-[var(--hb-primary-strong)] focus:outline-none focus:ring-2 disabled:opacity-50"
                      >
                        {availableTopics.map(t => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <Input
                    label="Τίτλος *"
                    placeholder="Εισάγετε τον τίτλο του άρθρου"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    error={!titleValidation.isValid}
                  />
                  {!titleValidation.isValid && (
                    <p className="text-xs text-red-400">Ο τίτλος δεν πρέπει να περιέχει HTML.</p>
                  )}

                  {/* Description */}
                  <Textarea
                    label="Περιγραφή"
                    placeholder="Σύντομη περιγραφή του άρθρου (εμφανίζεται στις κάρτες)"
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className={!descriptionValidation.isValid ? 'border-red-500' : undefined}
                  />
                  {!descriptionValidation.isValid && (
                    <p className="text-xs text-red-400">Η περιγραφή δεν πρέπει να περιέχει HTML.</p>
                  )}

                  {/* Cover Image */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[var(--hb-headline)]">
                      Εικόνα εξωφύλλου
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex flex-1 min-w-[220px] flex-col gap-2">
                        <Input
                          placeholder="URL εικόνας"
                          value={coverImage}
                          onChange={e => {
                            setCoverImage(e.target.value);
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

                  {/* Content */}
                  <RichTextEditor
                    label="Περιεχόμενο"
                    value={contentHtml}
                    onChange={setContentHtml}
                    placeholder="Γράψτε το περιεχόμενο του άρθρου..."
                  />

                  {/* Tags */}
                  <Input
                    label="Tags"
                    placeholder="Χωρισμένα με κόμμα (π.χ. ps5, rpg, exclusive)"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    error={!tagsValidation.isValid}
                  />
                  {!tagsValidation.isValid && (
                    <p className="text-xs text-red-400">
                      {tagsValidation.error || 'Τα tags δεν πρέπει να περιέχουν HTML.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[var(--hb-border)] px-6 py-4">
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm text-[var(--hb-muted)] transition hover:text-white"
                >
                  Ακύρωση
                </button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    icon={isSubmitting ? <LoadingSpinner size="sm" inline /> : <Save size={16} />}
                    onClick={() => handleSubmit('draft')}
                    disabled={isSubmitting || hasPlainTextError || noPermission}
                  >
                    Αποθήκευση ως Draft
                  </Button>
                  <Button
                    variant="primary"
                    icon={isSubmitting ? <LoadingSpinner size="sm" inline /> : <Eye size={16} />}
                    onClick={() => handleSubmit('published')}
                    disabled={isSubmitting || hasPlainTextError || noPermission}
                  >
                    Δημοσίευση
                  </Button>
                </div>
              </div>
            </motion.div>
          </dialog>
        </div>
      )}
    </AnimatePresence>
  );
}
