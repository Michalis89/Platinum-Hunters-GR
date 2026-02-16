'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ImageIcon } from 'lucide-react';
import { CoverThumbImage, THUMB_SIZES_SM } from '@/components/ui/cover-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ErrorAlert } from '@/components/ui/alert';
import type { ArticleCategory, ArticleTopic, ArticleStatus, ArticleRow } from '@/types/database';
import { validatePlainText } from '@/utils/validation/text';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import dynamic from 'next/dynamic';
import { uploadArticleCoverImage } from '@/lib/media/uploadArticleCover';
import { Textarea } from '@/components/ui/textarea';

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
      { value: 'articles', label: 'Articles' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  anime: {
    label: 'Anime',
    topics: [
      { value: 'articles', label: 'Articles' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  manga: {
    label: 'Manga',
    topics: [
      { value: 'articles', label: 'Articles' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  books: {
    label: 'Books',
    topics: [
      { value: 'articles', label: 'Articles' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  movies: {
    label: 'Movies',
    topics: [
      { value: 'articles', label: 'Articles' },
      { value: 'reviews', label: 'Reviews' },
    ],
  },
  tv: {
    label: 'TV Series',
    topics: [
      { value: 'articles', label: 'Articles' },
      { value: 'reviews', label: 'Reviews' },
    ],
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
      { value: 'reviews', label: 'Reviews' },
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
    if (!isOpen) {return;}
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
    if (!category) {return;}
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

  const handleSubmit = async () => {
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
        throw new Error(data.error || 'Update failed');
      }

      const data = await response.json();
      const payload = data?.data ?? data;
      onSuccess?.(payload.article);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Do you want to permanently delete this article? This action cannot be undone.',
      )
    ) {
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
        throw new Error(data?.error || 'Article deletion failed');
      }

      onDelete?.();
      onClose();
    } catch (deleteError) {
      console.error('Error deleting article:', deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Something went wrong during deletion. Try again.',
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
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">Edit Article</h2>
                <Button variant={'ghost'} onClick={onClose}>
                  <X size={20} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {error && <ErrorAlert message={error} />}
                  {warning && (
                    <div className="rounded-lg border border-amber-500/30 bg-warning/10 px-4 py-3 text-sm text-amber-300">
                      {warning}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Category</label>
                      <select
                        value={category}
                        onChange={event => setCategory(event.target.value as ArticleCategory)}
                        className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground transition hover:border-primary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {(Object.keys(CATEGORIES) as ArticleCategory[]).map(cat => (
                          <option key={cat} value={cat}>
                            {CATEGORIES[cat].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Subcategory</label>
                      <select
                        value={topic}
                        onChange={event => setTopic(event.target.value as ArticleTopic)}
                        className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground transition hover:border-primary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {availableTopics.map(item => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">Status</label>
                      <select
                        value={status}
                        onChange={event => setStatus(event.target.value as ArticleStatus)}
                        className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground transition hover:border-primary/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                    label="Title *"
                    placeholder="Enter the article title"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    error={!titleValidation.isValid}
                  />
                  {!titleValidation.isValid && (
                    <p className="text-xs text-red-400">Title must not contain HTML.</p>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Textarea
                      placeholder="Short article description"
                      rows={3}
                      value={description}
                      onChange={event => setDescription(event.target.value)}
                      className={!descriptionValidation.isValid ? 'border-destructive' : undefined}
                    />
                  </div>
                  {!descriptionValidation.isValid && (
                    <p className="text-xs text-red-400">Description must not contain HTML.</p>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Cover image</label>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex min-w-[220px] flex-1 flex-col gap-2">
                        <Input
                          placeholder="Image URL"
                          value={coverImage}
                          onChange={event => {
                            setCoverImage(event.target.value);
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

                  <RichTextEditor
                    label="Content"
                    value={contentHtml}
                    onChange={setContentHtml}
                    placeholder="Write the article content..."
                  />

                  <Input
                    label="Tags"
                    placeholder="Comma-separated"
                    value={tags}
                    onChange={event => setTags(event.target.value)}
                    error={!tagsValidation.isValid}
                  />
                  {!tagsValidation.isValid && (
                    <p className="text-xs text-red-400">
                      {tagsValidation.error || 'Tags must not contain HTML.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <div className="flex items-center gap-2">
                  <Button variant={'secondary'} onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSubmitting || isDeleting}
                  >
                    {isDeleting ? <Spinner className="size-4" /> : 'Delete article'}
                  </Button>
                </div>
                <Button
                  variant="primary"
                  icon={isSubmitting ? <Spinner className="size-4" /> : <Save size={16} />}
                  onClick={handleSubmit}
                  disabled={isSubmitting || hasPlainTextError}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </dialog>
        </div>
      )}
    </AnimatePresence>
  );
}
