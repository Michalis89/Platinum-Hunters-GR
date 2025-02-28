'use client';

import { useEffect, useState } from 'react';
import { Loader2, Hammer, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function UnderConstruction() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/');
    }
  }, [countdown, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-center text-white">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-lg rounded-2xl bg-gray-800 p-8 shadow-lg"
      >
        <Hammer className="mx-auto h-16 w-16 animate-bounce text-yellow-400" />
        <h1 className="mt-4 text-3xl font-extrabold text-yellow-400">Under Construction</h1>
        <p className="mt-2 text-gray-300">
          Αυτή η σελίδα βρίσκεται υπό κατασκευή. Παρακαλώ επιστρέψτε αργότερα!
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 text-lg text-gray-400"
        >
          Αυτόματη ανακατεύθυνση σε <span className="text-yellow-400">{countdown}</span>{' '}
          δευτερόλεπτα...
        </motion.div>

        <motion.div className="mt-6 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-600"
          >
            <ArrowRight className="h-5 w-5" />
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
        <Loader2 className="mr-2 inline-block h-5 w-5 animate-spin" />
        Ανυπομονείτε; Μπορείτε να εξερευνήσετε το site μας!
      </motion.div>
    </div>
  );
}
