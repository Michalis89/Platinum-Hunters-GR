'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import VersionBadge from './components/ui/VersionBadge';
import { Gamepad2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <motion.div
        className="max-w-2xl text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <motion.h1 className="animate-gradient bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-6xl font-extrabold text-transparent drop-shadow-lg">
          Platinum Hunters
        </motion.h1>

        <motion.p
          className="mt-4 text-lg text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Ανακάλυψε και κατάκτησε το επόμενο Platinum Trophy σου.
        </motion.p>

        <motion.div
          className="relative mt-6 inline-block overflow-hidden rounded-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: [
              '0px 0px 10px rgba(59, 130, 246, 0.8)',
              '0px 0px 20px rgba(59, 130, 246, 1)',
              '0px 0px 10px rgba(59, 130, 246, 0.8)',
            ],
          }}
          transition={{
            opacity: { duration: 0.8, ease: 'easeOut', delay: 1 },
            scale: { duration: 0.8, ease: 'easeOut', delay: 1 },
            boxShadow: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          whileHover={{ scale: 1.1 }}
        >
          <Link
            href="/pages/guides"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold shadow-lg transition hover:bg-blue-700"
          >
            Ξεκίνα το κυνήγι <Gamepad2 />
          </Link>
        </motion.div>
      </motion.div>
      <VersionBadge />
    </div>
  );
}
