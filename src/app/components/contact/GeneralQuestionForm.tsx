'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Wrench, Info, MessageSquare, Star } from 'lucide-react';
import Dropdown from '@/app/components/ui/Dropdown';
import FormErrorMessage from '../ui/FormErrorMessage';
import AlertMessage from '../ui/AlertMessage';
import { GeneralQuestionFormData, QuestionCategory, ValidationRules } from '@/types/forms';

export default function GeneralQuestionForm({
  onTitleChange,
}: Readonly<{ onTitleChange: (title: string) => void }>) {
  const [formData, setFormData] = useState<GeneralQuestionFormData>({
    category: 'Support',
    email: '',
    question: '',
    serviceName: '',
    serviceDescription: '',
    infoType: '',
    infoDetails: '',
    feedbackRating: 0,
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errors, setErrors] = useState<Partial<GeneralQuestionFormData>>({});

  const questionCategories = [
    { value: 'Support', label: 'Υποστήριξη', icon: <Wrench className="h-4 w-4 text-white" /> },
    { value: 'Info', label: 'Πληροφορίες', icon: <Info className="h-4 w-4 text-white" /> },
    { value: 'Feedback', label: 'Feedback', icon: <Star className="h-4 w-4 text-white" /> },
    { value: 'Other', label: 'Άλλο', icon: <MessageSquare className="h-4 w-4 text-white" /> },
  ];

  const categoryTitles = useMemo(
    () => ({
      Support: 'Χρειάζεστε βοήθεια; Στείλτε μας το πρόβλημά σας!',
      Info: 'Χρειάζεστε πληροφορίες; Ρωτήστε μας!',
      Feedback: 'Μοιραστείτε την άποψή σας μαζί μας!',
      Other: 'Ρώτησε μας ό,τι θέλεις!',
    }),
    [],
  );

  const buttonTexts: Record<QuestionCategory, string> = {
    Support: 'Αποστολή Αιτήματος',
    Info: 'Αποστολή Ερώτησης',
    Feedback: 'Υποβολή Feedback',
    Other: 'Υποβολή Ερώτησης',
  };

  const validateForm = (data: GeneralQuestionFormData) => {
    const newErrors: Partial<GeneralQuestionFormData> = {};

    if (!data.email.trim() || !isValidEmail(data.email))
      newErrors.email = 'Το email είναι υποχρεωτικό και πρέπει να είναι έγκυρο.';

    const validations: ValidationRules = {
      Support: () => {
        if (!data.serviceName?.trim()) newErrors.serviceName = 'Η υπηρεσία είναι υποχρεωτική.';
        if (!data.serviceDescription?.trim())
          newErrors.serviceDescription = 'Η περιγραφή είναι υποχρεωτική.';
      },
      Info: () => {
        if (!data.infoType?.trim()) newErrors.infoType = 'Το θέμα πληροφορίας είναι υποχρεωτικό.';
        if (!data.infoDetails?.trim()) newErrors.infoDetails = 'Η περιγραφή είναι υποχρεωτική.';
      },
      Feedback: () => {
        if (!data.feedbackRating || data.feedbackRating <= 0) {
          newErrors.feedbackRating = 'Επιλέξτε βαθμολογία.' as unknown as number;
        }
      },
      Other: () => {
        if (!data.question?.trim()) newErrors.question = 'Η ερώτηση είναι υποχρεωτική.';
      },
    };

    validations[data.category]?.();
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAlert(null);
    setLoading(true);

    const newErrors = validateForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/contact/forms/general-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setAlert({ type: 'success', message: '✅ Η ερώτησή σας υποβλήθηκε επιτυχώς!' });
      setFormData({
        category: 'Support',
        email: '',
        question: '',
        serviceName: '',
        serviceDescription: '',
        infoType: '',
        infoDetails: '',
        feedbackRating: 0,
      });
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

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    onTitleChange(categoryTitles[formData.category] || 'Ρώτησε μας ό,τι θέλεις!');
  }, [formData.category, onTitleChange, categoryTitles]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value.trim();
    setFormData(prev => ({ ...prev, email: newEmail }));

    if (newEmail === '') {
      setErrors(prev => ({ ...prev, email: undefined }));
    } else if (!isValidEmail(newEmail)) {
      setErrors(prev => ({
        ...prev,
        email: 'Το email πρέπει να είναι έγκυρο (π.χ. user@example.com)',
      }));
    } else {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handleFeedbackRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setFormData(prev => ({ ...prev, feedbackRating: value }));

    setErrors(prev => ({
      ...prev,
      feedbackRating: value > 0 ? undefined : ('' as unknown as number),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {alert && <AlertMessage type={alert.type} message={alert.message} />}

      <Dropdown
        label="Κατηγορία Ερώτησης"
        options={questionCategories}
        selectedValue={formData.category}
        onSelect={value => setFormData({ ...formData, category: value as QuestionCategory })}
        isOpen={false}
        zIndex={2}
      />

      {formData.category && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-4"
        >
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Το email σας <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleEmailChange}
            className={`w-full rounded-lg border bg-gray-800 p-3 ${
              errors.email ? 'border-red-500' : 'border-gray-700'
            } text-white`}
          />
          <FormErrorMessage message={errors.email} />

          {formData.category === 'Support' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-4"
            >
              <label htmlFor="serviceName" className="block text-sm font-medium text-gray-300">
                Θέμα Υπηρεσίας <span className="text-red-500">*</span>
              </label>
              <input
                id="serviceName"
                type="text"
                name="serviceName"
                placeholder="Ποια υπηρεσία αντιμετωπίζει πρόβλημα;"
                value={formData.serviceName}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, serviceName: value }));
                  setErrors(prev => ({
                    ...prev,
                    serviceName: value.trim() ? undefined : prev.serviceName,
                  }));
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
              />
              <FormErrorMessage message={errors.serviceName} />

              <label
                htmlFor="serviceDescription"
                className="block text-sm font-medium text-gray-300"
              >
                Περιγραφή <span className="text-red-500">*</span>
              </label>
              <textarea
                id="serviceDescription"
                name="serviceDescription"
                placeholder="Δώστε μας μια περιγραφή..."
                rows={4}
                value={formData.serviceDescription}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, serviceDescription: value }));
                  setErrors(prev => ({
                    ...prev,
                    serviceDescription: value.trim() ? undefined : prev.serviceDescription,
                  }));
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
              />
              <FormErrorMessage message={errors.serviceDescription} />
            </motion.div>
          )}

          {formData.category === 'Info' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-4"
            >
              <label htmlFor="infoType" className="block text-sm font-medium text-gray-300">
                Θέμα Πληροφορίας <span className="text-red-500">*</span>
              </label>
              <input
                id="infoType"
                type="text"
                name="infoType"
                placeholder="Για ποιο θέμα θέλετε πληροφορίες;"
                value={formData.infoType}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, infoType: value }));
                  setErrors(prev => ({
                    ...prev,
                    infoType: value.trim() ? undefined : prev.infoType,
                  }));
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
              />
              <FormErrorMessage message={errors.infoType} />

              <label htmlFor="infoDetails" className="block text-sm font-medium text-gray-300">
                Περιγραφή <span className="text-red-500">*</span>
              </label>
              <textarea
                id="infoDetails"
                name="infoDetails"
                placeholder="Παρακαλώ δώστε περισσότερες λεπτομέρειες..."
                rows={4}
                value={formData.infoDetails}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, infoDetails: value }));
                  setErrors(prev => ({
                    ...prev,
                    infoDetails: value.trim() ? undefined : prev.infoDetails,
                  }));
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
              />
              <FormErrorMessage message={errors.infoDetails} />
            </motion.div>
          )}

          {formData.category === 'Feedback' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-4"
            >
              <label htmlFor="feedbackRating" className="block text-sm font-medium text-gray-300">
                Βαθμολογία Feedback <span className="text-red-500">*</span>
              </label>
              <select
                id="feedbackRating"
                name="feedbackRating"
                value={formData.feedbackRating ?? ''}
                onChange={handleFeedbackRatingChange}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
              >
                <option value="">Επιλέξτε βαθμολογία</option>
                <option value="1">⭐ 1 - Πολύ κακό</option>
                <option value="2">⭐⭐ 2 - Μέτριο</option>
                <option value="3">⭐⭐⭐ 3 - Καλό</option>
                <option value="4">⭐⭐⭐⭐ 4 - Πολύ καλό</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 - Εξαιρετικό</option>
              </select>
              <FormErrorMessage
                message={errors.feedbackRating ? String(errors.feedbackRating) : undefined}
              />
            </motion.div>
          )}

          {formData.category === 'Other' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-4"
            >
              <label htmlFor="question" className="block text-sm font-medium text-gray-300">
                Η ερώτησή σας <span className="text-red-500">*</span>
              </label>
              <textarea
                id="question"
                name="question"
                placeholder="Γράψτε την ερώτησή σας..."
                rows={4}
                value={formData.question}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, question: value }));
                  setErrors(prev => ({
                    ...prev,
                    question: value.trim() ? undefined : prev.question,
                  }));
                }}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white"
              />
              <FormErrorMessage message={errors.question} />
            </motion.div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 p-3 text-lg font-semibold transition hover:bg-blue-700"
          >
            {loading ? (
              'Υποβολή...'
            ) : (
              <>
                <HelpCircle className="h-5 w-5 text-white" />
                <span>{buttonTexts[formData.category]}</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </form>
  );
}
