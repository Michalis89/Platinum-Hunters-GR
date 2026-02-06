'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConfirmEmailPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--hb-bg)]">
      {/* Background Layer με το νέο σου gradient */}
      <div className="absolute inset-0 bg-[image:var(--hb-gradient)] opacity-60" />

      {/* Content Box */}
      <div className="relative z-10 w-full max-w-md px-6 text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Soft Glow Effect */}
            <div className="absolute inset-0 animate-ping rounded-full bg-[var(--hb-primary)] opacity-20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-xl">
              <CheckCircle2 className="h-10 w-10 text-[var(--hb-primary)]" />
            </div>
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-black tracking-tight text-[var(--hb-headline)]">
          Το email σου επιβεβαιώθηκε!
        </h1>

        <p className="mb-10 text-lg text-[var(--hb-muted)]">
          Καλώς ήρθες στην παρέα μας. Ο λογαριασμός σου είναι πλέον ενεργός και έτοιμος για χρήση.
        </p>

        <div className="flex flex-col gap-4">
          <Link href="/pages/auth/login" passHref>
            <Button variant={'primary'} size={'xl'}>
              <span className="flex items-center justify-center gap-2">
                Σύνδεση στο Hobbistas
                <ArrowRight className="h-5 w-5" />
              </span>
            </Button>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-[var(--hb-muted)] transition-colors hover:text-[var(--hb-text)]"
          >
            Επιστροφή στην Αρχική
          </Link>
        </div>
      </div>
    </div>
  );
}
