import Link from 'next/link';
import { ArrowRight, CheckCircle2, CircleAlert, MailCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import SuccessAutoRedirect from './SuccessAutoRedirect';

type ConfirmEmailPageProps = {
  searchParams?: Promise<{
    state?: string;
    error?: string;
    error_description?: string;
  }>;
};

export default async function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
  const params = await searchParams;
  const state = params?.state;
  const hasVerificationError = Boolean(params?.error || params?.error_description);

  const variant = hasVerificationError ? 'error' : state === 'pending' ? 'pending' : 'success';

  const config =
    variant === 'pending'
      ? {
          title: 'Check your email',
          description:
            'We sent you a confirmation link. Open your inbox and click "Confirm Account" to activate your account.',
          alertTitle: 'Verification pending',
          alertDescription:
            'If you do not see the email, check your spam folder and try the registration flow again.',
          ctaHref: '/pages/auth/login',
          ctaLabel: 'Go to sign in',
          Icon: MailCheck,
        }
      : variant === 'error'
        ? {
            title: 'Verification failed',
            description:
              'The verification link is invalid or expired. Repeat signup to get a fresh confirmation email.',
            alertTitle: 'Link issue detected',
            alertDescription: 'If this keeps happening, request a new account confirmation email.',
            ctaHref: '/pages/auth/register',
            ctaLabel: 'Back to register',
            Icon: CircleAlert,
          }
        : {
            title: "You're verified",
            description: 'Your email is confirmed and your account is ready. Sign in to continue.',
            alertTitle: 'Confirmation complete',
            alertDescription: 'You can now access all account features.',
            ctaHref: '/pages/auth/login',
            ctaLabel: 'Continue to sign in',
            Icon: CheckCircle2,
          };

  const Icon = config.Icon;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--hb-bg)] px-6 py-16">
      <div className="absolute inset-0 bg-[image:var(--hb-gradient)] opacity-60" />

      <section aria-live="polite" aria-atomic="true" className="relative z-10 w-full max-w-md">
        <Card className="border-[var(--hb-border)] bg-[var(--hb-panel)]/95 shadow-xl backdrop-blur">
          <CardHeader className="space-y-4 pb-2 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-[var(--hb-primary)] opacity-20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-xl">
                  <Icon className="h-10 w-10 text-[var(--hb-primary)]" />
                </div>
              </div>
            </div>

            <CardTitle className="text-3xl font-black tracking-tight text-[var(--hb-headline)]">
              {config.title}
            </CardTitle>

            <CardDescription className="mx-auto max-w-[32ch] text-base leading-relaxed text-[var(--hb-muted)]">
              {config.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            <Alert className="border-[var(--hb-border)] bg-[var(--hb-bg)]/70 text-[var(--hb-text)]">
              <Icon className="h-4 w-4 text-[var(--hb-primary)]" />
              <AlertTitle>{config.alertTitle}</AlertTitle>
              <AlertDescription>{config.alertDescription}</AlertDescription>
            </Alert>

            <Separator className="bg-[var(--hb-border)]/70" />

            <Button asChild variant="primary" size="xl">
              <Link href={config.ctaHref} aria-label={config.ctaLabel}>
                <span className="flex items-center justify-center gap-2">
                  {config.ctaLabel}
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
            </Button>

            {variant === 'success' ? <SuccessAutoRedirect seconds={6} /> : null}

            <div className="text-center">
              <Link
                href="/"
                className="text-sm font-medium text-[var(--hb-muted)] underline-offset-4 transition-colors hover:text-[var(--hb-text)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hb-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hb-panel)]"
              >
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
