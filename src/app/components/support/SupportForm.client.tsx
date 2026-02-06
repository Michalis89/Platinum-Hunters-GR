'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { AlertTriangle, Bug, Mail, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Select } from '@/app/components/ui/Select';
import { Checkbox } from '@/app/components/ui/Checkbox';
import { Switch } from '@/app/components/ui/Switch';
import { SegmentedControl } from '@/app/components/ui/SegmentedControl';
import { Button } from '@/components/ui/button';
import Feedback from '@/app/components/ui/Feedback';
import FormErrorMessage from '@/app/components/ui/FormErrorMessage';
import { InfoHint } from '@/app/components/ui/InfoHint';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { selectUser } from '@/store/slices/authSlice';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import AttachmentDropzone, {
  type AttachmentItem,
} from '@/app/components/support/AttachmentDropzone.client';
import {
  SUPPORT_SEVERITY_OPTIONS,
  SUPPORT_SEVERITY_LABELS,
  SUPPORT_CATEGORY_LABELS,
} from '@/lib/constants/support';
import { UI_CLASSNAMES } from '@/lib/constants/ui';

const CATEGORY_OPTIONS = [
  { id: 'bug', label: SUPPORT_CATEGORY_LABELS.bug, description: 'Κάτι δεν δουλεύει' },
  { id: 'feature', label: SUPPORT_CATEGORY_LABELS.feature, description: 'Νέα λειτουργία' },
  {
    id: 'author_rights',
    label: SUPPORT_CATEGORY_LABELS.author_rights,
    description: 'Αίτημα ρόλου',
  },
  { id: 'general', label: SUPPORT_CATEGORY_LABELS.general, description: 'Σχόλια/Επικοινωνία' },
];

const URGENCY_OPTIONS = ['nice_to_have', 'important', 'urgent'];
const PERMISSIONS = ['Author (Αρθρογραφία)', 'Moderator (Moderation)', 'Reviewer', 'Admin'];
const DEVICE_OPTIONS = ['desktop', 'mobile', 'tablet', 'console', 'other'];
const OS_OPTIONS = ['windows', 'macos', 'linux', 'ios', 'android', 'other'];
const BROWSER_OPTIONS = ['chrome', 'safari', 'firefox', 'edge', 'opera', 'other'];

const deviceLabels: Record<string, string> = {
  desktop: 'Desktop / Laptop',
  mobile: 'Κινητό',
  tablet: 'Tablet',
  console: 'Κονσόλα',
  other: 'Άλλο',
};

const osLabels: Record<string, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  ios: 'iOS',
  android: 'Android',
  other: 'Άλλο',
};

const browserLabels: Record<string, string> = {
  chrome: 'Chrome',
  safari: 'Safari',
  firefox: 'Firefox',
  edge: 'Edge',
  opera: 'Opera',
  other: 'Άλλο',
};

const urgencyLabels: Record<string, string> = {
  nice_to_have: 'Nice to have',
  important: 'Σημαντικό',
  urgent: 'Επείγον',
};

const categoryIcons: Record<string, React.ReactNode> = {
  bug: <Bug className="h-4 w-4" />,
  feature: <Sparkles className="h-4 w-4" />,
  author_rights: <ShieldCheck className="h-4 w-4" />,
  general: <MessageCircle className="h-4 w-4" />,
};

export default function SupportForm({}: Readonly<{
  securityEmail?: string | null;
  contactEmail?: string | null;
}>) {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const user = useSelector(selectUser);

  const [category, setCategory] = useState('bug');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: '',
    consent: false,
    allowFollowUp: true,
    steps: '',
    expected: '',
    actual: '',
    severity: '',
    useCase: '',
    value: '',
    urgency: '',
    profileLink: '',
    portfolioLinks: '',
    reason: '',
    topic: '',
  });
  const [environmentFields, setEnvironmentFields] = useState({
    device: '',
    os: '',
    browser: '',
    appVersion: '',
  });
  const [requestedPermissions, setRequestedPermissions] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.display_name || user.full_name || user.username || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const buildId = (window as { __NEXT_DATA__?: { buildId?: string } }).__NEXT_DATA__?.buildId;
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    const detectedDevice = /iphone|android.*mobile|windows phone/.test(ua)
      ? 'mobile'
      : /ipad|tablet|android(?!.*mobile)/.test(ua)
        ? 'tablet'
        : 'desktop';
    const detectedOs = /windows/.test(platform)
      ? 'windows'
      : /mac/.test(platform)
        ? 'macos'
        : /linux/.test(platform)
          ? 'linux'
          : /iphone|ipad|ipod/.test(ua)
            ? 'ios'
            : /android/.test(ua)
              ? 'android'
              : 'other';
    const detectedBrowser = /edg\//.test(ua)
      ? 'edge'
      : /chrome\//.test(ua)
        ? 'chrome'
        : /safari\//.test(ua) && !/chrome\//.test(ua)
          ? 'safari'
          : /firefox\//.test(ua)
            ? 'firefox'
            : /opera|opr\//.test(ua)
              ? 'opera'
              : 'other';
    setEnvironmentFields({
      device: detectedDevice,
      os: detectedOs,
      browser: detectedBrowser,
      appVersion: buildId || '',
    });
  }, []);

  const environmentPayload = useMemo(
    () => ({
      device: environmentFields.device,
      os: environmentFields.os,
      browser: environmentFields.browser,
      app_version: environmentFields.appVersion,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      language: typeof navigator !== 'undefined' ? navigator.language : null,
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null,
    }),
    [environmentFields],
  );

  const handleChange =
    (key: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormData(prev => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors(prev => ({ ...prev, [key]: '' }));
      }
    };

  const handleSelect = (key: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const togglePermission = (label: string) => {
    setRequestedPermissions(prev =>
      prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label],
    );
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.subject.trim()) nextErrors.subject = 'Το θέμα είναι υποχρεωτικό.';
    if (!formData.description.trim()) nextErrors.description = 'Η περιγραφή είναι υποχρεωτική.';
    if (!isAuthenticated && !formData.email.trim())
      nextErrors.email = 'Το email είναι υποχρεωτικό.';
    if (!formData.consent) nextErrors.consent = 'Χρειάζεται συναίνεση αποθήκευσης.';

    if (category === 'bug') {
      if (!formData.steps.trim()) nextErrors.steps = 'Περιέγραψε τα βήματα.';
      if (!formData.expected.trim()) nextErrors.expected = 'Πες μας το αναμενόμενο αποτέλεσμα.';
      if (!formData.actual.trim()) nextErrors.actual = 'Πες μας το πραγματικό αποτέλεσμα.';
      if (!formData.severity) nextErrors.severity = 'Επίλεξε σοβαρότητα.';
    }

    if (category === 'feature') {
      if (!formData.useCase.trim()) nextErrors.useCase = 'Περιέγραψε το use case.';
      if (!formData.value.trim()) nextErrors.value = 'Πες μας την αξία.';
      if (!formData.urgency) nextErrors.urgency = 'Επίλεξε προτεραιότητα.';
    }

    if (category === 'author_rights' && !formData.reason.trim()) {
      nextErrors.reason = 'Πες μας τον λόγο του αιτήματος.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResult(null);
    setTicketId(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      const body = new FormData();
      body.append('category', category);
      body.append('subject', formData.subject);
      body.append('description', formData.description);
      body.append('name', formData.name);
      body.append('email', formData.email);
      body.append('consent', String(formData.consent));
      body.append('allow_follow_up', String(formData.allowFollowUp));
      body.append('environment', JSON.stringify(environmentPayload));

      if (category === 'bug') {
        body.append('steps_to_reproduce', formData.steps);
        body.append('expected', formData.expected);
        body.append('actual', formData.actual);
        body.append('severity', formData.severity);
      }

      if (category === 'feature') {
        body.append('use_case', formData.useCase);
        body.append('value', formData.value);
        body.append('urgency', formData.urgency);
      }

      if (category === 'author_rights') {
        body.append('profile_link', formData.profileLink);
        body.append('portfolio_links', formData.portfolioLinks);
        body.append('reason', formData.reason);
        body.append('requested_permissions', JSON.stringify(requestedPermissions));
      }

      if (category === 'general') {
        body.append('topic', formData.topic);
      }

      attachments.forEach(item => {
        body.append('attachments', item.file);
      });

      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        body,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Η αποστολή απέτυχε.');
      }

      setTicketId(payload.data?.ticket_id ?? null);
      setResult({ type: 'success', message: 'Το αίτημά σου καταχωρήθηκε με επιτυχία.' });
      setAttachments([]);
      setFormData(prev => ({
        ...prev,
        subject: '',
        description: '',
        steps: '',
        expected: '',
        actual: '',
        severity: '',
        useCase: '',
        value: '',
        urgency: '',
        profileLink: '',
        portfolioLinks: '',
        reason: '',
        topic: '',
        consent: false,
        allowFollowUp: true,
      }));
      setRequestedPermissions([]);
    } catch (err) {
      setResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Κάτι πήγε στραβά. Δοκίμασε ξανά.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hb-bg)]">
        <LoadingSpinner size="lg" label="Φόρτωση..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={UI_CLASSNAMES.pageShell}>
      <div className={UI_CLASSNAMES.pageBackdrop}>
        <div className={UI_CLASSNAMES.pageGradient} />
      </div>

      <div className="relative mt-10">
        <PageHero
          eyebrow="Υποστήριξη"
          title={
            <span className="text-3xl text-[var(--hb-headline)] md:text-5xl">
              Είμαστε εδώ για να βοηθήσουμε
            </span>
          }
          subtitle={
            <span>
              Στείλε bug, πρόταση ή αίτημα author rights. Θα λάβεις ενημέρωση μόλις υπάρξει εξέλιξη.
            </span>
          }
          actions={
            isAuthenticated ? (
              <Button href="/pages/support/tickets" variant="secondary">
                Τα tickets μου
              </Button>
            ) : undefined
          }
          badges={
            <>
              <span className="rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] px-3 py-1">
                Μην ανεβάζεις προσωπικά δεδομένα σε screenshots.
              </span>
            </>
          }
        />

        <PageContainer size="md" className="mt-10 pb-20">
          <Card className={UI_CLASSNAMES.panelCard}>
            <CardHeader className="border-[var(--hb-border)]">
              <CardTitle className="flex items-center gap-3 text-[var(--hb-headline)]">
                <Mail className="h-5 w-5 text-[var(--hb-primary)]" />
                Επικοινωνία & Υποστήριξη
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SegmentedControl
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={value => setCategory(value)}
              />

              <form onSubmit={handleSubmit} className="space-y-5">
                {result ? (
                  <Feedback
                    variant={result.type === 'success' ? 'success' : 'error'}
                    tone={result.type === 'success' ? 'solid' : 'soft'}
                    title={result.type === 'success' ? 'Επιτυχία' : 'Σφάλμα'}
                  >
                    {result.type === 'success' && ticketId && isAuthenticated ? (
                      <span>
                        {result.message}{' '}
                        <Link className="underline" href={`/pages/support/tickets/${ticketId}`}>
                          Δες το ticket σου
                        </Link>
                      </span>
                    ) : (
                      result.message
                    )}
                  </Feedback>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Όνομα"
                    type="text"
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="Προαιρετικό"
                    disabled={submitting}
                    className="border-[var(--hb-border)] bg-[var(--hb-card)]"
                  />
                  <div>
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange('email')}
                      placeholder="you@email.com"
                      disabled={submitting}
                      required={!isAuthenticated}
                      error={!!errors.email}
                      className="border-[var(--hb-border)] bg-[var(--hb-card)]"
                    />
                    <FormErrorMessage message={errors.email} />
                  </div>
                </div>

                <div>
                  <Input
                    label="Θέμα"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange('subject')}
                    placeholder="Σύντομος τίτλος"
                    disabled={submitting}
                    required
                    error={!!errors.subject}
                    className="border-[var(--hb-border)] bg-[var(--hb-card)]"
                  />
                  <FormErrorMessage message={errors.subject} />
                </div>

                <div>
                  <Textarea
                    label="Περιγραφή"
                    value={formData.description}
                    onChange={handleChange('description')}
                    placeholder="Περιέγραψε τι χρειάζεσαι"
                    rows={4}
                    disabled={submitting}
                    required
                    error={!!errors.description}
                  />
                  <FormErrorMessage message={errors.description} />
                </div>

                {category === 'bug' ? (
                  <div className="space-y-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                      <span className="bg-[var(--hb-primary-strong)]/20 flex h-7 w-7 items-center justify-center rounded-full text-[var(--hb-primary)]">
                        {categoryIcons.bug}
                      </span>
                      Στοιχεία bug
                    </div>
                    <div>
                      <Textarea
                        label="Βήματα αναπαραγωγής"
                        value={formData.steps}
                        onChange={handleChange('steps')}
                        placeholder="1. ...\n2. ..."
                        rows={3}
                        disabled={submitting}
                        error={!!errors.steps}
                      />
                      <FormErrorMessage message={errors.steps} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Textarea
                          label="Αναμενόμενο αποτέλεσμα"
                          value={formData.expected}
                          onChange={handleChange('expected')}
                          placeholder="Τι έπρεπε να συμβεί"
                          rows={2}
                          disabled={submitting}
                          error={!!errors.expected}
                        />
                        <FormErrorMessage message={errors.expected} />
                      </div>
                      <div>
                        <Textarea
                          label="Πραγματικό αποτέλεσμα"
                          value={formData.actual}
                          onChange={handleChange('actual')}
                          placeholder="Τι συνέβη"
                          rows={2}
                          disabled={submitting}
                          error={!!errors.actual}
                        />
                        <FormErrorMessage message={errors.actual} />
                      </div>
                    </div>
                    <div>
                      <Select
                        label="Σοβαρότητα"
                        value={formData.severity}
                        onChange={handleSelect('severity')}
                        options={SUPPORT_SEVERITY_OPTIONS}
                        optionLabels={SUPPORT_SEVERITY_LABELS}
                        className="border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-text)] focus:border-[var(--hb-primary-strong)] focus:ring-[var(--hb-primary-strong)]"
                        labelClassName="text-[var(--hb-headline)]"
                        placeholder="Επίλεξε"
                        error={!!errors.severity}
                      />
                      <FormErrorMessage message={errors.severity} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select
                        label="Συσκευή"
                        options={DEVICE_OPTIONS}
                        optionLabels={deviceLabels}
                        value={environmentFields.device}
                        onChange={value =>
                          setEnvironmentFields(prev => ({ ...prev, device: value }))
                        }
                      />
                      <Select
                        label="Λειτουργικό"
                        options={OS_OPTIONS}
                        optionLabels={osLabels}
                        value={environmentFields.os}
                        onChange={value => setEnvironmentFields(prev => ({ ...prev, os: value }))}
                      />
                      <Select
                        label="Browser"
                        options={BROWSER_OPTIONS}
                        optionLabels={browserLabels}
                        value={environmentFields.browser}
                        onChange={value =>
                          setEnvironmentFields(prev => ({ ...prev, browser: value }))
                        }
                      />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-[var(--hb-headline)]">
                            Έκδοση εφαρμογής
                          </label>
                          <InfoHint tip="Η έκδοση της εφαρμογής φαίνεται στο footer Personal Hobby Hub: x.x.x." />
                        </div>
                        <Input
                          type="text"
                          value={environmentFields.appVersion}
                          onChange={event =>
                            setEnvironmentFields(prev => ({
                              ...prev,
                              appVersion: event.target.value,
                            }))
                          }
                          placeholder="Build / έκδοση"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {category === 'feature' ? (
                  <div className="space-y-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                      <span className="bg-[var(--hb-primary-strong)]/20 flex h-7 w-7 items-center justify-center rounded-full text-[var(--hb-primary)]">
                        {categoryIcons.feature}
                      </span>
                      Πρόταση λειτουργίας
                    </div>
                    <div>
                      <Textarea
                        label="Περίπτωση χρήσης"
                        value={formData.useCase}
                        onChange={handleChange('useCase')}
                        placeholder="Ποιο πρόβλημα λύνει;"
                        rows={3}
                        disabled={submitting}
                        error={!!errors.useCase}
                      />
                      <FormErrorMessage message={errors.useCase} />
                    </div>
                    <div>
                      <Textarea
                        label="Αξία"
                        value={formData.value}
                        onChange={handleChange('value')}
                        placeholder="Πώς θα βοηθήσει την κοινότητα;"
                        rows={3}
                        disabled={submitting}
                        error={!!errors.value}
                      />
                      <FormErrorMessage message={errors.value} />
                    </div>
                    <div>
                      <Select
                        label="Προτεραιότητα"
                        value={formData.urgency}
                        onChange={handleSelect('urgency')}
                        options={URGENCY_OPTIONS}
                        optionLabels={urgencyLabels}
                        className="border-[var(--hb-border)] bg-[var(--hb-panel)] text-[var(--hb-text)] focus:border-[var(--hb-primary-strong)] focus:ring-[var(--hb-primary-strong)]"
                        labelClassName="text-[var(--hb-headline)]"
                        placeholder="Επίλεξε"
                        error={!!errors.urgency}
                      />
                      <FormErrorMessage message={errors.urgency} />
                    </div>
                  </div>
                ) : null}

                {category === 'author_rights' ? (
                  <div className="space-y-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                      <span className="bg-[var(--hb-primary-strong)]/20 flex h-7 w-7 items-center justify-center rounded-full text-[var(--hb-primary)]">
                        {categoryIcons.author_rights}
                      </span>
                      Αίτημα author δικαιωμάτων
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Προφίλ / Username"
                        type="text"
                        value={formData.profileLink}
                        onChange={handleChange('profileLink')}
                        placeholder="https://..."
                      />
                      <Input
                        label="Σύνδεσμοι portfolio"
                        type="text"
                        value={formData.portfolioLinks}
                        onChange={handleChange('portfolioLinks')}
                        placeholder="Σύνδεσμοι χωρισμένοι με κόμμα"
                      />
                    </div>
                    <div>
                      <Textarea
                        label="Λόγος αιτήματος"
                        value={formData.reason}
                        onChange={handleChange('reason')}
                        placeholder="Γιατί θέλεις author rights;"
                        rows={3}
                        disabled={submitting}
                        error={!!errors.reason}
                      />
                      <FormErrorMessage message={errors.reason} />
                    </div>
                    <div>
                      <div className="mb-2 text-sm font-medium text-[var(--hb-headline)]">
                        Ζητούμενα δικαιώματα
                      </div>
                      <p className="mb-3 text-xs text-[var(--hb-muted)]">
                        Μπορείς να επιλέξεις και τα δύο Author και Reviewer.
                      </p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {PERMISSIONS.map(permission => (
                          <Checkbox
                            key={permission}
                            label={permission}
                            checked={requestedPermissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {category === 'general' ? (
                  <div className="space-y-4 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--hb-headline)]">
                      <span className="bg-[var(--hb-primary-strong)]/20 flex h-7 w-7 items-center justify-center rounded-full text-[var(--hb-primary)]">
                        {categoryIcons.general}
                      </span>
                      Γενικό θέμα
                    </div>
                    <Input
                      label="Θεματική"
                      type="text"
                      value={formData.topic}
                      onChange={handleChange('topic')}
                      placeholder="Π.χ. Συνεργασία, feedback"
                    />
                  </div>
                ) : null}

                <AttachmentDropzone
                  items={attachments}
                  onChange={setAttachments}
                  helperText="Μην ανεβάζεις προσωπικά δεδομένα σε screenshots."
                  disabled={submitting}
                />

                <div className="space-y-3 rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-4">
                  <Checkbox
                    label="Συμφωνώ να αποθηκευτούν τα στοιχεία του αιτήματος"
                    description="Χρειαζόμαστε τα στοιχεία σου μόνο για την υποστήριξη."
                    checked={formData.consent}
                    onChange={event => {
                      setFormData(prev => ({ ...prev, consent: event.target.checked }));
                      if (errors.consent) {
                        setErrors(prev => ({ ...prev, consent: '' }));
                      }
                    }}
                  />
                  <FormErrorMessage message={errors.consent} />

                  <Switch
                    label="Επιτρέπω follow-up email"
                    description="Θα λάβεις ενημερώσεις για την πορεία του ticket."
                    checked={formData.allowFollowUp}
                    onChange={event =>
                      setFormData(prev => ({ ...prev, allowFollowUp: event.target.checked }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 text-xs text-[var(--hb-muted)] dark:text-[var(--hb-muted)]">
                    <AlertTriangle className="h-4 w-4" />
                    Τα αρχεία αποθηκεύονται σε ιδιωτικό χώρο.
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Αποστολή...' : 'Υποβολή αιτήματος'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    </div>
  );
}
