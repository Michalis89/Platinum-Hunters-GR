'use client';

/**
 * Backlog Item Component
 * PH-31: User Backlog System
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Clock,
  Edit,
  Trash2,
  StickyNote,
  ExternalLink,
  Calendar,
  Signal,
} from 'lucide-react';
import type { UserBacklogWithGame } from '@/types/interfaces';
import type { AppDispatch } from '@/store/store';
import { removeFromBacklog, updateBacklogItem } from '@/store/slices/backlogSlice';
import EditBacklogItemModal from './EditBacklogItemModal';
import HoursInputModal from './HoursInputModal';

interface BacklogItemProps {
  readonly item: UserBacklogWithGame;
}

// Priority badge mapping
const PRIORITY_CONFIG = {
  0: { label: 'None', color: 'text-slate-400 bg-slate-800', icon: '⚪' },
  1: { label: 'Low', color: 'text-green-400 bg-green-950', icon: '🟢' },
  2: { label: 'Medium', color: 'text-yellow-400 bg-yellow-950', icon: '🟡' },
  3: { label: 'High', color: 'text-red-400 bg-red-950', icon: '🔴' },
};

// Status badge mapping
const STATUS_CONFIG = {
  to_play: {
    label: 'Backlog',
    color: 'text-blue-300 bg-blue-950/40 border-blue-700 shadow-[0_0_6px_rgba(59,130,246,0.25)]',
  },

  playing: {
    label: 'Παίζω',
    color: 'text-green-300 bg-green-950/40 border-green-700 shadow-[0_0_6px_rgba(34,197,94,0.25)]',
  },

  completed: {
    label: 'Ολοκληρώθηκε',
    color:
      'text-purple-300 bg-purple-950/40 border-purple-700 shadow-[0_0_6px_rgba(168,85,247,0.25)]',
  },

  platinumed: {
    label: 'Πλατίνα',
    color:
      'text-slate-200 bg-slate-900/40 border-slate-600 shadow-[0_0_8px_rgba(180,200,255,0.35)]',
  },

  dropped: {
    label: 'Παρατημένο',
    color: 'text-red-300 bg-red-950/40 border-red-700 shadow-[0_0_6px_rgba(220,38,38,0.25)]',
  },
} as const;

export default function BacklogItem({ item }: BacklogItemProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const game = item.game;
  const priorityConfig =
    PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[0];
  const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(removeFromBacklog(item.id)).unwrap();
    } catch (error) {
      console.error('Error removing from backlog:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusChange = async (
    newStatus: 'to_play' | 'playing' | 'completed' | 'platinumed' | 'dropped',
  ) => {
    setIsUpdatingStatus(true);
    try {
      await dispatch(updateBacklogItem({ id: item.id, status: newStatus })).unwrap();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('el-GR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <motion.div
        layout
        className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-blue-500/10"
      >
        {/* Cover Image */}
        <Link
          href={`/pages/guides/${game.slug}`}
          className="relative block aspect-video overflow-hidden"
        >
          {game.cover_image ? (
            <Image
              src={game.cover_image}
              alt={game.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-800">
              <Trophy className="h-12 w-12 text-slate-600" />
            </div>
          )}

          {/* Priority Badge (Top Left) */}
          <div className="absolute left-2 top-2">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${priorityConfig.color}`}
            >
              <Signal size={12} />
              {priorityConfig.label}
            </div>
          </div>

          {/* Status Badge (Top Right) */}
          <div className="absolute right-2 top-2">
            <div
              className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${statusConfig.color}`}
            >
              {statusConfig.label}
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

          {/* View Guide Link */}
          <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-lg">
              <ExternalLink size={12} />
              Δες Οδηγό
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <Link href={`/pages/guides/${game.slug}`}>
            <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-slate-100 transition-colors hover:text-blue-400">
              {game.title}
            </h3>
          </Link>

          {/* Stats */}
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            {game.average_hours && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>~{Math.round(game.average_hours)}h</span>
              </div>
            )}

            {game.trophy_total > 0 && (
              <div className="flex items-center gap-1.5">
                <Trophy size={14} />
                <span className="flex gap-1">
                  <span className="text-yellow-400">{game.trophy_platinum}</span>
                  <span className="text-yellow-600">{game.trophy_gold}</span>
                  <span className="text-slate-400">{game.trophy_silver}</span>
                  <span className="text-amber-700">{game.trophy_bronze}</span>
                </span>
              </div>
            )}

            {game.average_difficulty && (
              <div className="flex items-center gap-1.5">
                <Signal size={14} />
                <span>{game.average_difficulty.toFixed(1)}/10</span>
              </div>
            )}
          </div>

          {/* Actual Hours Display */}
          {(item.actual_hours_casual || item.actual_hours_platinum) && (
            <div className="mb-3 rounded-lg border border-blue-800 bg-blue-950/30 px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-300">Οι δικές σου ώρες:</span>
                <div className="flex items-center gap-2 font-medium text-blue-400">
                  {item.actual_hours_casual && <span>🎮 {item.actual_hours_casual}h</span>}
                  {item.actual_hours_platinum && <span>🏆 {item.actual_hours_platinum}h</span>}
                </div>
              </div>
            </div>
          )}

          {/* Personal Notes */}
          {item.notes && (
            <div className="mb-3 rounded-lg bg-slate-800/50 p-2.5">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <StickyNote size={12} />
                Σημειώσεις
              </div>
              <p className="line-clamp-2 text-sm text-slate-300">{item.notes}</p>
            </div>
          )}

          {/* Added Date */}
          <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={12} />
            Προστέθηκε: {formatDate(item.added_at)}
          </div>

          {/* Status Transition Buttons */}
          <div className="mb-3 flex flex-wrap gap-2">
            {item.status === 'to_play' && (
              <>
                <button
                  onClick={() => handleStatusChange('playing')}
                  disabled={isUpdatingStatus}
                  className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
                >
                  ▶ Ξεκίνα
                </button>
                <button
                  onClick={() => handleStatusChange('dropped')}
                  disabled={isUpdatingStatus}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Εγκατάλειψε
                </button>
              </>
            )}
            {item.status === 'playing' && (
              <>
                <button
                  onClick={() => handleStatusChange('completed')}
                  disabled={isUpdatingStatus}
                  className="flex-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
                >
                  ✓ Ολοκλήρωσε
                </button>
                <button
                  onClick={() => handleStatusChange('platinumed')}
                  disabled={isUpdatingStatus}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-slate-100 to-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-[0_0_12px_rgba(180,200,255,0.35)] transition-all duration-300 hover:shadow-[0_0_16px_rgba(190,210,255,0.55)] active:scale-[0.97] disabled:opacity-50"
                >
                  <Trophy className="h-4 w-4 text-blue-500" />
                  Πλατίνα!
                </button>

                <button
                  onClick={() => handleStatusChange('dropped')}
                  disabled={isUpdatingStatus}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Εγκατάλειψε
                </button>
              </>
            )}
            {item.status === 'completed' && (
              <>
                <button
                  onClick={() => handleStatusChange('platinumed')}
                  disabled={isUpdatingStatus}
                  className="flex-1 rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-yellow-500 disabled:opacity-50"
                >
                  🏆 Πήρα Πλατίνα!
                </button>
                <button
                  onClick={() => handleStatusChange('to_play')}
                  disabled={isUpdatingStatus}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  ← Backlog
                </button>
              </>
            )}
            {(item.status === 'platinumed' || item.status === 'dropped') && (
              <button
                onClick={() => handleStatusChange('to_play')}
                disabled={isUpdatingStatus}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 disabled:opacity-50"
              >
                ← Πίσω στο Backlog
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-blue-400"
            >
              <Edit size={14} />
              Επεξεργασία
            </button>

            <button
              onClick={() => setShowHoursModal(true)}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-green-400"
              title="Καταγραφή Ωρών"
            >
              <Clock size={14} />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-red-950 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm"
            >
              <div className="max-w-xs space-y-4 p-6 text-center">
                <Trash2 className="mx-auto h-12 w-12 text-red-400" />
                <h4 className="text-lg font-semibold text-slate-100">Αφαίρεση από το Backlog;</h4>
                <p className="text-sm text-slate-400">
                  Θέλεις σίγουρα να αφαιρέσεις το <strong>{game.title}</strong> από το backlog σου;
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    Άκυρο
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    {isDeleting ? 'Διαγραφή...' : 'Αφαίρεση'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditBacklogItemModal item={item} onClose={() => setShowEditModal(false)} />
      )}

      {/* Hours Input Modal */}
      {showHoursModal && <HoursInputModal item={item} onClose={() => setShowHoursModal(false)} />}
    </>
  );
}
