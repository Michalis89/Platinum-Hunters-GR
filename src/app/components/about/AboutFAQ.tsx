'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FAQItem = {
  question: string;
  answer: string;
};

const faqItems: FAQItem[] = [
  {
    question: 'Είναι δωρεάν ο Hobbistas;',
    answer:
      'Ναι, η βασική λειτουργικότητα είναι εντελώς δωρεάν. Backlog, progress tracking, notes, και πρόσβαση σε όλα τα άρθρα και reviews χωρίς κόστος. Μελλοντικά μπορεί να προστεθούν premium features για advanced χρήστες.',
  },
  {
    question: 'Ποιες κατηγορίες hobbies υποστηρίζονται;',
    answer:
      'Αυτή τη στιγμή υποστηρίζουμε: Games, Anime, Manga, Ταινίες, Σειρές/TV Shows, και Βιβλία. Κάθε κατηγορία έχει τα δικά της metadata και πεδία πρόοδού.',
  },
  {
    question: 'Μπορώ να κάνω import το backlog μου από άλλες υπηρεσίες;',
    answer:
      'Δουλεύουμε σε integrations με δημοφιλείς υπηρεσίες όπως IGDB, TMDB, και MyAnimeList. Για τώρα, μπορείς να προσθέσεις entries χειροκίνητα με quick add.',
  },
  {
    question: 'Τα δεδομένα μου είναι ασφαλή;',
    answer:
      'Τα δεδομένα αποθηκεύονται με ασφάλεια στο cloud. Δεν πουλάμε ή μοιραζόμαστε προσωπικές πληροφορίες. Μπορείς να εξάγεις ή να διαγράψεις τα δεδομένα σου οποτεδήποτε.',
  },
  {
    question: 'Υπάρχει mobile app;',
    answer:
      'Όχι ακόμα, αλλά είναι στο roadmap. Η web εφαρμογή είναι πλήρως responsive και λειτουργεί άψογα σε mobile browsers.',
  },
  {
    question: 'Πώς μπορώ να συνεισφέρω ή να προτείνω features;',
    answer:
      'Χρησιμοποίησε τη φόρμα επικοινωνίας για feature requests ή bug reports. Εκτιμούμε κάθε πρόταση και προσπαθούμε να ανταποκριθούμε στις ανάγκες της κοινότητας.',
  },
];

export function AboutFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            FAQ
          </p>
          <h2 className="mb-4 text-3xl font-bold text-[var(--hb-headline)] md:text-4xl">
            Συχνές ερωτήσεις
          </h2>
          <p className="mx-auto max-w-xl text-[var(--hb-muted)]">
            Απαντήσεις στα πιο συνηθισμένα ερωτήματα για τον Χομπίστα.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="hover:border-[var(--hb-primary-strong)]/30 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-panel)] transition-colors"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-[var(--hb-headline)]">{item.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[var(--hb-muted)] transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-200 ease-in-out ${
                  openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--hb-muted)]">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
