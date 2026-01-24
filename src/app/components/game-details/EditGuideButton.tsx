import Link from 'next/link';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';

interface EditGuideButtonProps {
  readonly gameId: number;
}

export default function EditGuideButton({ gameId }: EditGuideButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const user = useSelector(selectUser);
  const canEdit = user?.role === 'admin' || user?.role === 'author';

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτό το παιχνίδι;')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/delete-game/${gameId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ Το παιχνίδι διαγράφηκε επιτυχώς!');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setMessage(result.error || '❌ Σφάλμα κατά τη διαγραφή!');
      }
    } catch (error) {
      console.error('❌ Σφάλμα:', error);
      setMessage('❌ Σφάλμα κατά τη διαγραφή!');
    }

    setLoading(false);
  };

  if (!canEdit) {
    return null;
  }

  return (
    <div className="mt-6 text-center">
      <Link
        href={`/pages/edit-guide/${gameId}`}
        className="rounded-lg bg-blue-600 px-4 py-3 text-lg transition hover:bg-blue-700"
      >
        ✏️ Επεξεργασία Guide
      </Link>

      {/* Delete Game Button */}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="ml-4 rounded-lg bg-red-600 px-4 py-3 text-lg text-white transition hover:bg-red-700"
      >
        {loading ? '🗑️ Διαγραφή...' : '🗑️ Διαγραφή Παιχνιδιού'}
      </button>

      {/* Feedback Message */}
      {message && <p className="mt-2 text-gray-300">{message}</p>}
    </div>
  );
}
