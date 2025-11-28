'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { GameDetails } from '@/types/interfaces';
import Feedback from '../ui/Feedback';

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
    release_year: gameDetails?.release_year ?? '',
    developer: gameDetails?.developer ?? '',
    publisher: gameDetails?.publisher ?? '',
    genre: gameDetails?.genre ?? '',
    esrb_rating: gameDetails?.esrb_rating ?? '',
    rating: gameDetails?.rating ?? '',
    metacritic: gameDetails?.metacritic ?? '',
    platforms: gameDetails?.platforms?.join(', ') ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameDetails) {
      setFormData({
        release_year: gameDetails.release_year ?? '',
        developer: gameDetails.developer ?? '',
        publisher: gameDetails.publisher ?? '',
        genre: gameDetails.genre ?? '',
        rating: gameDetails.rating ?? '',
        metacritic: gameDetails.metacritic ?? '',
        esrb_rating: gameDetails.esrb_rating ?? '',
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
          release_year: formData.release_year ? Number(formData.release_year) : null,
          rating: formData.rating ? Number(formData.rating) : null,
          metacritic: formData.metacritic ? Number(formData.metacritic) : null,
          esrb_rating: formData.esrb_rating || null,
          platforms: formData.platforms
            .split(',')
            .map(p => p.trim())
            .filter(Boolean),
          genres: formData.genre
            ? formData.genre.split(',').map(g => g.trim()).filter(Boolean)
            : undefined,
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

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(null), 4200);
    return () => clearTimeout(timeout);
  }, [error]);

  const dismissError = () => setError(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Επεξεργασία Πληροφοριών">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="release_year" className="mb-1 block text-sm font-semibold text-gray-300">
              Έτος Κυκλοφορίας
            </label>
            <input
              id="release_year"
              type="number"
              value={formData.release_year}
              onChange={e => setFormData({ ...formData, release_year: e.target.value })}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
              placeholder="π.χ. 2010"
            />
          </div>

          <div>
            <label htmlFor="genre" className="mb-1 block text-sm font-semibold text-gray-300">
              Genre(s)
            </label>
            <input
              id="genre"
              type="text"
              value={formData.genre || ''}
              onChange={e => setFormData({ ...formData, genre: e.target.value })}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
              placeholder="π.χ. Action, RPG"
            />
          </div>

          <div>
            <label htmlFor="developer" className="mb-1 block text-sm font-semibold text-gray-300">
              Developer
            </label>
            <input
              id="developer"
              type="text"
              value={formData.developer}
              onChange={e => setFormData({ ...formData, developer: e.target.value })}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
              placeholder="π.χ. Ubisoft Montreal"
            />
          </div>

          <div>
            <label htmlFor="publisher" className="mb-1 block text-sm font-semibold text-gray-300">
              Publisher
            </label>
            <input
              id="publisher"
              type="text"
              value={formData.publisher}
              onChange={e => setFormData({ ...formData, publisher: e.target.value })}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
              placeholder="π.χ. Ubisoft Entertainment"
            />
          </div>

          <div>
            <label htmlFor="rating" className="mb-1 block text-sm font-semibold text-gray-300">
              Βαθμολογία (0-5)
            </label>
            <input
              id="rating"
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={formData.rating}
              onChange={e => setFormData({ ...formData, rating: e.target.value })}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
              placeholder="π.χ. 4.27"
            />
          </div>

          <div>
            <label htmlFor="metacritic" className="mb-1 block text-sm font-semibold text-gray-300">
              Metacritic (0-100)
            </label>
            <input
              id="metacritic"
              type="number"
              min="0"
              max="100"
              value={formData.metacritic}
              onChange={e => setFormData({ ...formData, metacritic: e.target.value })}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
              placeholder="π.χ. 88"
            />
          </div>

          <div>
            <label htmlFor="esrb_rating" className="mb-1 block text-sm font-semibold text-gray-300">
              ESRB Rating
            </label>
            <input
              id="esrb_rating"
              type="text"
              value={formData.esrb_rating}
              onChange={e => setFormData({ ...formData, esrb_rating: e.target.value })}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
              placeholder="π.χ. M, T, E10+"
            />
          </div>
        </div>

        <div>
          <label htmlFor="platforms" className="mb-1 block text-sm font-semibold text-gray-300">
            Πλατφόρμες (χωρισμένες με κόμμα)
          </label>
          <input
            id="platforms"
            type="text"
            value={formData.platforms}
            onChange={e => setFormData({ ...formData, platforms: e.target.value })}
            className="w-full rounded-lg bg-gray-800 px-3 py-2 text-white"
            placeholder="π.χ. PS3, PS4, Xbox 360"
          />
        </div>

        {error && (
          <Feedback
            layout="inline"
            variant="error"
            tone="soft"
            title="Αποτυχία ενημέρωσης"
            description={error}
            dismissible
            onDismiss={dismissError}
            className="border-slate-800/60 bg-slate-900/70"
          />
        )}

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
