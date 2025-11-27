'use client';

/**
 * Hours Input Modal
 * PH-31: User Games Library System
 * Modal for inputting actual hours played (casual and platinum)
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trophy } from 'lucide-react';
import type { UserBacklogWithGame } from '@/types/interfaces';
import type { AppDispatch } from '@/store/store';
import { updateBacklogItem } from '@/store/slices/backlogSlice';

interface HoursInputModalProps {
  item: UserBacklogWithGame;
  onClose: () => void;
}

export default function HoursInputModal({ item, onClose }: HoursInputModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [casualHours, setCasualHours] = useState<string>(
    item.actual_hours_casual?.toString() || ''
  );
  const [platinumHours, setPlatinumHours] = useState<string>(
    item.actual_hours_platinum?.toString() || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const casual = casualHours ? parseFloat(casualHours) : null;
      const platinum = platinumHours ? parseFloat(platinumHours) : null;

      // Validation
      if (casual !== null && (isNaN(casual) || casual < 0)) {
        throw new Error('Οι ώρες casual πρέπει να είναι θετικός αριθμός');
      }
      if (platinum !== null && (isNaN(platinum) || platinum < 0)) {
        throw new Error('Οι ώρες platinum πρέπει να είναι θετικός αριθμός');
      }

      await dispatch(
        updateBacklogItem({
          id: item.id,
          actual_hours_casual: casual,
          actual_hours_platinum: platinum,
        })
      ).unwrap();

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα αποθήκευσης');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Καταγραφή Ωρών</h2>
              <p className="mt-1 text-sm text-slate-400">{item.game.title}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-800 bg-red-950 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Casual Hours Input */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Clock size={16} className="text-blue-400" />
                Ώρες Casual Gaming
              </label>
              <p className="mb-3 text-xs text-slate-500">
                Πόσες ώρες έπαιξες το παιχνίδι χαλαρά, χωρίς να κυνηγάς το platinum;
              </p>
              <input
                type="number"
                value={casualHours}
                onChange={e => setCasualHours(e.target.value)}
                placeholder="π.χ. 25.5"
                step="0.5"
                min="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Platinum Hours Input */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Trophy size={16} className="text-yellow-400" />
                Ώρες για Platinum
              </label>
              <p className="mb-3 text-xs text-slate-500">
                Πόσες επιπλέον ώρες χρειάστηκες για να πάρεις το platinum trophy;
              </p>
              <input
                type="number"
                value={platinumHours}
                onChange={e => setPlatinumHours(e.target.value)}
                placeholder="π.χ. 15"
                step="0.5"
                min="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Total Hours Display */}
            {(casualHours || platinumHours) && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Σύνολο Ωρών:</span>
                  <span className="text-lg font-semibold text-blue-400">
                    {(parseFloat(casualHours || '0') + parseFloat(platinumHours || '0')).toFixed(1)}h
                  </span>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-lg bg-blue-950/30 border border-blue-900/50 p-3 text-xs text-blue-300">
              💡 <strong>Tip:</strong> Μπορείς να αφήσεις κενό οποιοδήποτε πεδίο. Χρήσιμο για να
              συγκρίνεις τις πραγματικές ώρες με τον μέσο όρο του site!
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 border-t border-slate-800 p-6">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
            >
              Άκυρο
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
