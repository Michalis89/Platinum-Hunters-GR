'use client';

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import FormErrorMessage from '../ui/FormErrorMessage';
import AlertMessage from '../ui/AlertMessage';

export default function FeatureRequestForm() {
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [featureReason, setFeatureReason] = useState('');
  const [featureExample, setFeatureExample] = useState('');
  const [priority, setPriority] = useState('medium');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    reason?: string;
    example?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAlert(null);

    const newErrors: { title?: string; description?: string; reason?: string } = {};
    if (!featureTitle.trim()) newErrors.title = 'Το πεδίο είναι υποχρεωτικό.';
    if (!featureDescription.trim()) newErrors.description = 'Το πεδίο είναι υποχρεωτικό.';
    if (!featureReason.trim()) newErrors.reason = 'Το πεδίο είναι υποχρεωτικό.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (featureExample && !isValidURL(featureExample)) {
      setErrors(prev => ({ ...prev, example: 'Το παράδειγμα πρέπει να είναι ένα έγκυρο URL.' }));
      return;
    }

    const featureData = {
      title: featureTitle,
      description: featureDescription,
      reason: featureReason,
      example_url: featureExample || null,
      priority: getPriorityLabel(priority).toLowerCase(),
    };

    setLoading(true);
    try {
      const response = await fetch('/api/contact/forms/feature-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(featureData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Σφάλμα κατά την υποβολή.');

      setAlert({ type: 'success', message: '✅ Η υποβολή ολοκληρώθηκε επιτυχώς!' });
      setFeatureTitle('');
      setFeatureDescription('');
      setFeatureReason('');
      setFeatureExample('');
      setPriority('medium');
    } catch (error) {
      let errorMessage = '❌ Κάτι πήγε στραβά, δοκιμάστε ξανά.';

      if (error instanceof Error) {
        errorMessage = '❌ ' + error.message;
      }

      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const isValidURL = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  const getPriorityLabel = (level: string): string => {
    const priorityMap: { [key: string]: string } = {
      low: 'low',
      medium: 'medium',
      high: 'high',
    };
    return priorityMap[level.toLowerCase()] || 'medium';
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {alert && <AlertMessage type={alert.type} message={alert.message} />}

      <label htmlFor="featureTitle" className="block text-sm font-medium text-gray-300">
        Τίτλος Feature <span className="text-red-500">*</span>
      </label>
      <input
        id="featureTitle"
        type="text"
        name="featureTitle"
        placeholder="Γράψτε έναν σύντομο τίτλο..."
        value={featureTitle}
        onChange={e => {
          setFeatureTitle(e.target.value);
          setErrors(prev => ({ ...prev, title: undefined }));
        }}
        className={`w-full rounded-lg border bg-gray-800 p-3 ${errors.title ? 'border-red-500' : 'border-gray-700'} text-white`}
      />
      <FormErrorMessage message={errors.title} />

      <label htmlFor="featureDescription" className="block text-sm font-medium text-gray-300">
        Περιγραφή της ιδέας <span className="text-red-500">*</span>
      </label>
      <textarea
        id="featureDescription"
        name="featureDescription"
        placeholder="Περιγράψτε το feature..."
        rows={4}
        value={featureDescription}
        onChange={e => {
          setFeatureDescription(e.target.value);
          setErrors(prev => ({ ...prev, description: undefined }));
        }}
        className={`w-full rounded-lg border bg-gray-800 p-3 ${errors.description ? 'border-red-500' : 'border-gray-700'} text-white`}
      />
      <FormErrorMessage message={errors.description} />

      <label htmlFor="featureReason" className="block text-sm font-medium text-gray-300">
        Γιατί είναι χρήσιμο αυτό το feature; <span className="text-red-500">*</span>
      </label>
      <textarea
        id="featureReason"
        name="featureReason"
        placeholder="Εξηγήστε τη σημασία του feature..."
        rows={3}
        value={featureReason}
        onChange={e => {
          setFeatureReason(e.target.value);
          setErrors(prev => ({ ...prev, reason: undefined }));
        }}
        className={`w-full rounded-lg border bg-gray-800 p-3 ${errors.reason ? 'border-red-500' : 'border-gray-700'} text-white`}
      />
      <FormErrorMessage message={errors.reason} />

      <label htmlFor="featureExample" className="block text-sm font-medium text-gray-300">
        Παράδειγμα από άλλο site (προαιρετικό)
      </label>
      <input
        id="featureExample"
        type="text"
        name="featureExample"
        placeholder="Εισάγετε ένα URL (προαιρετικό)"
        value={featureExample}
        onChange={e => {
          const value = e.target.value;
          setFeatureExample(value);

          if (value.trim() && !isValidURL(value)) {
            setErrors(prev => ({ ...prev, example: 'Το URL δεν είναι έγκυρο.' }));
          } else {
            setErrors(prev => ({ ...prev, example: undefined }));
          }
        }}
        className={`w-full rounded-lg border bg-gray-800 p-3 ${errors.example ? 'border-red-500' : 'border-gray-700'} text-white`}
      />
      <FormErrorMessage message={errors.example} />

      <label htmlFor="priority" className="block text-sm font-medium text-gray-300">
        Προτεραιότητα Feature
      </label>
      <div className="flex space-x-4">
        {['low', 'medium', 'high'].map(level => (
          <label key={level} className="flex items-center space-x-2">
            <input
              type="radio"
              name="priority"
              value={level}
              checked={priority === level}
              onChange={() => setPriority(level)}
              className="form-radio text-blue-500"
            />
            <span className="text-gray-300">{getPriorityLabel(level)}</span>
          </label>
        ))}
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
            <Lightbulb className="h-5 w-5 text-white" />
            <span>Υποβολή Αιτήματος</span>
          </>
        )}
      </button>
    </form>
  );
}
