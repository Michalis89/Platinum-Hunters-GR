"use client";

import { useEffect, useState } from "react";
import { Loader2, Hammer, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function UnderConstruction() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10); // Timer για redirect

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push("/"); // Redirect στο homepage ή σε άλλη σελίδα
    }
  }, [countdown, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-gray-800 p-8 rounded-2xl shadow-lg max-w-lg"
      >
        <Hammer className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
        <h1 className="text-3xl font-extrabold text-yellow-400 mt-4">Under Construction</h1>
        <p className="text-gray-300 mt-2">
          Αυτή η σελίδα βρίσκεται υπό κατασκευή. Παρακαλώ επιστρέψτε αργότερα!
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 text-lg text-gray-400"
        >
          Αυτόματη ανακατεύθυνση σε <span className="text-yellow-400">{countdown}</span>{" "}
          δευτερόλεπτα...
        </motion.div>

        <motion.div className="flex justify-center mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg flex items-center space-x-2 transition"
          >
            <ArrowRight className="w-5 h-5" />
            <span>Επιστροφή στην Αρχική</span>
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-6 text-gray-400"
      >
        <Loader2 className="inline-block w-5 h-5 animate-spin mr-2" />
        Ανυπομονείτε; Μπορείτε να εξερευνήσετε το site μας!
      </motion.div>
    </div>
  );
}
