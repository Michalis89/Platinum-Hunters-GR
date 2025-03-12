export type QuestionCategory = 'Support' | 'Info' | 'Feedback' | 'Other';

export interface GeneralQuestionBase {
  category: QuestionCategory;
  email: string;
  question?: string;
  serviceDescription?: string;
  infoType?: string;
  infoDetails?: string;
  feedbackRating?: number;
}

export interface GeneralQuestionRequest extends GeneralQuestionBase {
  serviceName?: string;
}

export interface GeneralQuestionDBEntry extends GeneralQuestionBase {
  service_name?: string | null;
  service_description?: string | null;
  info_type?: string | null;
  info_details?: string | null;
  feedback_rating?: number | null;
}

export interface GeneralQuestionFormData extends GeneralQuestionBase {
  serviceName?: string;
}

export interface ValidationRules {
  Support: () => void;
  Info: () => void;
  Feedback: () => void;
  Other: () => void;
}
