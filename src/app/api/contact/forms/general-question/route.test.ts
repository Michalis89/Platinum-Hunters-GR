import { POST } from './route';
import supabase from '@/lib/db';

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
  it('should submit a valid Other category question', async () => {
    const requestData = {
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

  it('should return 400 for missing email', async () => {
    const requestData = {
      category: 'Other',
      question: 'Test question',
      email: '',
    };

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Το email είναι υποχρεωτικό.');
  });

  it('should return 400 for invalid email', async () => {
    const requestData = {
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

  it('should return 400 for missing service description in Support category', async () => {
    const requestData = {
      category: 'Support',
      email: 'test@example.com',
      serviceDescription: '',
    };

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Η περιγραφή της υπηρεσίας είναι υποχρεωτική.');
  });

  it('should return 400 for missing info fields in Info category', async () => {
    const requestData = {
      category: 'Info',
      email: 'test@example.com',
      infoType: '',
      infoDetails: '',
    };

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Το θέμα και η περιγραφή πληροφοριών είναι υποχρεωτικά.');
  });

  it('should return 400 for missing feedback rating in Feedback category', async () => {
    const requestData = {
      category: 'Feedback',
      email: 'test@example.com',
      feedbackRating: undefined,
    };

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Η βαθμολογία Feedback είναι υποχρεωτική.');
  });

  it('should return 400 for missing question in Other category', async () => {
    const requestData = {
      category: 'Other',
      email: 'test@example.com',
      question: '',
    };

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Η ερώτηση είναι υποχρεωτική.');
  });

  it('should return 500 if submission creation fails', async () => {
    const requestData = {
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
    const requestData = {
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
