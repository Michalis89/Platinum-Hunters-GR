/**
 * @jest-environment node
 */

import 'whatwg-fetch';

const createRouteHandlerClientMock = jest.fn();
const requireAuthMock = jest.fn();

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  __esModule: true,
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: (...args: unknown[]) => createRouteHandlerClientMock(...args),
}));

jest.mock('@/lib/api/auth', () => ({
  __esModule: true,
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

import { GET } from '@/app/api/integrations/steam/sync/status/route';
import { UnauthorizedError } from '@/lib/api/auth';

function makeSupabase({ jobData = null as unknown, jobError = null as unknown } = {}) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: jobData, error: jobError });
  const eqUser = jest.fn().mockReturnValue({ maybeSingle });
  const eqId = jest.fn().mockReturnValue({ eq: eqUser });
  const select = jest.fn().mockReturnValue({ eq: eqId });
  const from = jest.fn().mockReturnValue({ select });
  return { from, spies: { maybeSingle, eqUser, eqId, select } };
}

describe('app/api/integrations/steam/sync/status/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAuthMock.mockResolvedValue({ user: { id: 'user-1' } });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when jobId query param is missing', async () => {
    const res = await GET(new Request('http://localhost/api/integrations/steam/sync/status'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing jobId parameter' });
  });

  it('returns 401 when auth fails with UnauthorizedError', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase());
    requireAuthMock.mockRejectedValueOnce(new UnauthorizedError('unauthorized'));

    const res = await GET(
      new Request('http://localhost/api/integrations/steam/sync/status?jobId=job-1'),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 500 when job fetch query fails', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({ jobError: { message: 'query fail' } }),
    );

    const res = await GET(
      new Request('http://localhost/api/integrations/steam/sync/status?jobId=job-1'),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to fetch job status' });
  });

  it('returns 404 when job is not found', async () => {
    createRouteHandlerClientMock.mockResolvedValue(makeSupabase({ jobData: null, jobError: null }));

    const res = await GET(
      new Request('http://localhost/api/integrations/steam/sync/status?jobId=job-1'),
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Job not found' });
  });

  it('returns mapped job payload when job exists', async () => {
    createRouteHandlerClientMock.mockResolvedValue(
      makeSupabase({
        jobData: {
          id: 'job-1',
          status: 'running',
          message: 'Syncing',
          percent: 42,
          completed_steps: 4,
          total_steps: 10,
          error: null,
          result: { imported: 7 },
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:02:00.000Z',
          finished_at: null,
        },
      }),
    );

    const res = await GET(
      new Request('http://localhost/api/integrations/steam/sync/status?jobId=job-1'),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      id: 'job-1',
      status: 'running',
      message: 'Syncing',
      percent: 42,
      completedSteps: 4,
      totalSteps: 10,
      error: null,
      result: { imported: 7 },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:02:00.000Z',
      finishedAt: null,
    });
  });

  it('returns 500 for unexpected errors', async () => {
    createRouteHandlerClientMock.mockRejectedValueOnce(new Error('boom'));

    const res = await GET(
      new Request('http://localhost/api/integrations/steam/sync/status?jobId=job-1'),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to check job status' });
    expect(console.error).toHaveBeenCalledWith('Status check error:', expect.any(Error));
  });
});
