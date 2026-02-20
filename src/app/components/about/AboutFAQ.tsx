'use client';

import { ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type FAQItem = {
  question: string;
  answer: string;
};

const faqItems: FAQItem[] = [
  {
    question: 'Is Hobbistas free?',
    answer:
      'Yes, the core features are completely free. Backlog, progress tracking, notes, and access to all articles and reviews cost nothing. We may add premium features for advanced users in the future.',
  },
  {
    question: 'Which hobby categories are supported?',
    answer:
      'We currently support Games, Anime, Manga, Movies, Series/TV Shows, and Books. Each category has its own metadata and progress fields.',
  },
  {
    question: 'Can I import my backlog from other services?',
    answer:
      'We are working on integrations with popular services like IGDB, TMDB, and MyAnimeList. For now, you can add entries manually using quick add.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'Yes. Data is stored on a trusted cloud infrastructure and is only accessible through your account. We do not sell personal data. You can export or delete your information at any time.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'Not yet, but it is on the roadmap. The web app is fully responsive and works smoothly in mobile browsers.',
  },
  {
    question: 'How can I contribute or suggest features?',
    answer:
      'Send a feature request or bug report using the contact form. If you can, share 2–3 sentences describing the issue or idea, how you imagine it working, and ideally a screenshot. We read everything and queue items by priority.',
  },
];

export function AboutFAQ() {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-primary">FAQ</p>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Answers to the most common questions about Hobbista.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqItems.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-xl border border-border bg-card px-0 transition-colors hover:border-primary/30"
            >
              <AccordionTrigger className="px-5 py-5 text-left no-underline hover:no-underline [&>svg]:hidden">
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="font-medium text-foreground">{item.question}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 pt-0 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
