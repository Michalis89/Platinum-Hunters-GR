import { Suspense } from 'react';
import { Sparkles, ListChecks, Trophy, Heart } from 'lucide-react';
import RegisterForm from '@/app/components/auth/RegisterForm';
import { AuthIntroHeading } from '@/app/components/auth/shared/AuthIntroHeading';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { buildMetadata } from '@/utils/seo/metadata/helpers';

export const metadata = buildMetadata({
  title: 'Register | Hobbistas',
  description: 'Create your Hobbistas account and organize all your hobbies.',
  path: '/auth/register',
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
    <div className="min-h-screen text-foreground">
      <PageWrapper>
        <section className="relative isolate px-4 py-5 md:px-8 md:py-8">
          <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-background blur-3xl" />
          <div className="bg-primary/8 pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full blur-3xl" />

          <div>
            <aside>
              <AuthIntroHeading
                variant="desktop"
                eyebrow="Join now"
                title="Start your journey"
                description="One dashboard for all your hobbies, with clean organization and clear progress."
              />

              <div className="flex items-center gap-3 px-4 py-3">
                <div className="bg-primary/12 flex h-10 w-10 items-center justify-center text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p>Hobbista Hub</p>
                  <p className="text-xs text-muted-foreground">
                    Consistent layout, controls, and interactions.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {highlights.map(item => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="flex gap-3 px-4 py-3">
                      <div className="bg-primary/12 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p>{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
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
