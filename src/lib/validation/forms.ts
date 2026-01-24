import { z } from 'zod';

const optionalTrimmedString = () =>
  z.preprocess(
    (value: unknown) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return value;
    },
    z.string().min(1).optional(),
  );

export const GeneralQuestionCategory = z.enum(['Support', 'Info', 'Feedback', 'Other']);

const generalQuestionShape = z.object({
  category: GeneralQuestionCategory,
  email: z.string().email(),
  question: optionalTrimmedString(),
  serviceName: optionalTrimmedString(),
  serviceDescription: optionalTrimmedString(),
  infoType: optionalTrimmedString(),
  infoDetails: optionalTrimmedString(),
  feedbackRating: z.number().int().min(1).max(5).optional(),
});

type GeneralQuestionInput = z.infer<typeof generalQuestionShape>;

export const generalQuestionSchema = generalQuestionShape.superRefine(
  (data: GeneralQuestionInput, ctx: z.RefinementCtx) => {
    const ensure = (field: keyof GeneralQuestionInput, message: string) => {
      if (!data[field]) {
        ctx.addIssue({
          path: [field],
          code: z.ZodIssueCode.custom,
          message,
        });
      }
    };

    switch (data.category) {
      case 'Support':
        ensure('serviceDescription', 'Η περιγραφή της υπηρεσίας είναι υποχρεωτική.');
        break;
      case 'Info':
        ensure('infoType', 'Το θέμα πληροφοριών είναι υποχρεωτικό.');
        ensure('infoDetails', 'Η περιγραφή πληροφοριών είναι υποχρεωτική.');
        break;
      case 'Feedback':
        if (typeof data.feedbackRating !== 'number') {
          ctx.addIssue({
            path: ['feedbackRating'],
            code: z.ZodIssueCode.custom,
            message: 'Η βαθμολογία Feedback είναι υποχρεωτική.',
          });
        }
        break;
      case 'Other':
        ensure('question', 'Η ερώτησή σας είναι υποχρεωτική.');
        break;
      default:
        break;
    }
  },
);
