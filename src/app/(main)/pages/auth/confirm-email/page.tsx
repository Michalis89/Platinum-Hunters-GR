'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ConfirmEmailPage() {
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
                  <CheckCircle2 className="h-10 w-10 text-[var(--hb-primary)]" />
                </div>
              </div>
            </div>

            <CardTitle className="text-3xl font-black tracking-tight text-[var(--hb-headline)]">
              You&apos;re verified
            </CardTitle>

            <CardDescription className="mx-auto max-w-[32ch] text-base leading-relaxed text-[var(--hb-muted)]">
              Your email is confirmed and your account is ready. Sign in to continue.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            <Alert className="border-[var(--hb-border)] bg-[var(--hb-bg)]/70 text-[var(--hb-text)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--hb-primary)]" />
              <AlertTitle>Confirmation complete</AlertTitle>
              <AlertDescription>You can now access all account features.</AlertDescription>
            </Alert>

            <Separator className="bg-[var(--hb-border)]/70" />

            <Button asChild variant="primary" size="xl">
              <Link href="/pages/auth/login" aria-label="Continue to sign in">
                <span className="flex items-center justify-center gap-2">
                  Continue to sign in
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
            </Button>

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