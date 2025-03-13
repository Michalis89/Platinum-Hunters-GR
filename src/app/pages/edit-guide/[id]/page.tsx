'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { motion } from 'framer-motion';
import AlertMessage from '@/app/components/ui/AlertMessage';

export default function EditGuide() {
  const { id } = useParams();
  const [steps, setSteps] = useState<{ title: string; description: string }[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const response = await fetch(`/api/guides/${id}`);
        const data = await response.json();
        if (response.ok && data) {
          setSteps(data[0]?.steps ?? []);
        } else {
          setMessage('❌ Σφάλμα φόρτωσης οδηγού!');
          setMessageType('error');
        }
      } catch (error) {
        console.error('❌ Σφάλμα:', error);
        setMessage('❌ Αποτυχία φόρτωσης!');
        setMessageType('error');
      }
      setLoading(false);
    };

    if (id) fetchGuide();
  }, [id]);

  const handleChange = (index: number, field: 'title' | 'description', newValue: string) => {
    setSteps(prevSteps =>
      prevSteps.map((step, i) => (i === index ? { ...step, [field]: newValue } : step)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`/api/update-guide/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('✅ Ο οδηγός ενημερώθηκε επιτυχώς!');
        setMessageType('success');
      } else {
        setMessage(result.error || '❌ Σφάλμα κατά την ενημέρωση!');
        setMessageType('error');
      }
    } catch (error) {
      console.error('❌ Σφάλμα:', error);
      setMessage('❌ Σφάλμα κατά την αποθήκευση!');
      setMessageType('error');
    }

    setSaving(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
      <motion.div
        className="w-full max-w-3xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <h2 className="text-center text-3xl font-bold text-blue-400">✍️ Επεξεργασία Οδηγού</h2>

        {loading ? (
          <p className="text-center text-gray-400">🔄 Φόρτωση...</p>
        ) : (
          <div className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg"
              >
                <input
                  type="text"
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 p-4 text-white focus:ring-2 focus:ring-blue-500"
                  value={step.title}
                  onChange={e => handleChange(index, 'title', e.target.value)}
                />
                <textarea
                  className="mt-3 min-h-[150px] w-full resize-y rounded-lg border border-gray-700 bg-gray-800 p-4 text-white focus:ring-2 focus:ring-blue-500"
                  value={step.description}
                  onChange={e => handleChange(index, 'description', e.target.value)}
                />
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '💾 Αποθήκευση...' : '💾 Αποθήκευση'}
          </Button>
        </div>

        {message && messageType && <AlertMessage type={messageType} message={message} />}
      </motion.div>
    </div>
  );
}
