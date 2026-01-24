'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import RichTextEditor from '../ui/RichTextEditor';
import Button from '../ui/Button';
import type { ArticleCategory, ArticleTopic, ArticleStatus, ArticleRow } from '@/types/database';
import { validatePlainText } from '@/utils/validation/text';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';

interface EditArticleDialogProps {
  isOpen: boolean;
  article: ArticleRow;
  onClose: () => void;
  onSuccess?: (article: ArticleRow) => void;
}

interface CategoryConfig {
  label: string;
  topics: { value: ArticleTopic; label: string }[];
}

const CATEGORIES: Record<ArticleCategory, CategoryConfig> = {
  gaming: {
    label: 'Gaming',
    topics: [
      { value: 'articles', label: 'Άρθρα' },
      { value: 'reviews', label: 'Reviews' },
      { value: 'guides', label: 'Οδηγοί' },
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
      { value: 'care', label: 'Οδηγοί φροντίδας' },
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
}: Readonly<EditArticleDialogProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const initialCategoryRef = useRef<ArticleCategory>(article.category);

  const [category, setCategory] = useState<ArticleCategory>(article.category);
  const [topic, setTopic] = useState<ArticleTopic>(article.topic);
  const [title, setTitle] = useState(article.title);
  const [description, setDescription] = useState(article.description ?? '');
  const [coverImage, setCoverImage] = useState(article.cover_image ?? '');
  const [contentHtml, setContentHtml] = useState(article.content_html ?? '');
  const [tags, setTags] = useState((article.tags ?? []).join(', '));
  const [status, setStatus] = useState<ArticleStatus>(article.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
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
      onSuccess?.(data.article);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Κάτι πήγε στραβά');
    } finally {
      setIsSubmitting(false);
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <dialog
            ref={dialogRef}
            className="fixed left-1/2 top-1/2 z-10 m-0 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-surface)] p-0 shadow-2xl backdrop:bg-transparent"
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
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-[var(--hb-muted)] transition hover:bg-white/5 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}
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
                    <p className="text-xs text-red-400">
                      Ο τίτλος δεν πρέπει να περιέχει HTML.
                    </p>
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
                    <p className="text-xs text-red-400">
                      Η περιγραφή δεν πρέπει να περιέχει HTML.
                    </p>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[var(--hb-headline)]">
                      Εικόνα εξωφύλλου
                    </label>
                    <div className="flex gap-3">
                      <Input
                        placeholder="URL εικόνας"
                        value={coverImage}
                        onChange={event => setCoverImage(event.target.value)}
                        className="flex-1"
                      />
                      {coverImage && isCoverPreviewValid ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-[var(--hb-border)]">
                          <Image
                            src={coverImage}
                            alt="Preview"
                            fill
                            sizes="48px"
                            className="object-cover"
                            onError={() => setIsCoverPreviewValid(false)}
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--hb-border)] bg-[var(--hb-card)]">
                          <ImageIcon size={20} className="text-[var(--hb-muted)]" />
                        </div>
                      )}
                    </div>
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
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm text-[var(--hb-muted)] transition hover:text-white"
                >
                  Ακύρωση
                </button>
                <Button
                  variant="primary"
                  icon={
                    isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )
                  }
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
