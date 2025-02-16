"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, AlertTriangle } from "lucide-react";

interface AlertProps {
  readonly type: "success" | "error";
  readonly message: string;
  readonly duration?: number;
}

export default function AlertMessage({ type, message, duration = 4000 }: Readonly<AlertProps>) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-20 inset-x-0 mx-auto w-auto max-w-[500px] px-6 py-4 rounded-lg shadow-lg flex items-center justify-between gap-3 text-white text-lg z-50 ${
            type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {type === "success" ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            <span>{message}</span>
          </div>
          <button onClick={() => setVisible(false)} className="focus:outline-none">
            <X size={20} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
