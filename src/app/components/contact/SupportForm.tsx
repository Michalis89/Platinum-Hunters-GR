"use client";

import { CheckCircle, Lightbulb } from "lucide-react";

export default function SupportForm() {
  return (
    <div className="mt-4 space-y-6">
      <p className="text-gray-300 text-center">
        Αν θέλεις να υποστηρίξεις το project, μπορείς να κάνεις δωρεά μέσω:
      </p>

      <a
        href="https://www.paypal.com/donate"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full block text-center p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition"
      >
        💙 Κάνε μια δωρεά μέσω PayPal
      </a>

      <a
        href="https://www.patreon.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full block text-center p-3 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-semibold transition"
      >
        🔥 Γίνε υποστηρικτής στο Patreon
      </a>

      <a
        href="https://www.buymeacoffee.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full block text-center p-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-lg font-semibold transition"
      >
        ☕ Buy Me a Coffee
      </a>

      {/* 🔹 Βελτιωμένο Box */}
      <div className="bg-gray-800 p-5 rounded-lg shadow-md text-center space-y-4 border border-gray-700">
        <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          Γιατί ζητάμε υποστήριξη;
        </h2>
        <p className="text-gray-300 text-sm">
          Κάθε δωρεά συμβάλλει στη διατήρηση του project, καλύπτοντας έξοδα όπως:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-400 text-sm">
          <p className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Κόστος Hosting & Domain
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Βάση δεδομένων & Αποθήκευση
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            APIs & Third-party υπηρεσίες
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Συντήρηση & Βελτιώσεις
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Υποστήριξη νέων λειτουργιών
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Εργαλεία ανάπτυξης
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Διαχείριση κοινότητας
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Διαφημίσεις & Προώθηση
          </p>
        </div>
      </div>

      <p className="text-gray-400 text-sm text-center">
        Κάθε συνεισφορά βοηθάει στη βελτίωση του project! 🙏
      </p>
    </div>
  );
}
