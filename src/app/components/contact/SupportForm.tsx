'use client';

import { CheckCircle, Lightbulb } from 'lucide-react';

export default function SupportForm() {
  return (
    <div className="mt-4 space-y-6">
      <p className="text-center text-gray-300">
        Αν θέλεις να υποστηρίξεις το project, μπορείς να κάνεις δωρεά μέσω:
      </p>

      <a
        href="https://www.paypal.com/donate"
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        className="block w-full rounded-lg bg-blue-600 p-3 text-center text-lg font-semibold transition hover:bg-blue-700"
      >
        💙 Κάνε μια δωρεά μέσω PayPal
      </a>

      <a
        href="https://www.patreon.com/"
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        className="block w-full rounded-lg bg-red-600 p-3 text-center text-lg font-semibold transition hover:bg-red-700"
      >
        🔥 Γίνε υποστηρικτής στο Patreon
      </a>

      <a
        href="https://www.buymeacoffee.com/"
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        className="block w-full rounded-lg bg-orange-500 p-3 text-center text-lg font-semibold transition hover:bg-orange-600"
      >
        ☕ Buy Me a Coffee
      </a>

      {/* 🔹 Βελτιωμένο Box */}
      <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-5 text-center shadow-md">
        <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-white">
          <Lightbulb className="h-6 w-6 text-yellow-400" />
          Γιατί ζητάμε υποστήριξη;
        </h2>
        <p className="text-sm text-gray-300">
          Κάθε δωρεά συμβάλλει στη διατήρηση του project, καλύπτοντας έξοδα όπως:
        </p>

        <div className="grid grid-cols-1 gap-3 text-sm text-gray-400 md:grid-cols-2">
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
            <p key={index} className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              {item}
            </p>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-gray-400">
        Κάθε συνεισφορά βοηθάει στη βελτίωση του project! 🙏
      </p>
    </div>
  );
}
