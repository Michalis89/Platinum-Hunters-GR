import { POST } from './route';
import getSupabaseServer from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: jest.fn(),
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

let supabaseMock: { from: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = jest.fn();

  const mockFrom = jest.fn();
  supabaseMock = { from: mockFrom };
  (getSupabaseServer as jest.Mock).mockReturnValue(supabaseMock);
});

describe('POST /api/update-game-info/[id]', () => {
  it('should update game info successfully', async () => {
    const mockFrom = supabaseMock.from;

    // Mock game query
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { title: 'Test Game' },
        error: null,
      }),
    });

    // Mock RAWG API calls
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

    // Mock developer query (existing developer)
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    });

    // Mock publisher query (existing publisher)
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    });

    // Mock game update
    mockFrom.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null, data: {} }),
    });

    // Mock game_genres delete
    mockFrom.mockReturnValueOnce({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    // Mock genre query (existing genre)
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    });

    // Mock game_genres insert
    mockFrom.mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    // Mock game_platforms delete
    mockFrom.mockReturnValueOnce({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    // Mock platform query (existing platform)
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    });

    // Mock game_platforms insert
    mockFrom.mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    const req = new Request('http://localhost:3000', { method: 'POST' });
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await POST(req, context);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('✅ Πληροφορίες ενημερώθηκαν επιτυχώς!');
  });

  it('should return 404 if game is not found in the database', async () => {
    const mockFrom = supabaseMock.from;

    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    });

    const req = new Request('http://localhost:3000', { method: 'POST' });
    const context = { params: Promise.resolve({ id: '999' }) };

    const response = await POST(req, context);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Game info not found');
  });

  it('should return 404 if RAWG API returns no data', async () => {
    const mockFrom = supabaseMock.from;

    mockFrom.mockReturnValueOnce({
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
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await POST(req, context);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Game info not found');
  });

  it('should handle RAWG API error', async () => {
    const mockFrom = supabaseMock.from;

    mockFrom.mockReturnValueOnce({
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
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await POST(req, context);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Game info not found');
  });

  it('should return 500 if database update fails', async () => {
    const mockFrom = supabaseMock.from;

    // Mock game query
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { title: 'Test Game' },
        error: null,
      }),
    });

    // Mock RAWG API calls
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

    // Mock developer query (existing developer)
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    });

    // Mock publisher query (existing publisher)
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 1 },
        error: null,
      }),
    });

    // Mock game update with error
    mockFrom.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        error: { message: 'Database update error' },
        data: null,
      }),
    });

    const req = new Request('http://localhost:3000', { method: 'POST' });
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await POST(req, context);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Database update error');
  });
});
