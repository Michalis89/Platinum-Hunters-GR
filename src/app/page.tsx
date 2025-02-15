"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <motion.div
        className="text-center max-w-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {/* Τίτλος με γυαλιστερό εφέ */}
        <motion.h1
          className="text-6xl font-extrabold text-blue-400 drop-shadow-lg relative inline-block"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 2,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{
            backgroundImage: "linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd, #3b82f6)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Platinum Hunters
        </motion.h1>

        {/* Περιγραφή */}
        <motion.p
          className="mt-4 text-lg text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Ανακάλυψε και κατάκτησε το επόμενο Platinum Trophy σου.
        </motion.p>

        {/* Κουμπί έναρξης */}
        <motion.div
          className="relative inline-block mt-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: [
              "0px 0px 10px rgba(59, 130, 246, 0.8)",
              "0px 0px 20px rgba(59, 130, 246, 1)",
              "0px 0px 10px rgba(59, 130, 246, 0.8)",
            ],
          }}
          transition={{
            opacity: { duration: 0.8, ease: "easeOut", delay: 1 },
            scale: { duration: 0.8, ease: "easeOut", delay: 1 },
            boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          }}
          whileHover={{ scale: 1.1 }}
        >
          <Link
            href="/guide"
            className="inline-block px-6 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition"
          >
            Start Hunting 🎮
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
