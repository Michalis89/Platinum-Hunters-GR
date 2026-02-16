import { z } from 'zod';

const optionalTrimmedString = () =>
  z.preprocess((value: unknown) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    }
    return value;
  }, z.string().min(1).optional());

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
        ensure('serviceDescription', 'Service description is required.');
        break;
      case 'Info':
        ensure('infoType', 'Information topic is required.');
        ensure('infoDetails', 'Information details are required.');
        break;
      case 'Feedback':
        if (typeof data.feedbackRating !== 'number') {
          ctx.addIssue({
            path: ['feedbackRating'],
            code: z.ZodIssueCode.custom,
            message: 'Feedback rating is required.',
          });
        }
        break;
      case 'Other':
        ensure('question', 'Your question is required.');
        break;
      default:
        break;
    }
  },
);
