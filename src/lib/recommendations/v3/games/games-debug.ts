import type { GameHistoryEntry } from './games-types';

export function buildResultDebug(history: GameHistoryEntry[]): {
  completedCount: number;
  inProgressCount: number;
  droppedCount: number;
  backlogCount: number;
} {
  return {
    completedCount: history.filter(item => item.status === 'completed').length,
    inProgressCount: history.filter(item => item.status === 'current').length,
    droppedCount: history.filter(item => item.status === 'dropped').length,
    backlogCount: history.filter(item => item.status === 'planned').length,
  };
}

export function toDebugMap(values: Record<string, unknown>): Record<string, unknown> {
  return values;
}
