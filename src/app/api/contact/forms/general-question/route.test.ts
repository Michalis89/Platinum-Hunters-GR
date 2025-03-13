import { POST, validateRequest, createSubmission, insertGeneralQuestion } from './route';
import supabase from '@/lib/db';
import { GeneralQuestionRequest, GeneralQuestionDBEntry } from '@/types/forms';

jest.mock('@/lib/db', () => {
  const mockInsert = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  return {
    from: jest.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    })),
  };
});

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => {
      const { status = 200 } = options;
      return {
        status,
        json: async () => data,
      };
    }),
  },
}));

describe('POST /api/general-question', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRequest', () => {
    it('should return error for missing email', () => {
      const request: GeneralQuestionRequest = { category: 'Other', email: '' };
      expect(validateRequest(request)).toBe('Το email είναι υποχρεωτικό.');
    });

    it('should return error for invalid email', () => {
      const request: GeneralQuestionRequest = { category: 'Other', email: 'invalid-email' };
      expect(validateRequest(request)).toBe('Το email δεν είναι έγκυρο.');
    });

    it('should return error for missing service description in Support category', () => {
      const request: GeneralQuestionRequest = {
        category: 'Support',
        email: 'test@example.com',
        serviceDescription: '',
      };
      expect(validateRequest(request)).toBe('Η περιγραφή της υπηρεσίας είναι υποχρεωτική.');
    });

    it('should return error for missing info fields in Info category', () => {
      const request: GeneralQuestionRequest = {
        category: 'Info',
        email: 'test@example.com',
        infoType: '',
        infoDetails: '',
      };
      expect(validateRequest(request)).toBe(
        'Το θέμα και η περιγραφή πληροφοριών είναι υποχρεωτικά.',
      );
    });

    it('should return error for missing feedback rating in Feedback category', () => {
      const request: GeneralQuestionRequest = {
        category: 'Feedback',
        email: 'test@example.com',
        feedbackRating: undefined,
      };
      expect(validateRequest(request)).toBe('Η βαθμολογία Feedback είναι υποχρεωτική.');
    });

    it('should return error for missing question in Other category', () => {
      const request: GeneralQuestionRequest = {
        category: 'Other',
        email: 'test@example.com',
        question: '',
      };
      expect(validateRequest(request)).toBe('Η ερώτηση είναι υποχρεωτική.');
    });

    it('should return null for valid request', () => {
      const request: GeneralQuestionRequest = {
        category: 'Other',
        email: 'test@example.com',
        question: 'Test question',
      };
      expect(validateRequest(request)).toBeNull();
    });
  });

  describe('createSubmission', () => {
    it('should return submission ID on success', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      });

      const id = await createSubmission();
      expect(id).toBe(1);
      expect(supabase.from).toHaveBeenCalledWith('submissions');
    });

    it('should throw error on failure', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      });

      await expect(createSubmission()).rejects.toThrow('Insert failed');
    });
  });

  describe('insertGeneralQuestion', () => {
    it('should insert data successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const payload: GeneralQuestionDBEntry = {
        category: 'Other',
        email: 'test@example.com',
        question: 'Test',
      };
      await expect(insertGeneralQuestion(1, payload)).resolves.toBeUndefined();
      expect(supabase.from).toHaveBeenCalledWith('general_questions');
    });

    it('should throw error on failure', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: new Error('Insert failed') }),
      });

      const payload: GeneralQuestionDBEntry = {
        category: 'Other',
        email: 'test@example.com',
        question: 'Test',
      };
      await expect(insertGeneralQuestion(1, payload)).rejects.toThrow('Insert failed');
    });
  });

  describe('POST', () => {
    it('should submit a valid Other category question', async () => {
      const requestData: GeneralQuestionRequest = {
        category: 'Other',
        question: 'Test question',
        email: 'test@example.com',
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: null }),
        });

      const req = new Request('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.message).toBe('Η ερώτησή σας καταχωρήθηκε επιτυχώς!');
      expect(json.submission_id).toBe(1);
    });

    it('should return 400 for invalid email', async () => {
      const requestData: GeneralQuestionRequest = {
        category: 'Other',
        question: 'Test question',
        email: 'invalid-email',
      };

      const req = new Request('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Το email δεν είναι έγκυρο.');
    });

    it('should return 500 if submission creation fails', async () => {
      const requestData: GeneralQuestionRequest = {
        category: 'Other',
        question: 'Test question',
        email: 'test@example.com',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Submission failed') }),
      });

      const req = new Request('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Submission failed');
    });

    it('should return 500 if general question insertion fails', async () => {
      const requestData: GeneralQuestionRequest = {
        category: 'Other',
        question: 'Test question',
        email: 'test@example.com',
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: new Error('Insert failed') }),
        });

      const req = new Request('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Insert failed');
    });

    it('should return 500 for invalid JSON', async () => {
      const req = new Request('http://localhost:3000', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toContain('Unexpected token');
    });
  });
});
