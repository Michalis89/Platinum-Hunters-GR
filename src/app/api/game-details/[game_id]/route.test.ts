import { GET } from './route';
import supabase from '@/lib/db';

jest.mock('@/lib/db', () => {
  const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
  return { from: mockFrom };
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

describe('GET /api/game-details/[game_id]', () => {
  it('should return game details for a valid game_id', async () => {
    const mockDatabaseData = {
      release_year: 2023,
      developer: 'Test Developer',
      publisher: 'Test Publisher',
      genres: ['Action'],
      slug: 'test-game',
      metacritic_score: 85,
      rating: 4.5,
      platforms: ['PC', 'PS5'],
    };

    const mockExpectedResponse = {
      release_year: 2023,
      developer: 'Test Developer',
      publisher: 'Test Publisher',
      genre: 'Action',
      slug: 'test-game',
      metacritic: 85,
      rating: 4.5,
      platforms: ['PC', 'PS5'],
    };

    const mockSingle = jest.fn().mockResolvedValue({
      data: mockDatabaseData,
      error: null,
    });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({ game_id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockExpectedResponse);
    expect(supabase.from).toHaveBeenCalledWith('full_game_data');
    expect(mockSelect).toHaveBeenCalledWith(
      'release_year, developer, publisher, genres, slug, metacritic_score, rating, platforms',
    );
    expect(mockEq).toHaveBeenCalledWith('id', '1');
    expect(mockSingle).toHaveBeenCalled();
  });

  it('should return 400 if no game_id is provided', async () => {
    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({}) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Λάθος ID παιχνιδιού');
  });

  it('should return 500 if database query fails', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({ game_id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Database error');
  });

  it('should return 404 if no game details are found', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({ game_id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Game details not found');
  });

  it('should return 500 on unexpected server error', async () => {
    const mockSingle = jest.fn().mockRejectedValue(new Error('Unexpected error'));
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({ game_id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });
});
