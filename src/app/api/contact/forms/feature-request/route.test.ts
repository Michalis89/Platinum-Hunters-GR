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

describe('POST /api/feature-request', () => {
  it('should submit a valid feature request successfully', async () => {
    const requestData = {
      title: 'New Feature',
      description: 'A great feature description',
      reason: 'Improves user experience',
      example_url: 'https://example.com',
      priority: 'High',
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
    expect(json.message).toBe('✅ Η υποβολή ολοκληρώθηκε επιτυχώς!');
    expect(supabase.from).toHaveBeenCalledWith('submissions');
    expect(supabase.from).toHaveBeenCalledWith('feature_requests');
  });

  it('should return 400 if title is missing', async () => {
    const requestData = {
      description: 'A great feature description',
      reason: 'Improves user experience',
    };

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Όλα τα απαιτούμενα πεδία πρέπει να συμπληρωθούν.');
  });

  it('should return 400 if description is missing', async () => {
    const requestData = {
      title: 'New Feature',
      reason: 'Improves user experience',
    };

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Όλα τα απαιτούμενα πεδία πρέπει να συμπληρωθούν.');
  });

  it('should return 400 if reason is missing', async () => {
    const requestData = {
      title: 'New Feature',
      description: 'A great feature description',
    };

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Όλα τα απαιτούμενα πεδία πρέπει να συμπληρωθούν.');
  });

  it('should return 500 if submission insertion fails', async () => {
    const requestData = {
      title: 'New Feature',
      description: 'A great feature description',
      reason: 'Improves user experience',
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

  it('should return 500 if feature request insertion fails', async () => {
    const requestData = {
      title: 'New Feature',
      description: 'A great feature description',
      reason: 'Improves user experience',
    };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: new Error('Feature request failed') }),
      });

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Feature request failed');
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
