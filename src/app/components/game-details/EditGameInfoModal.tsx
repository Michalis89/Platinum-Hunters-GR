'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { GameDetails } from '@/types/interfaces';

interface EditGameInfoModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly gameId: number;
  readonly gameDetails: GameDetails | null;
  readonly onSuccess: (updatedData: GameDetails) => void;
}

export default function EditGameInfoModal({
  isOpen,
  onClose,
  gameId,
  gameDetails,
  onSuccess,
}: EditGameInfoModalProps) {
  const [formData, setFormData] = useState({
    release_year: gameDetails?.release_year ?? null,
    developer: gameDetails?.developer ?? '',
    publisher: gameDetails?.publisher ?? '',
    rating: gameDetails?.rating ?? null,
    metacritic: gameDetails?.metacritic ?? null,
    platforms: gameDetails?.platforms?.join(', ') ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameDetails) {
      setFormData({
        release_year: gameDetails.release_year ?? null,
        developer: gameDetails.developer ?? '',
        publisher: gameDetails.publisher ?? '',
        rating: gameDetails.rating ?? null,
        metacritic: gameDetails.metacritic ?? null,
        platforms: gameDetails.platforms?.join(', ') ?? '',
      });
    }
  }, [gameDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/edit-game-info/${gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          platforms: formData.platforms
            .split(',')
            .map(p => p.trim())
            .filter(Boolean),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess(result.updatedData);
        onClose();
      } else {
        setError(result.error || 'Σφάλμα κατά την ενημέρωση');
      }
    } catch (err) {
      console.error('❌ Σφάλμα:', err);
      setError('Αποτυχία ενημέρωσης');
    }

    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Επεξεργασία Πληροφοριών">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Release Year */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-300">
            Έτος Κυκλοφορίας
          </label>
          <input
            type="number"
            value={formData.release_year ?? ''}
            onChange={e =>
              setFormData({ ...formData, release_year: Number(e.target.value) || null })
            }
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
            placeholder="π.χ. 2010"
          />
        </div>

        {/* Developer */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-300">
            Προγραμματιστής
          </label>
          <input
            type="text"
            value={formData.developer}
            onChange={e => setFormData({ ...formData, developer: e.target.value })}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
            placeholder="π.χ. Ubisoft Montreal"
          />
        </div>

        {/* Publisher */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-300">Εκδότης</label>
          <input
            type="text"
            value={formData.publisher}
            onChange={e => setFormData({ ...formData, publisher: e.target.value })}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
            placeholder="π.χ. Ubisoft Entertainment"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-300">
            Βαθμολογία (0-5)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="5"
            value={formData.rating ?? ''}
            onChange={e => setFormData({ ...formData, rating: Number(e.target.value) || null })}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
            placeholder="π.χ. 4.27"
          />
        </div>

        {/* Metacritic */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-300">
            Metacritic (0-100)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.metacritic ?? ''}
            onChange={e =>
              setFormData({ ...formData, metacritic: Number(e.target.value) || null })
            }
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
            placeholder="π.χ. 88"
          />
        </div>

        {/* Platforms */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-300">
            Πλατφόρμες (χωρισμένες με κόμμα)
          </label>
          <input
            type="text"
            value={formData.platforms}
            onChange={e => setFormData({ ...formData, platforms: e.target.value })}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
            placeholder="π.χ. PS3, PS4, Xbox 360"
          />
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-700 px-4 py-2 text-white transition hover:bg-gray-600"
            disabled={saving}
          >
            Ακύρωση
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
