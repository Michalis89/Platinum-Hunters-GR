// src/app/api/contact/forms/trophy-guide/route.test.ts
import { POST } from './route';
import supabase from '@/lib/db';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    from: jest.fn().mockImplementation(() => ({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: '123' }],
          error: null,
        }),
      }),
    })),
  },
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}));

type ValidRequestBody = {
  game_name: string;
  additional_comments?: string;
};

type TestRequestBody = Partial<ValidRequestBody>;

const mockRequest = (body: TestRequestBody) =>
  new Request('http://localhost:3000', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/trophy-guide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit a valid trophy guide request', async () => {
    const req = mockRequest({
      game_name: 'Test Game',
      additional_comments: 'Test comments',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: 'Το αίτημα καταχωρήθηκε επιτυχώς!' });
  });

  it('should return 400 if game_name is missing', async () => {
    const req = mockRequest({
      additional_comments: 'Test comments',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Το όνομα του παιχνιδιού είναι υποχρεωτικό.');
  });

  it('should handle submission insert error', async () => {
    // Mock submission error
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      }),
    }));

    const req = mockRequest({
      game_name: 'Test Game',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
  });

  it('should handle trophy guide insert error', async () => {
    // Mock first call (submission)
    (supabase.from as jest.Mock)
      .mockImplementationOnce(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ id: '123' }],
            error: null,
          }),
        }),
      }))
      // Mock second call (guide insert)
      .mockImplementationOnce(() => ({
        insert: jest.fn().mockReturnValue({
          error: new Error('Guide insert failed'),
        }),
      }));

    const req = mockRequest({
      game_name: 'Test Game',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Guide insert failed');
  });

  it('should handle generic errors', async () => {
    // Mock a generic error
    jest.spyOn(global, 'Request').mockImplementationOnce((): Request => {
      return {
        json: () => Promise.reject(new Error('Unexpected error')),
        headers: new Headers(),
        url: 'http://localhost',
      } as unknown as Request;
    });
    const req = mockRequest({
      game_name: 'Test Game',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Unexpected error');
  });
});
