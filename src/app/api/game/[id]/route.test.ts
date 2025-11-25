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

describe('GET /api/games/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return game data for a valid game_id', async () => {
    const mockDatabaseGame = {
      id: '1',
      title: 'Test Game',
      platform: 'PC',
      game_image: '/test-image.png',
      trophy_platinum: 1,
      trophy_gold: 2,
      trophy_silver: 3,
      trophy_bronze: 4,
    };

    const mockExpectedResponse = {
      platinum: 1,
      gold: 2,
      silver: 3,
      bronze: 4,
    };

    const mockSingle = jest.fn().mockResolvedValue({
      data: mockDatabaseGame,
      error: null,
    });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockExpectedResponse);
    expect(supabase.from).toHaveBeenCalledWith('games');
    expect(mockSelect).toHaveBeenCalledWith('*');
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

  it('should return 400 if game_id is undefined', async () => {
    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({ id: undefined }) };

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
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Database error');
  });

  it('should return 404 if no game is found', async () => {
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
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Game not found');
  });

  it('should return 500 on unexpected server error', async () => {
    const mockSingle = jest.fn().mockRejectedValue(new Error('Unexpected error'));
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });
});
