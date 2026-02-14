'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { AlertTriangle, Bug, Info, Mail, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import PageHero from '@/app/components/shared/PageHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectField as Select } from '@/components/ui/select-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FieldError } from '@/components/ui/field';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { selectUser } from '@/store/slices/authSlice';
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
  // Middleware ensures only authenticated users reach this page
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
    // Email is optional since user is authenticated (middleware ensures this)
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

  return (
    <div className={UI_CLASSNAMES.pageShell}>
      <div className={UI_CLASSNAMES.pageBackdrop}>
        <div className={UI_CLASSNAMES.pageGradient} />
      </div>

      <div className="relative mt-10">
        <PageHero
          eyebrow="Υποστήριξη"
          title={
            <span className="text-3xl text-foreground md:text-5xl">
              Είμαστε εδώ για να βοηθήσουμε
            </span>
          }
          subtitle={
            <span>
              Στείλε bug, πρόταση ή αίτημα author rights. Θα λάβεις ενημέρωση μόλις υπάρξει εξέλιξη.
            </span>
          }
          actions={
            <Button href="/pages/support/tickets" variant="secondary">
              Τα tickets μου
            </Button>
          }
          badges={
            <>
              <span className="rounded-full border border-border bg-card px-3 py-1">
                Μην ανεβάζεις προσωπικά δεδομένα σε screenshots.
              </span>
            </>
          }
        />

        <PageContainer size="md" className="mt-10 pb-20">
          <Card className={UI_CLASSNAMES.panelCard}>
            <CardHeader className="border-border">
              <CardTitle className="flex items-center gap-3 text-foreground">
                <Mail className="h-5 w-5 text-primary" />
                Επικοινωνία & Υποστήριξη
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs
                value={category}
                onValueChange={value => setCategory(value as typeof category)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-1 gap-2 rounded-2xl border border-border bg-card p-2 md:grid-cols-4">
                  {CATEGORY_OPTIONS.map(option => (
                    <TabsTrigger
                      key={option.id}
                      value={option.id}
                      className="flex flex-col items-start rounded-xl px-4 py-3 text-sm font-semibold text-foreground"
                    >
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="mt-1 text-xs font-normal text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <form onSubmit={handleSubmit} className="space-y-5">
                {result ? (
                  <Alert
                    variant={result.type === 'success' ? 'success' : 'destructive'}
                    className="rounded-2xl border border-border bg-card/70 px-4 py-3"
                  >
                    <AlertTitle className="text-base">
                      {result.type === 'success' ? 'Επιτυχία' : 'Σφάλμα'}
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {result.type === 'success' && ticketId ? (
                        <>
                          {result.message}{' '}
                          <Link
                            className="underline transition-colors hover:text-primary"
                            href={`/pages/support/tickets/${ticketId}`}
                          >
                            Δες το ticket σου
                          </Link>
                        </>
                      ) : (
                        result.message
                      )}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Όνομα"
                    type="text"
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="Προαιρετικό"
                    disabled={submitting}
                    className="border-border bg-card"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    placeholder="you@email.com"
                    disabled={submitting}
                    error={errors.email}
                    className="border-border bg-card"
                  />
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
                    error={errors.subject}
                    className="border-border bg-card"
                  />
                </div>

                <div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Περιγραφή <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={handleChange('description')}
                      placeholder="Περιέγραψε τι χρειάζεσαι"
                      rows={4}
                      disabled={submitting}
                      required
                      className={
                        errors.description ? 'border-red-500 focus-visible:ring-red-500/30' : ''
                      }
                    />
                  </div>
                  <FieldError>{errors.description}</FieldError>
                </div>

                {category === 'bug' ? (
                  <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
                        {categoryIcons.bug}
                      </span>
                      Στοιχεία bug
                    </div>
                    <div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                          Βήματα αναπαραγωγής
                        </label>
                        <Textarea
                          value={formData.steps}
                          onChange={handleChange('steps')}
                          placeholder="1. ...\n2. ..."
                          rows={3}
                          disabled={submitting}
                          className={
                            errors.steps ? 'border-red-500 focus-visible:ring-red-500/30' : ''
                          }
                        />
                      </div>
                      <FieldError>{errors.steps}</FieldError>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            Αναμενόμενο αποτέλεσμα
                          </label>
                          <Textarea
                            value={formData.expected}
                            onChange={handleChange('expected')}
                            placeholder="Τι έπρεπε να συμβεί"
                            rows={2}
                            disabled={submitting}
                            className={
                              errors.expected ? 'border-red-500 focus-visible:ring-red-500/30' : ''
                            }
                          />
                        </div>
                        <FieldError>{errors.expected}</FieldError>
                      </div>
                      <div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            Πραγματικό αποτέλεσμα
                          </label>
                          <Textarea
                            value={formData.actual}
                            onChange={handleChange('actual')}
                            placeholder="Τι συνέβη"
                            rows={2}
                            disabled={submitting}
                            className={
                              errors.actual ? 'border-red-500 focus-visible:ring-red-500/30' : ''
                            }
                          />
                        </div>
                        <FieldError>{errors.actual}</FieldError>
                      </div>
                    </div>
                    <div>
                      <Select
                        label="Σοβαρότητα"
                        value={formData.severity}
                        onChange={handleSelect('severity')}
                        options={SUPPORT_SEVERITY_OPTIONS}
                        optionLabels={SUPPORT_SEVERITY_LABELS}
                        className="border-border bg-card text-foreground focus:border-primary focus:ring-primary"
                        labelClassName="text-foreground"
                        placeholder="Επίλεξε"
                        error={!!errors.severity}
                      />
                      <FieldError>{errors.severity}</FieldError>
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
                          <label className="text-sm font-medium text-foreground">
                            Έκδοση εφαρμογής
                          </label>
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  aria-label="Πληροφορίες υπολογισμού"
                                  className="grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-primary transition hover:border-primary hover:bg-primary/10"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                align="center"
                                sideOffset={8}
                                className="z-[9999] w-[min(280px,80vw)] rounded-2xl border border-border bg-card p-3 text-xs leading-relaxed text-foreground shadow-md"
                              >
                                Η έκδοση της εφαρμογής φαίνεται στο footer Personal Hobby Hub:
                                x.x.x.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                  <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
                        {categoryIcons.feature}
                      </span>
                      Πρόταση λειτουργίας
                    </div>
                    <div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                          Περίπτωση χρήσης
                        </label>
                        <Textarea
                          value={formData.useCase}
                          onChange={handleChange('useCase')}
                          placeholder="Ποιο πρόβλημα λύνει;"
                          rows={3}
                          disabled={submitting}
                          className={
                            errors.useCase ? 'border-red-500 focus-visible:ring-red-500/30' : ''
                          }
                        />
                      </div>
                      <FieldError>{errors.useCase}</FieldError>
                    </div>
                    <div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Αξία</label>
                        <Textarea
                          value={formData.value}
                          onChange={handleChange('value')}
                          placeholder="Πώς θα βοηθήσει την κοινότητα;"
                          rows={3}
                          disabled={submitting}
                          className={
                            errors.value ? 'border-red-500 focus-visible:ring-red-500/30' : ''
                          }
                        />
                      </div>
                      <FieldError>{errors.value}</FieldError>
                    </div>
                    <div>
                      <Select
                        label="Προτεραιότητα"
                        value={formData.urgency}
                        onChange={handleSelect('urgency')}
                        options={URGENCY_OPTIONS}
                        optionLabels={urgencyLabels}
                        className="border-border bg-card text-foreground focus:border-primary focus:ring-primary"
                        labelClassName="text-foreground"
                        placeholder="Επίλεξε"
                        error={!!errors.urgency}
                      />
                      <FieldError>{errors.urgency}</FieldError>
                    </div>
                  </div>
                ) : null}

                {category === 'author_rights' ? (
                  <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
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
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                          Λόγος αιτήματος
                        </label>
                        <Textarea
                          value={formData.reason}
                          onChange={handleChange('reason')}
                          placeholder="Γιατί θέλεις author rights;"
                          rows={3}
                          disabled={submitting}
                          className={
                            errors.reason ? 'border-red-500 focus-visible:ring-red-500/30' : ''
                          }
                        />
                      </div>
                      <FieldError>{errors.reason}</FieldError>
                    </div>
                    <div>
                      <div className="mb-2 text-sm font-medium text-foreground">
                        Ζητούμενα δικαιώματα
                      </div>
                      <p className="mb-3 text-xs text-muted-foreground">
                        Μπορείς να επιλέξεις και τα δύο Author και Reviewer.
                      </p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {PERMISSIONS.map(permission => (
                          <label
                            key={permission}
                            className="flex cursor-pointer items-center gap-3 text-sm"
                          >
                            <Checkbox
                              checked={requestedPermissions.includes(permission)}
                              onCheckedChange={() => togglePermission(permission)}
                            />
                            <span className="font-medium text-foreground">{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {category === 'general' ? (
                  <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
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

                <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <Checkbox
                      checked={formData.consent}
                      onCheckedChange={checked => {
                        setFormData(prev => ({ ...prev, consent: checked as boolean }));
                        if (errors.consent) {
                          setErrors(prev => ({ ...prev, consent: '' }));
                        }
                      }}
                    />
                    <span className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">
                        Συμφωνώ να αποθηκευτούν τα στοιχεία του αιτήματος
                      </span>
                      <span className="text-muted-foreground">
                        Χρειαζόμαστε τα στοιχεία σου μόνο για την υποστήριξη.
                      </span>
                    </span>
                  </label>
                  <FieldError>{errors.consent}</FieldError>

                  <label className="flex items-start justify-between gap-4">
                    <span className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-[var(--hb-headline)]">
                        Επιτρέπω follow-up email
                      </span>
                      <span className="text-xs text-[var(--hb-muted)]">
                        Θα λάβεις ενημερώσεις για την πορεία του ticket.
                      </span>
                    </span>
                    <Switch
                      checked={formData.allowFollowUp}
                      onCheckedChange={value =>
                        setFormData(prev => ({ ...prev, allowFollowUp: value }))
                      }
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
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
