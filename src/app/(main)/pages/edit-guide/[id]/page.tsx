'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import Feedback from '@/app/components/ui/Feedback';
import { GuideStepsEditor } from '@/app/components/ui/GuideStepsEditor';
import Button from '@/app/components/ui/Button';
import { validatePlainText } from '@/utils/validation/text';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/app/components/editor/RichTextEditor.client'), {
  ssr: false,
});

export default function EditGuide() {
  const { id } = useParams();
  const router = useRouter();

  const [stepsHtml, setStepsHtml] = useState<string[]>([]);
  const [stepTitles, setStepTitles] = useState<string[]>([]);
  const [gameSlug, setGameSlug] = useState<string>('');
  const [guideTitle, setGuideTitle] = useState<string>('');
  const [difficultyRating, setDifficultyRating] = useState<number | ''>('');
  const [playthroughs, setPlaythroughs] = useState<number | ''>('');
  const [hours, setHours] = useState<number | ''>('');
  const [introHtml, setIntroHtml] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '').trim();

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const response = await fetch(`/api/guides/${id}`);
        const data = await response.json();
        const payload = data?.data ?? data;
        if (response.ok && payload && payload[0]) {
          const firstGuide = payload[0];
          setGuideTitle(firstGuide?.title ?? '');
          setDifficultyRating(firstGuide?.difficulty_rating ?? '');
          setPlaythroughs(firstGuide?.estimated_playthroughs ?? '');
          setHours(firstGuide?.estimated_hours ?? '');
          setIntroHtml(firstGuide?.content_html ?? firstGuide?.description ?? '');
          const stepsArr = (firstGuide?.steps || []).map(
            (s: { content_html?: string; description?: string }) =>
              s.content_html || s.description || '',
          );
          const titlesArr = (firstGuide?.steps || []).map((s: { title?: string }) => s.title || '');
          setStepsHtml(stepsArr.length ? stepsArr : ['']);
          setStepTitles(titlesArr.length ? titlesArr : ['']);
          setGameSlug(firstGuide?.games?.slug ?? '');
          setImageUrl(
            firstGuide?.games?.cover_image ||
              firstGuide?.games?.background_image ||
              firstGuide?.cover_image ||
              firstGuide?.background_image ||
              '',
          );
        } else {
          setMessage('❌ Σφάλμα φόρτωσης οδηγού!');
          setMessageType('error');
        }
      } catch (error) {
        console.error('❌ Σφάλμα:', error);
        setMessage('❌ Αποτυχία φόρτωσης!');
        setMessageType('error');
      }
      setLoading(false);
    };

    if (id) fetchGuide();
  }, [id]);

  useEffect(() => {
    setStepTitles(prev => {
      if (stepsHtml.length > prev.length) {
        return [...prev, ...Array(stepsHtml.length - prev.length).fill('')];
      }
      if (stepsHtml.length < prev.length) {
        return prev.slice(0, stepsHtml.length);
      }
      return prev;
    });
  }, [stepsHtml]);

  const titleValidation = validatePlainText(guideTitle, 'Ο τίτλος');
  const hasTitleHtml = !titleValidation.isValid;

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setWarning(null);
    if (!titleValidation.isValid) {
      setMessage(titleValidation.error || 'Ο τίτλος δεν πρέπει να περιέχει HTML.');
      setMessageType('error');
      setSaving(false);
      return;
    }

    const cleanedIntroHtml = introHtml.trim();
    const sanitizedIntroHtml = sanitizeHtmlContent(cleanedIntroHtml).trim();
    const sanitizedStepsHtml = stepsHtml.map(html =>
      sanitizeHtmlContent((html || '').trim()).trim(),
    );
    const hasSanitizedChanges =
      sanitizedIntroHtml !== cleanedIntroHtml ||
      sanitizedStepsHtml.some((html, idx) => html !== (stepsHtml[idx] || '').trim());

    if (hasSanitizedChanges) {
      setWarning('Unsupported formatting was removed for security.');
    }

    const filteredSteps = sanitizedStepsHtml
      .map((html, idx) => {
        const plain = stripHtml(html);
        return {
          title: stepTitles[idx] || `Βήμα ${idx + 1}`,
          description: plain,
          content_rich: plain
            ? {
                type: 'doc',
                content: [{ type: 'paragraph', text: plain }],
              }
            : null,
          content_html: html || null,
        };
      })
      .filter(step => step.title.trim() !== '' || step.description.trim() !== '');

    if (filteredSteps.length === 0) {
      setMessage('⚠️ Πρέπει να υπάρχει τουλάχιστον ένα βήμα με περιεχόμενο!');
      setMessageType('error');
      setSaving(false);
      return;
    }

    try {
      const introPlain = stripHtml(sanitizedIntroHtml);
      const response = await fetch(`/api/update-guide/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: guideTitle,
          difficulty_rating: difficultyRating || null,
          estimated_hours: hours || null,
          estimated_playthroughs: playthroughs || null,
          content_html: sanitizedIntroHtml || null,
          description: introPlain || null,
          content_rich: introPlain
            ? {
                type: 'doc',
                content: [{ type: 'paragraph', text: introPlain }],
              }
            : null,
          cover_image: imageUrl || null,
          background_image: imageUrl || null,
          steps: filteredSteps,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('✅ Ο οδηγός ενημερώθηκε επιτυχώς!');
        setMessageType('success');

        setTimeout(() => {
          if (gameSlug) {
            router.push(`/pages/guides/${gameSlug}`);
          }
        }, 1500);
      } else {
        setMessage(result.error || '❌ Σφάλμα κατά την ενημέρωση!');
        setMessageType('error');
      }
    } catch (error) {
      console.error('❌ Σφάλμα:', error);
      setMessage('❌ Σφάλμα κατά την αποθήκευση!');
      setMessageType('error');
    }

    setSaving(false);
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-10">
        <motion.div
          className="mx-auto w-full max-w-5xl space-y-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-bold text-slate-50">✍️ Επεξεργασία Οδηγού</h2>
            {message && messageType && (
              <Feedback
                layout="toast"
                tone={messageType === 'success' ? 'solid' : 'soft'}
                variant={messageType}
                title={messageType === 'success' ? 'Επιτυχία' : 'Σφάλμα'}
                description={message}
                dismissible
                onDismiss={() => {
                  setMessage('');
                  setMessageType(null);
                }}
              />
            )}
            {warning && (
              <Feedback
                layout="toast"
                tone="soft"
                variant="warning"
                title="Ασφάλεια μορφοποίησης"
                description={warning}
                dismissible
                onDismiss={() => setWarning(null)}
              />
            )}
          </div>

          {loading ? (
            <div className="text-center text-slate-400">🔄 Φόρτωση...</div>
          ) : (
            <div className="space-y-8">
              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">Γενικές Πληροφορίες</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <Input
                    label="Τίτλος Guide"
                    value={guideTitle}
                    onChange={e => setGuideTitle(e.target.value)}
                    error={hasTitleHtml}
                  />
                  {hasTitleHtml && (
                    <p className="text-xs text-red-400">
                      {titleValidation.error || 'Ο τίτλος δεν πρέπει να περιέχει HTML.'}
                    </p>
                  )}
                  <Input
                    label="Δυσκολία (1-10)"
                    type="number"
                    min={1}
                    max={10}
                    value={difficultyRating}
                    onChange={e =>
                      setDifficultyRating(e.target.value ? Number(e.target.value) : '')
                    }
                  />
                  <Input
                    label="Playthroughs"
                    type="number"
                    min={1}
                    max={10}
                    value={playthroughs}
                    onChange={e => setPlaythroughs(e.target.value ? Number(e.target.value) : '')}
                  />
                  <Input
                    label="Ώρες"
                    type="number"
                    value={hours}
                    onChange={e => setHours(e.target.value ? Number(e.target.value) : '')}
                  />
                  <Input
                    label="Εικόνα (URL)"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">Εισαγωγή</CardTitle>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={introHtml}
                    onChange={setIntroHtml}
                    placeholder="Ενημέρωση εισαγωγής guide..."
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">Βήματα</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <GuideStepsEditor
                    value={stepsHtml}
                    onChange={setStepsHtml}
                    placeholderPrefix="Βήμα"
                  />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-200">Τίτλοι βημάτων</h4>
                    {stepTitles.map((title, idx) => (
                      <Input
                        key={idx}
                        label={`Βήμα ${idx + 1}`}
                        value={title}
                        onChange={e => {
                          const updated = [...stepTitles];
                          updated[idx] = e.target.value;
                          setStepTitles(updated);
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setStepsHtml(prev => [...prev, '']);
                        setStepTitles(prev => [...prev, '']);
                      }}
                      className="bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600 text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-400/40"
                    >
                      + Προσθήκη Βήματος
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={handleSave} disabled={saving || hasTitleHtml}>
                  {saving ? '💾 Αποθήκευση...' : '💾 Αποθήκευση'}
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  ⬅️ Επιστροφή
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
}
