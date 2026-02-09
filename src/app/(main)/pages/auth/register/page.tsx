import { Suspense } from 'react';
import { Sparkles, ListChecks, Trophy, Heart } from 'lucide-react';
import RegisterForm from '@/app/components/auth/RegisterForm';
import { AuthIntroHeading } from '@/app/components/auth/shared/AuthIntroHeading';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Register | Hobbistas',
  description: 'Create your Hobbistas account and organize all your hobbies.',
  path: '/pages/auth/register',
  noindex: true,
});

const highlights = [
  {
    title: 'Unified backlog',
    description: 'Games, anime, movies, TV, and books in one place.',
    icon: ListChecks,
  },
  {
    title: 'Progress and stats',
    description: 'Track hours, episodes, chapters, and pages with clarity.',
    icon: Trophy,
  },
  {
    title: 'Personalized discovery',
    description: 'Find new content based on your interests.',
    icon: Heart,
  },
];

export default function RegisterPage() {
  return (
    <div className="apple-auth-shell min-h-screen text-[var(--apple-label)]">
      <PageWrapper className="py-5 md:py-12">
        <section className="apple-auth-card relative isolate overflow-hidden px-4 py-5 md:px-8 md:py-8">
          <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-[var(--apple-system-blue)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-[var(--apple-system-blue)]/8 blur-3xl" />

          <div className="relative grid items-start gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8">
            <aside className="hidden space-y-6 lg:block">
              <AuthIntroHeading
                variant="desktop"
                eyebrow="Join now"
                title="Start your journey"
                description="One dashboard for all your hobbies, with clean organization and clear progress."
              />

              <div className="apple-auth-section flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--apple-radius-control)] bg-[var(--apple-system-blue)]/12 text-[var(--apple-system-blue)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--apple-label)]">Hobbista Hub</p>
                  <p className="apple-body-tracking text-xs text-[var(--apple-secondary-label)]">
                    Consistent layout, controls, and interactions.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {highlights.map(item => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="apple-auth-section flex gap-3 px-4 py-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-[var(--apple-system-blue)]/12 text-[var(--apple-system-blue)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--apple-label)]">{item.title}</p>
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
                eyebrow="Join now"
                title="Start your journey"
                description="Create your account and organize all your hobbies in one dashboard."
              />

              <Suspense fallback={<div className="h-[min(90vh,820px)] min-h-[700px] w-full" />}>
                <RegisterForm />
              </Suspense>
            </div>
          </div>
        </section>
      </PageWrapper>
    </div>
  );
}
