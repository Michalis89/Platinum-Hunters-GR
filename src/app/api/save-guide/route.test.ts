import { POST } from './route';
import supabase from '@/lib/db';

jest.mock('@/lib/db', () => ({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
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

describe('POST /api/save-guide', () => {
  const mockRequestBody = {
    title: 'Test Game',
    platform: 'PC',
    gameImage: '/test-image.png',
    trophies: { Platinum: '1', Gold: '2', Silver: '3', Bronze: '4' },
    difficulty: 'Easy',
    difficultyColor: 'green',
    playthroughs: 1,
    playthroughsColor: 'blue',
    hours: 10,
    hoursColor: 'yellow',
    steps: ['Step 1', 'Step 2'],
  };

  it('should save a new game and guide successfully', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          title: 'Test Game',
          platform: 'PC',
          game_image: '/test-image.png',
          platinum: 1,
          gold: 2,
          silver: 3,
          bronze: 4,
        },
        error: null,
      }),
    });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { game_id: 1, difficulty: 'Easy', playthroughs: 1, hours: 10 },
        error: null,
      }),
    });

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('✅ Ο οδηγός αποθηκεύτηκε!');
    expect(json.game).toBeDefined();
    expect(json.guide).toBeDefined();
  });

  it('should return 409 if game already exists', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 1, title: 'Test Game', platform: 'PC' },
        error: null,
      }),
    });

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.message).toBe('⚠️ Ο οδηγός "Test Game" υπάρχει ήδη στη βάση!');
    expect(json.existingData).toBeDefined();
  });

  it('should return 500 if database search fails', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST999', message: 'Database error' },
      }),
    });

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Database search error');
  });

  it('should return 500 if game insert fails', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert error' },
      }),
    });

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Database insert error');
  });

  it('should return 500 if guide insert fails', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 1, title: 'Test Game', platform: 'PC' },
        error: null,
      }),
    });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Guide insert error' },
      }),
    });

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Guide insert error');
  });

  it('should handle invalid JSON in request body', async () => {
    const req = new Request('http://localhost:3000', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });
});
