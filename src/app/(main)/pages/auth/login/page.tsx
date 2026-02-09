import { Suspense } from 'react';
import { Sparkles, ListChecks, Clock3, ShieldCheck } from 'lucide-react';
import LoginForm from '@/app/components/auth/LoginForm';
import { AuthIntroHeading } from '@/app/components/auth/shared/AuthIntroHeading';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Login | Hobbistas',
  description: 'Sign in to Hobbistas and keep all your hobbies organized in one place.',
  path: '/pages/auth/login',
  noindex: true,
});

const highlights = [
  {
    title: 'Your progress is waiting',
    description: 'Backlogs, lists, and updates in one clean dashboard.',
    icon: ListChecks,
  },
  {
    title: 'Instant continuity',
    description: 'Pick up exactly where you left off, without losing context.',
    icon: Clock3,
  },
  {
    title: 'Secure access',
    description: 'Protected with CAPTCHA and a safe login flow.',
    icon: ShieldCheck,
  },
];

export default function LoginPage() {
  return (
    <div className="apple-auth-shell min-h-screen text-[var(--apple-label)]">
      <PageWrapper className="py-5 md:py-12">
        <section className="apple-auth-card relative isolate overflow-hidden px-4 py-5 md:px-8 md:py-8">
          <div className="bg-[var(--apple-system-blue)]/10 pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full blur-3xl" />
          <div className="bg-[var(--apple-system-blue)]/8 pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full blur-3xl" />

          <div className="relative grid items-start gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8">
            <aside className="hidden space-y-6 lg:block">
              <AuthIntroHeading
                variant="desktop"
                eyebrow="Welcome back"
                title="Continue your journey"
                description="Pick up where you left off. Everything in one place with a single sign-in."
              />

              <div className="apple-auth-section flex items-center gap-3 px-4 py-3">
                <div className="bg-[var(--apple-system-blue)]/12 flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius-control)] text-[var(--apple-system-blue)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--apple-label)]">Hobbista Hub</p>
                  <p className="apple-body-tracking text-xs text-[var(--apple-secondary-label)]">
                    Stable, clean, and consistent workspace.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {highlights.map(item => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="apple-auth-section flex gap-3 px-4 py-3">
                      <div className="bg-[var(--apple-system-blue)]/12 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-[var(--apple-system-blue)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--apple-label)]">
                          {item.title}
                        </p>
                        <p className="apple-body-tracking text-sm text-[var(--apple-secondary-label)]">
                          {item.description}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </aside>

            <div className="space-y-4">
              <AuthIntroHeading
                variant="mobile"
                eyebrow="Welcome back"
                title="Continue your journey"
                description="Sign in to continue with your hobbies and backlogs."
              />

              <Suspense fallback={<div className="h-[560px] w-full" />}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </section>
      </PageWrapper>
    </div>
  );
}
