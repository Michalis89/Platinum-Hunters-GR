'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Eye, ImageIcon } from 'lucide-react';
import { CoverThumbImage, THUMB_SIZES_SM } from '@/components/ui/cover-image';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ErrorAlert } from '@/components/ui/alert';
import type { ArticleCategory, ArticleTopic, ArticleStatus } from '@/types/database';
import { validatePlainText } from '@/utils/validation/text';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import dynamic from 'next/dynamic';
import { selectUser } from '@/store/slices/authSlice';
import { hasAnyRole } from '@/lib/roles';
import { uploadArticleCoverImage } from '@/lib/media/uploadArticleCover';
import type {
  ContentPublicationType,
  ContentPublishedEventDetail} from '@/app/constants/contentEvents';
import {
  CONTENT_PUBLISHED_EVENT
} from '@/app/constants/contentEvents';
import { Textarea } from '@/components/ui/textarea';

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
  { value: 'article', label: 'Article' },
  { value: 'review', label: 'Review' },
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
    topics: [{ value: 'articles', label: 'Articles' }],
  },
  anime: {
    label: 'Anime',
    topics: [{ value: 'articles', label: 'Articles' }],
  },
  manga: {
    label: 'Manga',
    topics: [{ value: 'articles', label: 'Articles' }],
  },
  books: {
    label: 'Books',
    topics: [{ value: 'articles', label: 'Articles' }],
  },
  movies: {
    label: 'Movies',
    topics: [{ value: 'articles', label: 'Articles' }],
  },
  tv: {
    label: 'TV Series',
    topics: [{ value: 'articles', label: 'Articles' }],
  },
  coding: {
    label: 'Coding',
    topics: [
      { value: 'articles', label: 'Articles' },
      { value: 'tutorials', label: 'Tutorials' },
      { value: 'weird-cases', label: 'Weird Cases' },
    ],
  },
  pet: {
    label: 'Pet',
    topics: [
      { value: 'articles', label: 'Articles' },
      { value: 'care', label: 'Care' },
      { value: 'experiences', label: 'Experiences' },
      { value: 'health', label: 'Health' },
    ],
  },
  vape: {
    label: 'Vape',
    topics: [
      { value: 'articles', label: 'Articles' },
      { value: 'devices', label: 'Vapes/Devices' },
      { value: 'liquids', label: 'Liquids' },
      { value: 'experiences', label: 'Experiences' },
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
        if (type.value === 'article') {return canWriteArticles;}
        if (type.value === 'review') {return canWriteReviews;}
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
    if (!category) {return;}
    if (contentType === 'review') {
      setTopic('reviews');
      return;
    }
    const topics = CATEGORIES[category]?.topics ?? [];
    setTopic(topics[0]?.value ?? 'articles');
  }, [category, contentType]);

  useEffect(() => {
    if (!category) {return;}
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
    if (!file) {return;}

    setCoverUploadError(null);
    setIsCoverUploading(true);
    try {
      const uploadedUrl = await uploadArticleCoverImage(file);
      setCoverImage(uploadedUrl);
      setIsCoverPreviewValid(true);
    } catch (uploadErr) {
      console.error('Cover upload failed:', uploadErr);
      setCoverUploadError(
        uploadErr instanceof Error ? uploadErr.message : 'Image upload failed. Try again.',
      );
    } finally {
      setIsCoverUploading(false);
    }
  };

  const titleValidation = validatePlainText(title, 'Title');
  const descriptionValidation = validatePlainText(description, 'Description');
  const tagsValidation = validatePlainText(tags, 'Tags');
  const hasPlainTextError =
    !titleValidation.isValid || !descriptionValidation.isValid || !tagsValidation.isValid;

  const handleSubmit = async (saveStatus: ArticleStatus) => {
    if (noPermission) {
      setError('You do not have permission to create content.');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (contentType === 'review' && !REVIEW_CATEGORIES.includes(category as ArticleCategory)) {
      setError('This category does not support reviews.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!titleValidation.isValid) {
      setError(titleValidation.error || 'Title must not contain HTML.');
      return;
    }
    if (!descriptionValidation.isValid) {
      setError(descriptionValidation.error || 'Description must not contain HTML.');
      return;
    }
    if (!tagsValidation.isValid) {
      setError(tagsValidation.error || 'Tags must not contain HTML.');
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
        throw new Error(data.error || 'Save failed');
      }

      onSuccess?.();
      if (saveStatus === 'published') {
        dispatchContentPublishedEvent(contentType);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = contentType === 'review' ? 'New Review' : 'New Article';
  const noPermission = availableContentTypes.length === 0;
  const availableTopics = category
    ? contentType === 'review'
      ? [{ value: 'reviews', label: 'Reviews' }]
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
            className="hb-dialog-overlay absolute inset-0"
            onClick={onClose}
          />

          {/* Dialog Container - Centered */}
          <dialog
            ref={dialogRef}
            className="hb-dialog-surface fixed left-1/2 top-1/2 z-10 m-0 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border p-0 backdrop:bg-transparent"
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
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">{dialogTitle}</h2>
                <Button variant="secondary" onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Error message */}
                  {error && <ErrorAlert message={error} />}
                  {noPermission && (
                    <ErrorAlert message="You do not have permission to create an article or review." />
                  )}
                  {warning && (
                    <div className="rounded-lg border border-amber-500/30 bg-warning/10 px-4 py-3 text-sm text-amber-300">
                      {warning}
                    </div>
                  )}

                  {/* Type & Category Row */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Content Type */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Type</label>
                      <select
                        value={contentType}
                        onChange={e => setContentType(e.target.value as ContentType)}
                        disabled={availableContentTypes.length <= 1}
                        className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground transition hover:border-primary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                      <label className="text-sm font-medium text-foreground">Category *</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value as ArticleCategory)}
                        className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground transition hover:border-primary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">-- Select --</option>
                        {availableCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {CATEGORIES[cat].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Topic */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Subcategory</label>
                      <select
                        value={topic}
                        onChange={e => setTopic(e.target.value as ArticleTopic)}
                        disabled={!category || contentType === 'review'}
                        className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground transition hover:border-primary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
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
                    label="Title *"
                    placeholder="Enter the article title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    error={!titleValidation.isValid}
                  />
                  {!titleValidation.isValid && (
                    <p className="text-xs text-red-400">Title must not contain HTML.</p>
                  )}

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Textarea
                      placeholder="Short article description (shown in cards)"
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className={!descriptionValidation.isValid ? 'border-destructive' : undefined}
                    />
                  </div>
                  {!descriptionValidation.isValid && (
                    <p className="text-xs text-red-400">Description must not contain HTML.</p>
                  )}

                  {/* Cover Image */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Cover image</label>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex min-w-[220px] flex-1 flex-col gap-2">
                        <Input
                          placeholder="Image URL"
                          value={coverImage}
                          onChange={e => {
                            setCoverImage(e.target.value);
                            setCoverUploadError(null);
                          }}
                          className="flex-1"
                        />
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Button
                            variant="ghost"
                            icon={
                              isCoverUploading ? (
                                <Spinner className="size-4" />
                              ) : (
                                <ImageIcon size={16} />
                              )
                            }
                            onClick={handleCoverUploadClick}
                            disabled={isCoverUploading}
                          >
                            {isCoverUploading ? 'Uploading...' : 'Upload file'}
                          </Button>
                          <span>The URL comes from Supabase storage.</span>
                        </div>
                        {coverUploadError && (
                          <p className="text-xs text-amber-300">{coverUploadError}</p>
                        )}
                      </div>
                      <div className="relative h-12 w-12 rounded-lg border border-border">
                        {coverImage && isCoverPreviewValid ? (
                          <CoverThumbImage
                            src={coverImage}
                            alt="Preview"
                            sizes={THUMB_SIZES_SM}
                            className="object-cover"
                            onError={() => setIsCoverPreviewValid(false)}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-card">
                            <ImageIcon size={20} className="text-muted-foreground" />
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
                    label="Content"
                    value={contentHtml}
                    onChange={setContentHtml}
                    placeholder="Write the article content..."
                  />

                  {/* Tags */}
                  <Input
                    label="Tags"
                    placeholder="Comma-separated (e.g. ps5, rpg, exclusive)"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    error={!tagsValidation.isValid}
                  />
                  {!tagsValidation.isValid && (
                    <p className="text-xs text-red-400">
                      {tagsValidation.error || 'Tags must not contain HTML.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    icon={isSubmitting ? <Spinner className="size-4" /> : <Save size={16} />}
                    onClick={() => handleSubmit('draft')}
                    disabled={isSubmitting || hasPlainTextError || noPermission}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    variant="primary"
                    icon={isSubmitting ? <Spinner className="size-4" /> : <Eye size={16} />}
                    onClick={() => handleSubmit('published')}
                    disabled={isSubmitting || hasPlainTextError || noPermission}
                  >
                    Publish
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
