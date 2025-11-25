import { GET } from './route';
import supabase from '@/lib/db';

jest.mock('@/lib/db', () => {
  const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
  const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
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

describe('GET /api/games', () => {
  it('should return a list of games sorted by title', async () => {
    const mockGames = [
      { id: 1, title: 'Game A', platform: 'PC' },
      { id: 2, title: 'Game B', platform: 'PS5' },
    ];

    const mockOrder = jest.fn().mockResolvedValue({
      data: mockGames,
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockGames);
    expect(supabase.from).toHaveBeenCalledWith('games');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('title', { ascending: true });
  });

  it('should return 500 if database query fails', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });

  it('should return 500 on unexpected server error', async () => {
    const mockOrder = jest.fn().mockRejectedValue(new Error('Unexpected error'));
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });

  it('should return an empty array if no games are found', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual([]);
    expect(supabase.from).toHaveBeenCalledWith('games');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('title', { ascending: true });
  });
});
