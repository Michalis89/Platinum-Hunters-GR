'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import {
  AlertTriangle,
  Bug,
  CircleHelp,
  Info,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { SUPPORT_SEVERITY_OPTIONS } from '@/lib/constants/support';

const CATEGORY_OPTIONS = [
  { id: 'bug', label: 'Bug report', description: 'Something is not working as expected' },
  { id: 'feature', label: 'Feature request', description: 'Suggest an improvement' },
  {
    id: 'author_rights',
    label: 'Author rights',
    description: 'Request content permissions',
  },
  { id: 'general', label: 'General', description: 'Questions or feedback' },
];

const URGENCY_OPTIONS = ['nice_to_have', 'important', 'urgent'];
const PERMISSIONS = ['Author (Publishing)', 'Moderator (Moderation)', 'Reviewer', 'Admin'];
const DEVICE_OPTIONS = ['desktop', 'mobile', 'tablet', 'console', 'other'];
const OS_OPTIONS = ['windows', 'macos', 'linux', 'ios', 'android', 'other'];
const BROWSER_OPTIONS = ['chrome', 'safari', 'firefox', 'edge', 'opera', 'other'];

const deviceLabels: Record<string, string> = {
  desktop: 'Desktop / Laptop',
  mobile: 'Mobile',
  tablet: 'Tablet',
  console: 'Console',
  other: 'Other',
};

const osLabels: Record<string, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  ios: 'iOS',
  android: 'Android',
  other: 'Other',
};

const browserLabels: Record<string, string> = {
  chrome: 'Chrome',
  safari: 'Safari',
  firefox: 'Firefox',
  edge: 'Edge',
  opera: 'Opera',
  other: 'Other',
};

const urgencyLabels: Record<string, string> = {
  nice_to_have: 'Nice to have',
  important: 'Important',
  urgent: 'Urgent',
};

const severityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function SectionHeading({ icon, title }: Readonly<{ icon: React.ReactNode; title: string }>) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

const requiredMark = <span className="text-destructive/70"> *</span>;

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
    if (typeof window === 'undefined') {
      return;
    }
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
    if (!formData.subject.trim()) {
      nextErrors.subject = 'Subject is required.';
    }
    if (!formData.description.trim()) {
      nextErrors.description = 'Message is required.';
    }
    if (!formData.consent) {
      nextErrors.consent = 'Consent is required to continue.';
    }

    if (category === 'bug') {
      if (!formData.steps.trim()) {
        nextErrors.steps = 'Please add steps to reproduce.';
      }
      if (!formData.expected.trim()) {
        nextErrors.expected = 'Please describe the expected result.';
      }
      if (!formData.actual.trim()) {
        nextErrors.actual = 'Please describe the actual result.';
      }
      if (!formData.severity) {
        nextErrors.severity = 'Please select severity.';
      }
    }

    if (category === 'feature') {
      if (!formData.useCase.trim()) {
        nextErrors.useCase = 'Please describe the use case.';
      }
      if (!formData.value.trim()) {
        nextErrors.value = 'Please explain the value.';
      }
      if (!formData.urgency) {
        nextErrors.urgency = 'Please set a priority.';
      }
    }

    if (category === 'author_rights' && !formData.reason.trim()) {
      nextErrors.reason = 'Please explain why you are requesting access.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResult(null);
    setTicketId(null);

    if (!validate()) {
      return;
    }

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
        throw new Error(payload.error || 'Request submission failed.');
      }

      setTicketId(payload.data?.ticket_id ?? null);
      setResult({ type: 'success', message: 'Your request has been submitted successfully.' });
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
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative px-3 pb-10 pt-6 sm:px-4 md:pb-16 md:pt-8">
      <div className="relative mx-auto flex w-full max-w-screen-2xl flex-col gap-5 sm:gap-6">
        <section className="relative w-full overflow-hidden rounded-2xl border border-border/40 bg-card/30 px-6 py-7 text-center shadow-sm shadow-black/5 md:px-10 md:py-9">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/3 rounded-full"
            style={{
              background:
                'radial-gradient(circle at center, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.06) 35%, transparent 72%)',
            }}
          />
          <div className="relative">
            <div className="mb-3 flex items-center justify-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full border-border/60 bg-card/70 text-xs"
              >
                Support
              </Badge>
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              We&rsquo;re here to help.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
              Report a bug, share feedback, or request author rights. We&rsquo;ll get back to you by
              email.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Avoid including sensitive personal data in screenshots.
            </p>
            <div className="mt-5">
              <Button href="/support/tickets" variant="secondary">
                My tickets
              </Button>
            </div>
          </div>
        </section>

        <Card className="w-full rounded-2xl border-border/40 bg-card/60 shadow-lg shadow-black/10 transition-shadow duration-200">
          <form onSubmit={handleSubmit} id="support-request-form" className="contents">
            <CardHeader className="border-b border-border/50 pb-5">
              <CardTitle className="flex items-center gap-3 text-lg text-foreground">
                <Mail className="h-5 w-5 text-primary" />
                Contact support
              </CardTitle>
              <CardDescription>
                Fill in the details below and submit your request. Required fields are marked with
                an asterisk.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {result ? (
                <Alert
                  variant={result.type === 'success' ? 'success' : 'destructive'}
                  className="rounded-xl border border-border/60 bg-card/70 px-4 py-3"
                >
                  <AlertTitle className="text-base">
                    {result.type === 'success' ? 'Request sent' : 'Unable to send'}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {result.type === 'success' && ticketId ? (
                      <>
                        {result.message}{' '}
                        <Link
                          className="underline transition-colors hover:text-primary"
                          href={`/support/tickets/${ticketId}`}
                        >
                          View ticket
                        </Link>
                      </>
                    ) : (
                      result.message
                    )}
                  </AlertDescription>
                </Alert>
              ) : null}

              <section className="space-y-4">
                <SectionHeading
                  icon={<Mail className="h-4 w-4" />}
                  title="Contact & request type"
                />

                <Tabs
                  value={category}
                  onValueChange={value => setCategory(value as typeof category)}
                  className="w-full"
                >
                  <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-xl border border-border/60 bg-card/70 p-2 md:grid-cols-4">
                    {CATEGORY_OPTIONS.map(option => (
                      <TabsTrigger
                        key={option.id}
                        value={option.id}
                        className="h-auto whitespace-normal rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors duration-200"
                      >
                        <span className="w-full text-pretty leading-tight">{option.label}</span>
                        <span className="mt-1 w-full text-pretty text-xs font-normal leading-tight text-muted-foreground">
                          {option.description}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="Your name"
                    disabled={submitting}
                    className="border-border bg-card transition-colors duration-200"
                    labelClassName="text-sm font-medium"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    placeholder="you@email.com"
                    disabled={submitting}
                    error={errors.email}
                    className="border-border bg-card transition-colors duration-200"
                    labelClassName="text-sm font-medium"
                  />
                  <div className="md:col-span-2">
                    <Input
                      label={
                        <>
                          Subject
                          {requiredMark}
                        </>
                      }
                      type="text"
                      value={formData.subject}
                      onChange={handleChange('subject')}
                      placeholder="Short summary"
                      disabled={submitting}
                      required
                      error={errors.subject}
                      className="border-border bg-card transition-colors duration-200"
                      labelClassName="text-sm font-medium"
                    />
                  </div>
                </div>
              </section>

              <Separator className="bg-border/50" />

              <section className="space-y-3">
                <SectionHeading icon={<MessageCircle className="h-4 w-4" />} title="Message" />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Description
                    {requiredMark}
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={handleChange('description')}
                    placeholder="Describe your request"
                    rows={5}
                    disabled={submitting}
                    required
                    className={
                      errors.description
                        ? 'border-red-500 focus-visible:ring-red-500/30'
                        : 'transition-colors duration-200'
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Include enough context so we can reproduce the issue or understand the request.
                  </p>
                </div>
                <FieldError>{errors.description}</FieldError>
              </section>

              {category === 'bug' ? (
                <>
                  <Separator className="bg-border/50" />

                  <section className="space-y-4">
                    <SectionHeading icon={<Bug className="h-4 w-4" />} title="Bug details" />
                    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors duration-200">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">
                          Steps to reproduce
                          {requiredMark}
                        </label>
                        <Textarea
                          value={formData.steps}
                          onChange={handleChange('steps')}
                          placeholder={'1. First step\n2. Second step'}
                          rows={4}
                          disabled={submitting}
                          className={
                            errors.steps ? 'border-red-500 focus-visible:ring-red-500/30' : ''
                          }
                        />
                        <FieldError>{errors.steps}</FieldError>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                              Expected result
                              {requiredMark}
                            </label>
                            <Textarea
                              value={formData.expected}
                              onChange={handleChange('expected')}
                              placeholder="What you expected"
                              rows={3}
                              disabled={submitting}
                              className={
                                errors.expected
                                  ? 'border-red-500 focus-visible:ring-red-500/30'
                                  : ''
                              }
                            />
                          </div>
                          <FieldError>{errors.expected}</FieldError>
                        </div>
                        <div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                              Actual result
                              {requiredMark}
                            </label>
                            <Textarea
                              value={formData.actual}
                              onChange={handleChange('actual')}
                              placeholder="What happened instead"
                              rows={3}
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
                          label={
                            <>
                              Severity
                              {requiredMark}
                            </>
                          }
                          value={formData.severity}
                          onChange={handleSelect('severity')}
                          options={SUPPORT_SEVERITY_OPTIONS}
                          optionLabels={severityLabels}
                          className="bg-card transition-colors duration-200"
                          labelClassName="text-sm font-medium text-foreground"
                          placeholder="Select severity"
                          error={!!errors.severity}
                        />
                        <FieldError>{errors.severity}</FieldError>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Select
                          label="Device"
                          options={DEVICE_OPTIONS}
                          optionLabels={deviceLabels}
                          value={environmentFields.device}
                          onChange={value =>
                            setEnvironmentFields(prev => ({ ...prev, device: value }))
                          }
                          labelClassName="text-sm font-medium"
                        />
                        <Select
                          label="Operating system"
                          options={OS_OPTIONS}
                          optionLabels={osLabels}
                          value={environmentFields.os}
                          onChange={value => setEnvironmentFields(prev => ({ ...prev, os: value }))}
                          labelClassName="text-sm font-medium"
                        />
                        <Select
                          label="Browser"
                          options={BROWSER_OPTIONS}
                          optionLabels={browserLabels}
                          value={environmentFields.browser}
                          onChange={value =>
                            setEnvironmentFields(prev => ({ ...prev, browser: value }))
                          }
                          labelClassName="text-sm font-medium"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">
                              App version
                            </label>
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label="App version help"
                                    className="grid h-7 w-7 place-items-center rounded-full border border-border/60 bg-card text-primary transition-colors hover:border-primary/60 hover:bg-primary/10"
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="bottom"
                                  align="center"
                                  sideOffset={8}
                                  className="z-[9999] w-[min(280px,80vw)] rounded-xl border border-border bg-card p-3 text-xs leading-relaxed text-foreground shadow-md"
                                >
                                  You can find the app version in the site footer as Personal Hobby
                                  Hub x.x.x.
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
                            placeholder="Build / version"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              ) : null}

              {category === 'feature' ? (
                <>
                  <Separator className="bg-border/50" />

                  <section className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors duration-200">
                    <SectionHeading
                      icon={<Sparkles className="h-4 w-4" />}
                      title="Feature request"
                    />
                    <div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                          Use case
                          {requiredMark}
                        </label>
                        <Textarea
                          value={formData.useCase}
                          onChange={handleChange('useCase')}
                          placeholder="Who needs this and when"
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
                        <label className="text-sm font-medium text-foreground">
                          Value
                          {requiredMark}
                        </label>
                        <Textarea
                          value={formData.value}
                          onChange={handleChange('value')}
                          placeholder="Why this matters"
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
                        label={
                          <>
                            Priority
                            {requiredMark}
                          </>
                        }
                        value={formData.urgency}
                        onChange={handleSelect('urgency')}
                        options={URGENCY_OPTIONS}
                        optionLabels={urgencyLabels}
                        className="bg-card transition-colors duration-200"
                        labelClassName="text-sm font-medium text-foreground"
                        placeholder="Select priority"
                        error={!!errors.urgency}
                      />
                      <FieldError>{errors.urgency}</FieldError>
                    </div>
                  </section>
                </>
              ) : null}

              {category === 'author_rights' ? (
                <>
                  <Separator className="bg-border/50" />

                  <section className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors duration-200">
                    <SectionHeading
                      icon={<ShieldCheck className="h-4 w-4" />}
                      title="Author rights"
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Profile / username"
                        type="text"
                        value={formData.profileLink}
                        onChange={handleChange('profileLink')}
                        placeholder="https://..."
                        labelClassName="text-sm font-medium"
                      />
                      <Input
                        label="Portfolio links"
                        type="text"
                        value={formData.portfolioLinks}
                        onChange={handleChange('portfolioLinks')}
                        placeholder="Comma-separated links"
                        labelClassName="text-sm font-medium"
                      />
                    </div>
                    <div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">
                          Reason for request
                          {requiredMark}
                        </label>
                        <Textarea
                          value={formData.reason}
                          onChange={handleChange('reason')}
                          placeholder="Why do you need author rights"
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
                      <p className="mb-2 text-sm font-medium text-foreground">
                        Requested permissions
                      </p>
                      <p className="mb-3 text-xs text-muted-foreground">
                        You can choose both Author and Reviewer if needed.
                      </p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {PERMISSIONS.map(permission => (
                          <label
                            key={permission}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-card/70 px-3 py-2 text-sm transition-colors duration-200 hover:border-primary/40"
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
                  </section>
                </>
              ) : null}

              {category === 'general' ? (
                <>
                  <Separator className="bg-border/50" />

                  <section className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors duration-200">
                    <SectionHeading
                      icon={<MessageCircle className="h-4 w-4" />}
                      title="General topic"
                    />
                    <Input
                      label="Topic"
                      type="text"
                      value={formData.topic}
                      onChange={handleChange('topic')}
                      placeholder="Partnership, question, feedback"
                      labelClassName="text-sm font-medium"
                    />
                  </section>
                </>
              ) : null}

              <Separator className="bg-border/50" />

              <section className="space-y-3">
                <SectionHeading icon={<AlertTriangle className="h-4 w-4" />} title="Attachments" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Avoid including sensitive personal data in screenshots.</span>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-6 w-6 rounded-full p-0 text-muted-foreground transition-colors duration-200 hover:text-foreground"
                          aria-label="Sensitive data guidance"
                        >
                          <CircleHelp className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[260px] text-xs">
                        Please redact emails, phone numbers, addresses, payment details, and any
                        sensitive identifiers before uploading files.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <AttachmentDropzone
                  items={attachments}
                  onChange={setAttachments}
                  disabled={submitting}
                />
              </section>
            </CardContent>

            <CardFooter className="border-t border-border/50 pt-5">
              <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    Files are stored in private storage and used only for ticket handling.
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card/70 p-3 text-sm transition-colors duration-200 hover:border-primary/40">
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
                        I agree to store the request details
                        {requiredMark}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        We only use this information to process and respond to your request.
                      </span>
                    </span>
                  </label>
                  <FieldError>{errors.consent}</FieldError>

                  <label className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card/70 p-3">
                    <span className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        Allow follow-up email
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Receive updates when there is progress on your ticket.
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

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  className="w-full transition-shadow duration-200 md:w-auto"
                >
                  {submitting ? 'Submitting...' : 'Submit request'}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
