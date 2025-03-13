'use client';

import { CheckCircle, Lightbulb } from 'lucide-react';

export default function SupportForm() {
  return (
    <div className="mt-6 w-full max-w-lg space-y-6">
      <p className="text-center text-gray-300">
        Αν θέλεις να υποστηρίξεις το project, μπορείς να κάνεις δωρεά μέσω:
      </p>

      <a
        href="https://www.paypal.com/paypalme/michailMouzakitis"
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        className="block w-full rounded-lg bg-blue-600 p-3 text-center text-lg font-semibold transition hover:bg-blue-700"
      >
        Κάνε μια δωρεά μέσω PayPal
      </a>

      <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-5 shadow-md">
        <div className="flex items-center justify-center gap-1 text-center">
          <Lightbulb className="h-5 w-5 text-yellow-400 md:h-6 md:w-6" />
          <h2 className="text-base leading-tight text-white md:text-xl md:font-bold">
            Γιατί ζητάμε υποστήριξη;
          </h2>
        </div>

        <p className="text-center text-sm text-gray-400">
          Κάθε δωρεά συμβάλλει στη διατήρηση του project, καλύπτοντας έξοδα όπως:
        </p>

        <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
          {[
            'Κόστος Hosting & Domain',
            'Βάση δεδομένων & Αποθήκευση',
            'APIs & Third-party υπηρεσίες',
            'Συντήρηση & Βελτιώσεις',
            'Υποστήριξη νέων λειτουργιών',
            'Εργαλεία ανάπτυξης',
            'Διαχείριση κοινότητας',
            'Διαφημίσεις & Προώθηση',
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400 md:h-5 md:w-5" />
              <span className="text-sm text-gray-300 md:text-base">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 md:text-sm">
        Κάθε συνεισφορά βοηθάει στη βελτίωση του project! 🙏
      </p>
    </div>
  );
}
