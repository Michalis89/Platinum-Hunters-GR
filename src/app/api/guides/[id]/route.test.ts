import { GET } from './route';
import supabase from '@/lib/db';

jest.mock('@/lib/db', () => {
  const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
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

describe.skip('GET /api/guides/[id]', () => {
  it('should return guides for a valid game_id', async () => {
    const mockDatabaseGuides = [
      {
        game_id: '1',
        difficulty: 'Easy',
        difficulty_color: 'green',
        playthroughs: 1,
        playthroughs_color: 'blue',
        hours: 10,
        hours_color: 'yellow',
        guide_steps: [
          {
            step_order: 1,
            title: 'Step 1',
            description: 'Description 1',
            trophies: [],
          },
        ],
      },
    ];

    const mockExpectedResponse = [
      {
        game_id: '1',
        difficulty: 'Easy',
        difficulty_color: 'green',
        playthroughs: 1,
        playthroughs_color: 'blue',
        hours: 10,
        hours_color: 'yellow',
        guide_steps: undefined,
        steps: [
          {
            title: 'Step 1',
            description: 'Description 1',
            trophies: [],
          },
        ],
      },
    ];

    const mockEq = jest.fn().mockResolvedValue({
      data: mockDatabaseGuides,
      error: null,
    });
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
    expect(supabase.from).toHaveBeenCalledWith('guides');
    expect(mockSelect).toHaveBeenCalledWith(`
        *,
        guide_steps (*)
      `);
    expect(mockEq).toHaveBeenCalledWith('game_id', '1');
  });

  it('should return 400 if no ID is provided', async () => {
    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({}) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Λάθος ID οδηγού');
  });

  it('should return 500 if database query fails', async () => {
    const mockEq = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Σφάλμα βάσης δεδομένων');
  });

  it('should return 404 if no guides are found', async () => {
    const mockEq = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Ο οδηγός δεν βρέθηκε');
  });

  it('should return 500 on unexpected server error', async () => {
    const mockEq = jest.fn().mockRejectedValue(new Error('Unexpected error'));
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const req = new Request('http://localhost:3000');
    const context = { params: Promise.resolve({ id: '1' }) };

    const response = await GET(req, context);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Εσωτερικό σφάλμα διακομιστή');
  });
});
