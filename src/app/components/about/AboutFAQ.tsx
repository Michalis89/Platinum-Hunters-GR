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
      'Yes. Tracking, backlog management, progress, ratings, and personal statistics are all completely free. There is no trial period and no credit card required.',
  },
  {
    question: 'Which hobby categories are supported?',
    answer:
      'Games, Anime, Manga, Movies, TV Shows, and Books — each with its own metadata and progress fields. More categories are planned.',
  },
  {
    question: 'Can I import my backlog from other services?',
    answer:
      'Steam import is fully supported — connect your account and your game library with playtime appears instantly. We are also working on MyAnimeList import for anime and manga.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'Yes. Your data is stored securely and is only accessible through your account. We do not sell personal data. Your diary entries are encrypted locally on your device — we never see their contents.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'Hobbistas is a Progressive Web App (PWA). You can install it on your phone or desktop from your browser and it works offline. No app store required.',
  },
  {
    question: 'How can I suggest a feature or report a bug?',
    answer:
      'Use the Support page to send a request or report. Describe what you expected, what happened instead, and a screenshot if possible. Everything is read and prioritized.',
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
