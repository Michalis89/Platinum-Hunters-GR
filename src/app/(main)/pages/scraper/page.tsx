'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/app/components/ui/Input';
import { Card } from '@/app/components/ui/Card';
import { ScrapedGameData } from '@/types/interfaces';
import AlertMessage from '@/app/components/ui/AlertMessage';
import Button from '@/app/components/ui/Button';
import Image from 'next/image';

export default function ScraperPage() {
  const [url, setUrl] = useState('');
  const [data, setData] = useState<ScrapedGameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  const handleScrape = async () => {
    if (!url) return setMessageState('error', 'Βάλε ένα έγκυρο URL!');

    setLoading(true);
    setData(null);
    setMessage('');

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (response.status === 409) {
        setMessageState('error', result.message);
        setData(result.existingData);
      } else if (response.ok) {
        setMessageState('success', 'Scraping επιτυχές!');
        setData(result);
      } else {
        setMessageState('error', 'Σφάλμα κατά το Scraping!');
      }
    } catch (error) {
      console.error('Σφάλμα:', error);
      setMessageState('error', 'Αποτυχία Scraping! Δοκίμασε ξανά.');
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/save-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.status === 409) {
        setMessageState('error', 'Ο οδηγός υπάρχει ήδη στη βάση!');
      } else if (response.ok) {
        setMessageState('success', 'Ο οδηγός αποθηκεύτηκε επιτυχώς!');
        setUrl('');
        setData(null);
      } else {
        setMessageState('error', 'Κάτι πήγε στραβά κατά την αποθήκευση!');
      }
    } catch (error) {
      console.error('Σφάλμα:', error);
      setMessageState('error', 'Αποτυχία αποθήκευσης στη βάση!');
    }

    setSaving(false);
  };

  const setMessageState = (type: 'success' | 'error', msg: string) => {
    setMessageType(type);
    setMessage(msg);
  };

  const isValidHttpUrl = (maybeUrl?: string | null) => {
    if (!maybeUrl) return false;
    try {
      const parsed = new URL(maybeUrl);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
      {message && messageType && <AlertMessage type={messageType} message={message} />}
      <motion.div
        className="mt-[-200px] flex w-full max-w-2xl flex-col items-center gap-3 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <h2 className="text-3xl font-bold text-blue-400">🏆 PSN Trophy Guide Scraper</h2>
        <p className="text-gray-400">Βάλε ένα link και δες το guide!</p>

        <div className="flex w-full max-w-lg items-center justify-center gap-2">
          <Input
            type="text"
            placeholder="Βάλε το URL του guide..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
          />
          <Button onClick={handleScrape} disabled={loading}>
            {loading ? '⏳ Φόρτωση...' : 'Scrape'}
          </Button>
        </div>
        {data && (
          <Card className="mt-6 rounded-lg bg-gray-900 p-6">
            {isValidHttpUrl(data.gameImage) && (
              <div className="relative mt-4 h-60 w-full">
                <Image
                  src={data.gameImage}
                  alt={data.title}
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
            )}
            <h3 className="text-xl font-semibold text-white">{data.title}</h3>
            <p className="text-sm text-gray-500">{data.platform}</p>
            <Button onClick={handleSave} disabled={saving} className="mt-4">
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση στη βάση'}
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
