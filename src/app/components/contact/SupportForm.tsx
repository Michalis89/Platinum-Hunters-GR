"use client";

export default function SupportForm() {
  return (
    <div className="mt-4 space-y-4">
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
        href="https://ko-fi.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full block text-center p-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-lg font-semibold transition"
      >
        ☕ Υποστήριξέ μας στο Ko-fi
      </a>

      <a
        href="https://www.buymeacoffee.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full block text-center p-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-lg font-semibold transition"
      >
        ☕ Buy Me a Coffee
      </a>

      <div className="bg-gray-800 p-4 rounded-lg shadow-md text-center space-y-2">
        <h2 className="text-lg font-bold text-white">Γιατί ζητάμε υποστήριξη; 💡</h2>
        <p className="text-gray-300 text-sm">
          Κάθε δωρεά συμβάλλει στη διατήρηση του project, καλύπτοντας έξοδα όπως:
        </p>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>✅ Κόστος Hosting & Domain</li>
          <li>✅ Συντήρηση & Βελτιώσεις</li>
          <li>✅ Υποστήριξη νέων λειτουργιών</li>
          <li>✅ Συνεχής ανάπτυξη & βελτιστοποίηση</li>
        </ul>
      </div>

      <p className="text-gray-400 text-sm text-center">
        Κάθε συνεισφορά βοηθάει στη βελτίωση του project! 🙏
      </p>
    </div>
  );
}
