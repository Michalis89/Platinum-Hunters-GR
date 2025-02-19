'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import FormErrorMessage from '../ui/FormErrorMessage';
import AlertMessage from '../ui/AlertMessage';

export default function NewGuideForm() {
  const [game, setGame] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formErrors, setFormErrors] = useState<{ game?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormErrors({});
    setAlert(null);

    const errors: { game?: string } = {};
    if (!game.trim()) errors.game = 'Το όνομα του παιχνιδιού είναι υποχρεωτικό.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contact/forms/trophy-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_name: game,
          additional_comments: message,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Σφάλμα κατά την υποβολή.');

      setAlert({ type: 'success', message: '✅ Το αίτημά σας καταχωρήθηκε με επιτυχία!' });
      setGame('');
      setMessage('');
    } catch (err) {
      if (err instanceof Error) {
        setAlert({ type: 'error', message: '❌ ' + err.message });
      } else {
        setAlert({ type: 'error', message: '❌ Παρουσιάστηκε άγνωστο σφάλμα' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {/* ✅ Εμφάνιση alert όταν υπάρχει API success/error */}
      {alert && <AlertMessage type={alert.type} message={alert.message} />}
      {/* 🏆 Πεδίο Όνομα Παιχνιδιού */}
      <label htmlFor="game" className="block text-sm text-gray-300">
        Όνομα Παιχνιδιού <span className="text-red-500">*</span>
      </label>
      <input
        id="game"
        type="text"
        name="game"
        placeholder="Γράψτε το όνομα του παιχνιδιού..."
        value={game}
        onChange={e => {
          setGame(e.target.value);
          if (formErrors.game) {
            setFormErrors(prev => ({ ...prev, game: undefined }));
          }
        }}
        className={`w-full rounded-lg border bg-gray-800 p-3 ${
          formErrors.game ? 'border-red-500' : 'border-gray-700'
        } text-white`}
      />
      <FormErrorMessage message={formErrors.game} />
      {/* Πεδίο Επιπλέον Σχόλια */}
      <label htmlFor="message" className="block text-sm text-gray-300">
        Επιπλέον Σχόλια
      </label>
      <textarea
        id="message"
        name="message"
        placeholder="Προσθέστε περισσότερες λεπτομέρειες αν χρειάζεται..."
        rows={4}
        value={message}
        onChange={e => setMessage(e.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
      ></textarea>
      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 p-3 text-lg font-semibold transition hover:bg-blue-700"
      >
        {loading ? (
          'Υποβολή...'
        ) : (
          <>
            <Send className="h-5 w-5 text-white" />
            <span>Υποβολή Αιτήματος</span>
          </>
        )}
      </button>
    </form>
  );
}
