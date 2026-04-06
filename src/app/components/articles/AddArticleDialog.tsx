'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Save, Eye, ImageIcon, Search, Link2 } from 'lucide-react';
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
  ContentPublishedEventDetail,
} from '@/app/constants/contentEvents';
import { CONTENT_PUBLISHED_EVENT } from '@/app/constants/contentEvents';
import { Textarea } from '@/components/ui/textarea';

const RichTextEditor = dynamic(() => import('../editor/RichTextEditor.client'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-lg border border-border bg-muted" />
  ),
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

type MediaSearchItem = {
  mediaId: number;
  title: string;
  cover: string;
  source: string;
};

const MEDIA_LINKABLE: Partial<Record<ArticleCategory, string>> = {
  anime: '/api/anime/search?category=anime',
  manga: '/api/anime/search?category=manga',
  games: '/api/games/search',
  movies: '/api/movies/search?category=movies',
  tv: '/api/movies/search?category=tv',
  books: '/api/books/search',
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
        if (type.value === 'article') {
          return canWriteArticles;
        }
        if (type.value === 'review') {
          return canWriteReviews;
        }
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
  const [score, setScore] = useState('');
  const [isCoverPreviewValid, setIsCoverPreviewValid] = useState(true);
  const [mediaId, setMediaId] = useState<number | null>(null);
  const [linkedMediaTitle, setLinkedMediaTitle] = useState<string | null>(null);
  const [mediaSearch, setMediaSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MediaSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const submitInFlightRef = useRef(false);

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
      setScore('');
      setMediaId(null);
      setLinkedMediaTitle(null);
      setMediaSearch('');
      setSearchResults([]);
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
    if (!category) {
      return;
    }
    if (contentType === 'review') {
      setTopic('reviews');
      return;
    }
    const topics = CATEGORIES[category]?.topics ?? [];
    setTopic(topics[0]?.value ?? 'articles');
  }, [category, contentType]);

  useEffect(() => {
    if (!category) {
      return;
    }
    if (contentType === 'review' && !REVIEW_CATEGORIES.includes(category as ArticleCategory)) {
      setCategory('');
      setTopic('reviews');
    }
  }, [category, contentType]);

  useEffect(() => {
    setIsCoverPreviewValid(true);
  }, [coverImage]);

  const searchEndpoint = category ? (MEDIA_LINKABLE[category as ArticleCategory] ?? null) : null;

  useEffect(() => {
    if (!searchEndpoint || !mediaSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const sep = searchEndpoint.includes('?') ? '&' : '?';
        const res = await fetch(
          `${searchEndpoint}${sep}q=${encodeURIComponent(mediaSearch.trim())}`,
        );
        if (res.ok) {
          const data = (await res.json()) as { items?: MediaSearchItem[] };
          setSearchResults((data.items ?? []).filter(i => i.mediaId).slice(0, 5));
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [mediaSearch, searchEndpoint]);

  const handleSelectMedia = useCallback((item: MediaSearchItem) => {
    setMediaId(item.mediaId);
    setLinkedMediaTitle(item.title);
    setMediaSearch('');
    setSearchResults([]);
  }, []);

  const handleUnlinkMedia = useCallback(() => {
    setMediaId(null);
    setLinkedMediaTitle(null);
  }, []);

  const handleCoverUploadClick = () => {
    coverFileInputRef.current?.click();
  };

  const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

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
    if (submitInFlightRef.current) {
      return;
    }
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

    submitInFlightRef.current = true;
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
          score: contentType === 'review' && score !== '' ? Number.parseFloat(score) : null,
          media_id: searchEndpoint ? mediaId : undefined,
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
      submitInFlightRef.current = false;
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

  return isOpen ? (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="hb-dialog-overlay absolute inset-0" onClick={onClose} />

      {/* Dialog Container - Centered */}
      <dialog
        ref={dialogRef}
        className="hb-dialog-surface fixed inset-x-0 bottom-0 top-auto z-10 m-0 h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-none border border-border p-0 backdrop:bg-transparent sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        onClose={onClose}
      >
        <div className="animate-fade-in-up flex h-full max-h-[100dvh] flex-col sm:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">{dialogTitle}</h2>
            <Button variant="secondary" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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

              {contentType === 'review' && (
                <Input
                  label="Score (0–10)"
                  type="number"
                  placeholder="e.g. 8.5"
                  min={0}
                  max={10}
                  step={0.1}
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  description="Your rating out of 10."
                />
              )}

              {searchEndpoint ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Linked item
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>

                  {mediaId ? (
                    <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2">
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="flex-1 truncate text-sm">{linkedMediaTitle}</span>
                      <button
                        type="button"
                        onClick={handleUnlinkMedia}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={`Search ${category}...`}
                      value={mediaSearch}
                      onChange={e => setMediaSearch(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {isSearching ? (
                      <Spinner className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2" />
                    ) : null}
                  </div>

                  {searchResults.length > 0 ? (
                    <ul className="overflow-hidden rounded-xl border border-border bg-card">
                      {searchResults.map(item => (
                        <li key={item.mediaId}>
                          <button
                            type="button"
                            onClick={() => handleSelectMedia(item)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/50"
                          >
                            {item.cover ? (
                              <div className="relative h-9 w-6 shrink-0 overflow-hidden rounded">
                                <CoverThumbImage
                                  src={item.cover}
                                  alt=""
                                  sizes="24px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-9 w-6 shrink-0 rounded bg-muted" />
                            )}
                            <span className="truncate">{item.title}</span>
                            <span className="ml-auto shrink-0 text-xs capitalize text-muted-foreground">
                              {item.source}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
                <Button
                  variant="ghost"
                  icon={isSubmitting ? <Spinner className="size-4" /> : <Save size={16} />}
                  onClick={() => handleSubmit('draft')}
                  disabled={isSubmitting || hasPlainTextError || noPermission}
                  className="w-full sm:w-auto"
                >
                  Save as Draft
                </Button>
                <Button
                  variant="primary"
                  icon={isSubmitting ? <Spinner className="size-4" /> : <Eye size={16} />}
                  onClick={() => handleSubmit('published')}
                  disabled={isSubmitting || hasPlainTextError || noPermission}
                  className="w-full sm:w-auto"
                >
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  ) : null;
}
