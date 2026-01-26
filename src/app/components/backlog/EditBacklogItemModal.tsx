'use client';

/**
 * Edit Backlog Item Modal
 * PH-31: User Backlog System
 */

import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Signal, Heart, Gamepad, Target, Gauge, Trophy, Check, StickyNote } from 'lucide-react';
import type { UserBacklogWithGame } from '@/types/interfaces';
import type { AppDispatch } from '@/store/store';
import { updateBacklogItem } from '@/store/slices/backlogSlice';

interface EditBacklogItemModalProps {
  item: UserBacklogWithGame;
  onClose: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 0, label: 'None', color: 'bg-slate-700 hover:bg-slate-600', icon: '⚪' },
  { value: 1, label: 'Low', color: 'bg-green-700 hover:bg-green-600', icon: '🟢' },
  { value: 2, label: 'Medium', color: 'bg-yellow-700 hover:bg-yellow-600', icon: '🟡' },
  { value: 3, label: 'High', color: 'bg-red-700 hover:bg-red-600', icon: '🔴' },
];

export default function EditBacklogItemModal({ item, onClose }: EditBacklogItemModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [priority, setPriority] = useState(item.priority);
  const [notes, setNotes] = useState(item.notes || '');
  const [status, setStatus] = useState<
    'to_play' | 'playing' | 'completed' | 'platinumed' | 'dropped'
  >(item.status);
  const clampRating = (value: number) => Math.min(5, Math.max(1, value));
  const [personalRating, setPersonalRating] = useState<number | null>(
    item.personal_rating ? clampRating(item.personal_rating) : null,
  );
  const [personalDifficulty, setPersonalDifficulty] = useState<number | null>(
    item.personal_difficulty ?? null,
  );
  const [isFavorite, setIsFavorite] = useState<boolean>(item.is_favorite ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => [
      { value: 'to_play', label: 'Backlog', icon: <Gamepad className="h-4 w-4" /> },
      { value: 'playing', label: 'Παίζω', icon: <Target className="h-4 w-4" /> },
      { value: 'completed', label: 'Ολοκληρώθηκε', icon: <Check className="h-4 w-4" /> },
      { value: 'platinumed', label: 'Πλατίνα', icon: <Trophy className="h-4 w-4" /> },
      { value: 'dropped', label: 'Παρατημένο', icon: <X className="h-4 w-4" /> },
    ],
    [],
  );

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await dispatch(
        updateBacklogItem({
          id: item.id,
          status,
          priority,
          notes: notes.trim() || null,
          personal_rating: personalRating ? clampRating(personalRating) : null,
          personal_difficulty: personalDifficulty,
          is_favorite: isFavorite,
        }),
      ).unwrap();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Σφάλμα ενημέρωσης');
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
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Επεξεργασία</h2>
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
          <div className="space-y-6 p-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-950 border border-red-800 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Status & Priority */}
            <div className="space-y-3 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Signal className="h-4 w-4 text-sky-300" />
                Κατάσταση & Προτεραιότητα
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Κατάσταση</p>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setStatus(option.value as typeof status)
                        }
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          status === option.value
                            ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]'
                            : 'border-slate-800 bg-slate-900/50 text-slate-200 hover:border-slate-700 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {option.icon}
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400">Προτεραιότητα</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PRIORITY_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setPriority(option.value)}
                        className={`flex flex-col items-center gap-2 rounded-lg p-3 text-sm font-medium text-white transition ${
                          priority === option.value
                            ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900'
                            : ''
                        } ${option.color}`}
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty & Rating */}
            <div className="space-y-3 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Gauge className="h-4 w-4 text-amber-300" />
                Δυσκολία & Βαθμολογία (προσωπικά)
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Προσωπική δυσκολία</span>
                    <span className="text-slate-200">{personalDifficulty ?? '—'}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={personalDifficulty ?? 5}
                    onChange={e => setPersonalDifficulty(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Προσωπική βαθμολογία</span>
                    <span className="text-slate-200">{personalRating ?? '—'}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={personalRating ?? 3}
                    onChange={e => setPersonalRating(clampRating(Number(e.target.value)))}
                    className="w-full accent-emerald-400"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>1</span>
                    <span>3</span>
                    <span>5</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFavorite(prev => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    isFavorite
                      ? 'border-pink-400/70 bg-pink-500/10 text-pink-100 shadow-[0_0_0_1px_rgba(244,114,182,0.35)]'
                      : 'border-slate-800 bg-slate-900/60 text-slate-200 hover:border-pink-300/60 hover:text-white'
                  }`}
                >
                  <Heart className="h-4 w-4" />
                  {isFavorite ? 'Favorite' : 'Κάντο favorite'}
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-300">
                <StickyNote className="h-4 w-4 text-blue-300" />
                Σημειώσεις
                <span className="ml-2 text-xs text-slate-500">(προαιρετικό)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Προσθήκη σημειώσεων για αυτό το παιχνίδι..."
                rows={4}
                maxLength={500}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-200 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="mt-1 text-right text-xs text-slate-500">
                {notes.length}/500
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-slate-800 p-6">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
            >
              Άκυρο
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {isSaving ? (
                <>Αποθήκευση...</>
              ) : (
                <>
                  <Save size={18} />
                  Αποθήκευση
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
