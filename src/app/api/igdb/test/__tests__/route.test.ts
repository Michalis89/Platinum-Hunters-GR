import 'whatwg-fetch';
import { GET, runtime } from '@/app/api/igdb/test/route';
import { getIgdbAccessToken, getIgdbClientId } from '@/lib/igdb/token';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/igdb/token', () => ({
  getIgdbAccessToken: jest.fn(),
  getIgdbClientId: jest.fn(),
}));

describe('app/api/igdb/test route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getIgdbAccessToken as jest.Mock).mockResolvedValue('token-123');
    (getIgdbClientId as jest.Mock).mockReturnValue('client-456');
  });

  it('exports node runtime', () => {
    expect(runtime).toBe('nodejs');
  });

  it('returns 400 when id is missing', async () => {
    const res = await GET(new Request('http://localhost/api/igdb/test'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ ok: false, error: 'Missing id' });
  });

  it('returns 500 when IGDB request fails', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 503,
      text: async () => 'upstream down',
    })) as jest.Mock;

    const res = await GET(new Request('http://localhost/api/igdb/test?id=77'));
    const body = await res.json();

    expect(getIgdbAccessToken).toHaveBeenCalledTimes(1);
    expect(getIgdbClientId).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.igdb.com/v4/games',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Client-ID': 'client-456',
          Authorization: 'Bearer token-123',
        }),
      }),
    );
    expect(res.status).toBe(500);
    expect(body).toEqual({ ok: false, status: 503, body: 'upstream down' });
  });

  it('returns result payload when IGDB request succeeds', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: 7, name: 'Game 7' }]),
    })) as jest.Mock;

    const res = await GET(new Request('http://localhost/api/igdb/test?id=7'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      id: 7,
      result: { id: 7, name: 'Game 7' },
    });
  });

  it('returns null result when IGDB returns empty array', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    })) as jest.Mock;

    const res = await GET(new Request('http://localhost/api/igdb/test?id=99'));
    const body = await res.json();

    expect(body).toEqual({
      ok: true,
      id: 99,
      result: null,
    });
  });
});
