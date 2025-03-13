import { POST } from './route';
import supabase from '@/lib/db';

jest.mock('@/lib/db', () => ({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
  })),
}));

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

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('POST /api/update-game-info/[id]', () => {
  it('should update game info successfully', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { title: 'Test Game' },
        error: null,
      }),
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ slug: 'test-game' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          released: '2023-01-01',
          developers: [{ name: 'Test Developer' }],
          publishers: [{ name: 'Test Publisher' }],
          genres: [{ name: 'Action' }],
          slug: 'test-game',
          metacritic: 85,
          rating: 4.5,
          platforms: [{ platform: { name: 'PC' } }],
          esrb_rating: { name: 'Mature' },
        }),
      });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null, data: {} }),
    });

    const req = new Request('http://localhost:3000', { method: 'POST' });
    const context = { params: { id: '1' } };

    const response = await POST(req, context);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('✅ Πληροφορίες ενημερώθηκαν επιτυχώς!');
  });

  it('should return 404 if game is not found in the database', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    });

    const req = new Request('http://localhost:3000', { method: 'POST' });
    const context = { params: { id: '999' } };

    const response = await POST(req, context);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Game info not found');
  });

  it('should return 404 if RAWG API returns no data', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { title: 'Unknown Game' },
        error: null,
      }),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });

    const req = new Request('http://localhost:3000', { method: 'POST' });
    const context = { params: { id: '1' } };

    const response = await POST(req, context);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Game info not found');
  });

  it('should handle RAWG API error', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { title: 'Test Game' },
        error: null,
      }),
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    const req = new Request('http://localhost:3000', { method: 'POST' });
    const context = { params: { id: '1' } };

    const response = await POST(req, context);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Game info not found');
  });

  it('should return 500 if database update fails', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { title: 'Test Game' },
        error: null,
      }),
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ slug: 'test-game' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          released: '2023-01-01',
          developers: [{ name: 'Test Developer' }],
          publishers: [{ name: 'Test Publisher' }],
          genres: [{ name: 'Action' }],
          slug: 'test-game',
          metacritic: 85,
          rating: 4.5,
          platforms: [{ platform: { name: 'PC' } }],
          esrb_rating: { name: 'Mature' },
        }),
      });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: { message: 'Database update error' }, data: null }),
    });

    const req = new Request('http://localhost:3000', { method: 'POST' });
    const context = { params: { id: '1' } };

    const response = await POST(req, context);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Database update error');
  });
});
