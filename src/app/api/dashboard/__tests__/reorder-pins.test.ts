jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

import { POST } from '@/app/api/dashboard/reorder-pins/route';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

function createRequest(jsonImpl: () => Promise<unknown>) {
  return {
    json: jsonImpl,
  } as { json: () => Promise<unknown> };
}

function createSupabaseMock({
  session,
  sessionError = null,
  rpcError = null,
}: {
  session: unknown;
  sessionError?: unknown;
  rpcError?: { message: string } | null;
}) {
  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session },
        error: sessionError,
      }),
    },
    rpc: jest.fn().mockResolvedValue({
      error: rpcError,
    }),
  };
}

describe('app/api/dashboard/reorder-pins/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when the request body is not valid JSON', async () => {
    const request = createRequest(async () => {
      throw new Error('invalid');
    });

    const response = await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid JSON body' }, { status: 400 });
    expect(response.status).toBe(400);
    expect(createRouteHandlerClient).not.toHaveBeenCalled();
  });

  it('returns 400 when category is missing after normalization', async () => {
    const request = createRequest(async () => ({
      category: '   ',
      order: [1, 2],
    }));

    const response = await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Category is required' },
      { status: 400 },
    );
    expect(response.status).toBe(400);
    expect(createRouteHandlerClient).not.toHaveBeenCalled();
  });

  it('returns 400 when category is not a string and order is not an array', async () => {
    const request = createRequest(async () => ({
      category: 123,
      order: '1,2,3',
    }));

    const response = await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Category is required' },
      { status: 400 },
    );
    expect(response.status).toBe(400);
    expect(createRouteHandlerClient).not.toHaveBeenCalled();
  });

  it('returns 400 when more than five pinned ids are provided', async () => {
    const request = createRequest(async () => ({
      category: 'games',
      order: [1, 2, 3, 4, 5, 6],
    }));

    const response = await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Pinned order cannot exceed five items' },
      { status: 400 },
    );
    expect(response.status).toBe(400);
    expect(createRouteHandlerClient).not.toHaveBeenCalled();
  });

  it('returns 400 when at least one entry id is not numeric', async () => {
    const request = createRequest(async () => ({
      category: 'games',
      order: [1, 'oops'],
    }));

    const response = await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Invalid entry identifiers' },
      { status: 400 },
    );
    expect(response.status).toBe(400);
    expect(createRouteHandlerClient).not.toHaveBeenCalled();
  });

  it('returns 401 when there is no authenticated session', async () => {
    const supabase = createSupabaseMock({
      session: null,
    });
    const request = createRequest(async () => ({
      category: 'games',
      order: [1, 2],
    }));
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);

    const response = await POST(request);

    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
    expect(response.status).toBe(401);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('returns 401 when session lookup itself fails', async () => {
    const supabase = createSupabaseMock({
      session: { user: { id: 'user-1' } },
      sessionError: { message: 'session failed' },
    });
    const request = createRequest(async () => ({
      category: 'games',
      order: [1, 2],
    }));
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);

    const response = await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
    expect(response.status).toBe(401);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('returns 500 when the reorder RPC fails', async () => {
    const supabase = createSupabaseMock({
      session: { user: { id: 'user-7' } },
      rpcError: { message: 'rpc failed' },
    });
    const request = createRequest(async () => ({
      category: ' games ',
      order: ['10', 20],
    }));
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);

    const response = await POST(request);

    expect(supabase.rpc).toHaveBeenCalledWith('reorder_pins', {
      p_user_id: 'user-7',
      p_category: 'games',
      p_order: [10, 20],
    });
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'rpc failed' }, { status: 500 });
    expect(response.status).toBe(500);
  });

  it('returns success when the authenticated reorder completes', async () => {
    const supabase = createSupabaseMock({
      session: { user: { id: 'user-9' } },
    });
    const request = createRequest(async () => ({
      category: 'movies',
      order: [1, '2', 3],
    }));
    (createRouteHandlerClient as jest.Mock).mockResolvedValue(supabase);

    const response = await POST(request);
    const body = await response.json();

    expect(supabase.rpc).toHaveBeenCalledWith('reorder_pins', {
      p_user_id: 'user-9',
      p_category: 'movies',
      p_order: [1, 2, 3],
    });
    expect(NextResponse.json).toHaveBeenCalledWith({ success: true });
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
  });
});
