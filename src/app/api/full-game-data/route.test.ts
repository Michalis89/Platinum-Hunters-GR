import { GET } from './route';
import supabase from '@/lib/db';

jest.mock('@/lib/db', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

describe('GET /api/games', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return games data successfully', async () => {
    const mockGames = [
      { id: 1, name: 'Game 1' },
      { id: 2, name: 'Game 2' },
    ];

    supabase.from().select.mockResolvedValue({
      data: mockGames,
      error: null,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockGames); // Fixed from .equal to .toEqual
    expect(supabase.from).toHaveBeenCalledWith('full_game_data');
    expect(supabase.from().select).toHaveBeenCalledWith('*');
  });

  it('should handle Supabase error', async () => {
    const errorMessage = 'Database error';
    supabase.from().select.mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: 'Αποτυχία φόρτωσης των παιχνιδιών' });
    expect(console.error).toHaveBeenCalledWith(
      '❌ Σφάλμα κατά τη φόρτωση των παιχνιδιών:',
      expect.any(Error),
    );
  });

  it('should handle unexpected errors', async () => {
    supabase.from().select.mockRejectedValue(new Error('Network error'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: 'Αποτυχία φόρτωσης των παιχνιδιών' });
    expect(console.error).toHaveBeenCalledWith(
      '❌ Σφάλμα κατά τη φόρτωση των παιχνιδιών:',
      expect.any(Error),
    );
  });
});

// Mock console.error
console.error = jest.fn();
