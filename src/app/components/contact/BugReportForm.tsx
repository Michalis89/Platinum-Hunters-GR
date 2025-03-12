'use client';

import { useState } from 'react';
import { Paperclip, Bug } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Dropdown from '@/app/components/ui/Dropdown';
import FormErrorMessage from '../ui/FormErrorMessage';
import AlertMessage from '../ui/AlertMessage';

export default function BugReportForm() {
  const [form, setForm] = useState({ type: '' });
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [bugDescription, setBugDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<{ type?: string; description?: string }>({});

  const requestTypes = [
    { value: 'UI', label: 'UI Issue', icon: <Bug className="h-4 w-4 text-white" /> },
    { value: 'Crash', label: 'Crash', icon: <Bug className="h-4 w-4 text-white" /> },
    {
      value: 'Performance',
      label: 'Performance Issue',
      icon: <Bug className="h-4 w-4 text-white" />,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    const newErrors: { type?: string; description?: string } = {};
    if (!form.type) newErrors.type = 'Ο τύπος προβλήματος είναι υποχρεωτικός.';
    if (!bugDescription.trim()) newErrors.description = 'Η περιγραφή του bug είναι υποχρεωτική.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('bug_type', form.type);
    formData.append('description', bugDescription);

    if (file) {
      formData.append('screenshot', file);
    }

    try {
      const response = await fetch('/api/contact/forms/bug-report', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setAlert({ type: 'success', message: '✅ Η αναφορά υποβλήθηκε!' });
      setBugDescription('');
      setScreenshotPreview(null);
      setFile(null);
      setForm({ type: '' });
    } catch (err) {
      let errorMessage = '❌ Παρουσιάστηκε σφάλμα.';

      if (err instanceof Error) {
        errorMessage = '❌ ' + err.message;
      }

      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
      {alert && <AlertMessage type={alert.type} message={alert.message} />}

      <Dropdown
        label="Τύπος Προβλήματος"
        options={requestTypes}
        selectedValue={form.type}
        onSelect={value => {
          setForm({ type: value });
          setErrors(prev => ({ ...prev, type: undefined }));
        }}
        isOpen={false}
        zIndex={2}
      />
      <FormErrorMessage message={errors.type} />

      {form.type && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-2"
        >
          <label htmlFor="bugDescription" className="block text-sm font-medium text-gray-300">
            Περιγραφή του bug <span className="text-red-500">*</span>
          </label>
          <textarea
            id="bugDescription"
            name="bugDescription"
            placeholder="Περιγραφή του bug..."
            rows={4}
            value={bugDescription}
            onChange={e => {
              setBugDescription(e.target.value);
              setErrors(prev => ({ ...prev, description: undefined }));
            }}
            className={`w-full rounded-lg border bg-gray-800 p-3 ${errors.description ? 'border-red-500' : 'border-gray-700'} text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          ></textarea>
          <FormErrorMessage message={errors.description} />

          <div className="mt-4">
            <label htmlFor="bugScreenshot" className="mb-2 block text-sm text-gray-400">
              Προσθέστε Screenshot (προαιρετικό)
            </label>
            <div className="flex items-center justify-between">
              <label
                htmlFor="bugScreenshot"
                className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
              >
                <Paperclip className="h-5 w-5" />
                <span>Επιλέξτε Αρχείο</span>
              </label>
              <input
                id="bugScreenshot"
                type="file"
                name="bugScreenshot"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    setFile(e.target.files[0]);
                    setScreenshotPreview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
              />
            </div>

            {screenshotPreview && (
              <div className="mt-2">
                <Image
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  width={128}
                  height={128}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 p-3 text-lg font-semibold transition hover:bg-blue-700"
          >
            {loading ? (
              'Υποβολή...'
            ) : (
              <>
                <Bug className="h-5 w-5 text-white" />
                <span>Υποβολή Αναφοράς</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </form>
  );
}
