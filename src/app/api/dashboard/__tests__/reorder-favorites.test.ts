jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

const revalidatePathMock = jest.fn();
jest.mock('next/cache', () => ({
  __esModule: true,
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

import { POST } from '@/app/api/dashboard/reorder-favorites/route';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

function createRequest(jsonImpl: () => Promise<unknown>) {
  return {
    json: jsonImpl,
  } as { json: () => Promise<unknown> };
}

function createSupabaseMock({
  session = { user: { id: 'user-1' } },
  sessionError = null,
  allowedEntries = [{ id: 10 }, { id: 20 }, { id: 30 }],
  allowedEntriesError = null,
  updateErrors = [] as Array<{ message: string } | null>,
  pinError = null as { message: string } | null,
}) {
  const auth = {
    getSession: jest.fn().mockResolvedValue({
      data: { session },
      error: sessionError,
    }),
  };

  const rpc = jest.fn().mockResolvedValue({ error: pinError });

  let selectEqCalls = 0;
  const selectChain: {
    eq: jest.Mock;
    in: jest.Mock;
  } = {
    eq: jest.fn(() => {
      selectEqCalls += 1;
      if (selectEqCalls >= 4) {
        return Promise.resolve({ data: allowedEntries, error: allowedEntriesError });
      }
      return selectChain;
    }),
    in: jest.fn(() => selectChain),
  };
  const select = jest.fn(() => selectChain);

  let updateCallIndex = 0;
  const update = jest.fn(() => {
    const currentError = updateErrors[updateCallIndex] ?? null;
    updateCallIndex += 1;
    let updateEqCalls = 0;
    const updateChain: { eq: jest.Mock } = {
      eq: jest.fn(() => {
        updateEqCalls += 1;
        if (updateEqCalls >= 4) {
          return Promise.resolve({ error: currentError });
        }
        return updateChain;
      }),
    };
    return updateChain;
  });

  const from = jest.fn((table: string) => {
    if (table !== 'user_media_entries') {
      throw new Error(`Unexpected table ${table}`);
    }
    return { select, update };
  });

  return { auth, rpc, from, select, update };
}

describe('app/api/dashboard/reorder-favorites/route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when JSON body is invalid', async () => {
    const request = createRequest(async () => {
      throw new Error('invalid');
    });

    const response = await POST(request);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid JSON body' }, { status: 400 });
    expect(response.status).toBe(400);
    expect(createRouteHandlerClient).not.toHaveBeenCalled();
  });

  it('returns 400 when category is missing', async () => {
    const request = createRequest(async () => ({ category: '   ', order: [1, 2] }));
    const response = await POST(request);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Category is required' },
      { status: 400 },
    );
    expect(response.status).toBe(400);
  });

  it('returns 400 when category is not a string and order is not an array', async () => {
    const request = createRequest(async () => ({ category: 123, order: '1,2' }));
    const response = await POST(request);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Category is required' },
      { status: 400 },
    );
    expect(response.status).toBe(400);
  });

  it('returns 400 when order is missing', async () => {
    const request = createRequest(async () => ({ category: 'games', order: [] }));
    const response = await POST(request);
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Order is required' }, { status: 400 });
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid or duplicate entry identifiers', async () => {
    const invalidRequest = createRequest(async () => ({ category: 'games', order: [1, 'x'] }));
    const invalidResponse = await POST(invalidRequest);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Invalid entry identifiers' },
      { status: 400 },
    );
    expect(invalidResponse.status).toBe(400);

    const duplicateRequest = createRequest(async () => ({ category: 'games', order: [1, '1'] }));
    const duplicateResponse = await POST(duplicateRequest);
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Duplicate entry identifiers are not allowed' },
      { status: 400 },
    );
    expect(duplicateResponse.status).toBe(400);
  });

  it('returns 401 when session is missing or session lookup fails', async () => {
    const noSessionSupabase = createSupabaseMock({ session: null });
    (createRouteHandlerClient as jest.Mock).mockResolvedValueOnce(noSessionSupabase);
    const noSessionResponse = await POST(
      createRequest(async () => ({ category: 'games', order: [1] })),
    );
    expect(noSessionResponse.status).toBe(401);

    const sessionErrorSupabase = createSupabaseMock({
      session: { user: { id: 'u1' } },
      sessionError: { message: 'session failed' },
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValueOnce(sessionErrorSupabase);
    const sessionErrorResponse = await POST(
      createRequest(async () => ({ category: 'games', order: [1] })),
    );
    expect(sessionErrorResponse.status).toBe(401);
  });

  it('returns 500 when allowed entries query fails', async () => {
    const supabase = createSupabaseMock({
      allowedEntriesError: { message: 'query failed' },
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValueOnce(supabase);

    const response = await POST(
      createRequest(async () => ({ category: 'games', order: [10, 20] })),
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'query failed' });
  });

  it('returns 400 when no valid entries remain after filtering', async () => {
    const supabase = createSupabaseMock({
      allowedEntries: [{ id: 'bad' as unknown as number }, { id: Number.POSITIVE_INFINITY }],
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValueOnce(supabase);

    const response = await POST(
      createRequest(async () => ({ category: 'games', order: [10, 20] })),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'No valid entries to reorder' });
  });

  it('returns 400 when allowed entries are null (nullish fallback path)', async () => {
    const supabase = createSupabaseMock({
      allowedEntries: null as unknown as Array<{ id: number }>,
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValueOnce(supabase);

    const response = await POST(
      createRequest(async () => ({ category: 'games', order: [10, 20] })),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'No valid entries to reorder' });
  });

  it('returns 500 when any entry update fails', async () => {
    const supabase = createSupabaseMock({
      allowedEntries: [{ id: 10 }, { id: 20 }],
      updateErrors: [null, { message: 'update failed' }],
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValueOnce(supabase);

    const response = await POST(
      createRequest(async () => ({ category: 'games', order: [10, 20] })),
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'update failed' });
  });

  it('returns 500 when pin reorder rpc fails', async () => {
    const supabase = createSupabaseMock({
      allowedEntries: [{ id: 10 }, { id: 20 }, { id: 30 }],
      pinError: { message: 'pin failed' },
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValueOnce(supabase);

    const response = await POST(
      createRequest(async () => ({ category: 'games', order: [10, 20, 30] })),
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'pin failed' });
  });

  it('returns success, updates priorities, limits pin order to top 5, and revalidates dashboard', async () => {
    const supabase = createSupabaseMock({
      session: { user: { id: 'user-9' } },
      allowedEntries: [{ id: 10 }, { id: 20 }, { id: 30 }, { id: 40 }, { id: 50 }, { id: 60 }],
    });
    (createRouteHandlerClient as jest.Mock).mockResolvedValueOnce(supabase);

    const response = await POST(
      createRequest(async () => ({ category: 'games', order: ['10', 20, 30, 40, 50, 60] })),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(supabase.update).toHaveBeenCalledTimes(6);
    expect(supabase.rpc).toHaveBeenCalledWith('reorder_pins', {
      p_user_id: 'user-9',
      p_category: 'games',
      p_order: [10, 20, 30, 40, 50],
    });
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard');
  });
});
