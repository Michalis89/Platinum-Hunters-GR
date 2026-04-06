/**
 * @jest-environment node
 */

// ─── Mock setup ───────────────────────────────────────────────────────────

const mockCreateRouteHandlerClient = jest.fn();
const mockGetSupabaseServer = jest.fn();
const mockRequireAuth = jest.fn();

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: (...args: unknown[]) => mockCreateRouteHandlerClient(...args),
}));

jest.mock('@/lib/supabase-server', () => ({
  __esModule: true,
  default: () => mockGetSupabaseServer(),
}));

jest.mock('@/lib/api/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(msg = 'unauthorized') {
      super(msg);
      this.name = 'UnauthorizedError';
    }
  },
}));

jest.mock('@/lib/observability/withApiRoute', () => ({
  withApiRoute: (handler: unknown) => handler,
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────

import { GET, POST } from '../route';
import { UnauthorizedError } from '@/lib/api/auth';

// ─── Supabase fluent-chain factory ────────────────────────────────────────

/**
 * Creates a Proxy that behaves as both a fluent builder (every method
 * returns itself) and a Promise (thenable, resolves to `result`).
 * This covers all Supabase chaining patterns: .select().eq().order(),
 * .insert().select().single(), .from(...).insert(), etc.
 */
type SupabaseChain = PromiseLike<unknown> & {
  [method: string]: (...args: unknown[]) => SupabaseChain;
};

function makeChain(result: unknown): SupabaseChain {
  const p = Promise.resolve(result);
  const proxy = new Proxy(function () {}, {
    get(_t, prop: string) {
      if (prop === 'then') {
        return p.then.bind(p);
      }
      if (prop === 'catch') {
        return p.catch.bind(p);
      }
      if (prop === 'finally') {
        return p.finally.bind(p);
      }
      return () => proxy;
    },
    apply() {
      return proxy;
    },
  }) as SupabaseChain;
  return proxy;
}

/**
 * Creates a Supabase client mock.
 * `tables` maps table name → resolved value for any chain on that table.
 * `session` is used by `auth.getSession()`.
 */
function makeSupabase({ tables = {} as Record<string, unknown>, session = null as unknown } = {}) {
  return {
    auth: {
      getSession: async () => ({ data: { session } }),
    },
    from: jest.fn((table: string) => {
      const result = tables[table] ?? { data: [], error: null };
      return makeChain(result);
    }),
  };
}

// ─── Request helpers ──────────────────────────────────────────────────────

function makeGetRequest() {
  return new Request('http://localhost/api/support/tickets', { method: 'GET' });
}

function makePostRequest(fields: Record<string, string | File | (string | File)[]>): Request {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        formData.append(key, v);
      }
    } else {
      formData.append(key, value);
    }
  }
  return new Request('http://localhost/api/support/tickets', {
    method: 'POST',
    body: formData,
  });
}

function makeFile(name: string, type = 'image/png', sizeBytes = 100): File {
  return new File(['x'.repeat(sizeBytes)], name, { type });
}

// ─── Shared valid POST field sets ─────────────────────────────────────────

const BASE_FIELDS = {
  subject: 'Cannot submit form',
  description: 'Clicking submit does nothing',
  name: 'Alice',
  email: 'alice@example.com',
  consent: 'true',
};

const BUG_FIELDS = {
  ...BASE_FIELDS,
  category: 'bug',
  steps_to_reproduce: '1. Open page 2. Click submit',
  expected: 'Form submits',
  actual: 'Nothing happens',
  severity: 'medium',
};

const FEATURE_FIELDS = {
  ...BASE_FIELDS,
  category: 'feature',
  use_case: 'Dark mode for long sessions',
  value: 'Reduces eye strain',
  urgency: 'important',
};

// ─── Shared admin client mock ─────────────────────────────────────────────

const mockStorageFrom = jest.fn();
const mockUpload = jest.fn().mockResolvedValue({ error: null });
const mockRemove = jest.fn().mockResolvedValue({});

const adminClient = {
  storage: {
    from: mockStorageFrom,
  },
};

// ─── GET handler ──────────────────────────────────────────────────────────

describe('GET /api/support/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue(makeSupabase());
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('no auth'));

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns 500 when tickets fetch fails', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: { support_tickets: { data: null, error: { message: 'db error' } } },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
  });

  it('returns empty array when user has no tickets (early exit)', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({ tables: { support_tickets: { data: [], error: null } } }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('returns 500 when reads fetch fails', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [{ id: 't1', created_at: '2024-01-01' }], error: null },
          support_ticket_reads: { data: null, error: { message: 'reads fail' } },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
  });

  it('returns 500 when admin messages fetch fails', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [{ id: 't1', created_at: '2024-01-01' }], error: null },
          support_ticket_reads: { data: [], error: null },
          support_messages: { data: null, error: { message: 'messages fail' } },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
  });

  it('returns 500 when status events fetch fails', async () => {
    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [{ id: 't1', created_at: '2024-01-01' }], error: null },
          support_ticket_reads: { data: [], error: null },
          support_messages: { data: [], error: null },
          support_ticket_events: { data: null, error: { message: 'events fail' } },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
  });

  it('returns enriched tickets with unread reply count', async () => {
    const ticket = {
      id: 't1',
      category: 'bug',
      subject: 'Test',
      status: 'open',
      severity: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      assigned_to: null,
      labels: null,
      user_archived: false,
      user_deleted: false,
    };
    const adminMessage = {
      ticket_id: 't1',
      created_at: '2024-01-03T00:00:00Z', // after last_read_at → unread
    };
    const readEntry = {
      ticket_id: 't1',
      last_read_at: '2024-01-02T00:00:00Z',
    };

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [readEntry], error: null },
          support_messages: { data: [adminMessage], error: null },
          support_ticket_events: { data: [], error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].unread_reply_count).toBe(1);
    expect(body.data[0].has_unread_reply).toBe(true);
    expect(body.data[0].status_changed_since_read).toBe(false);
  });

  it('marks message as read when it was sent before last_read_at', async () => {
    const ticket = { id: 't1', created_at: '2024-01-01T00:00:00Z', status: 'open' };
    const adminMessage = {
      ticket_id: 't1',
      created_at: '2024-01-01T12:00:00Z', // before last_read_at → read
    };
    const readEntry = { ticket_id: 't1', last_read_at: '2024-01-02T00:00:00Z' };

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [readEntry], error: null },
          support_messages: { data: [adminMessage], error: null },
          support_ticket_events: { data: [], error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    expect(body.data[0].unread_reply_count).toBe(0);
    expect(body.data[0].has_unread_reply).toBe(false);
  });

  it('uses ticket created_at as baseline when no read entry exists', async () => {
    const ticket = { id: 't1', created_at: '2024-01-01T00:00:00Z', status: 'open' };
    const adminMessage = {
      ticket_id: 't1',
      created_at: '2024-01-02T00:00:00Z', // after created_at with no read entry → unread
    };

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [], error: null },
          support_messages: { data: [adminMessage], error: null },
          support_ticket_events: { data: [], error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    expect(body.data[0].unread_reply_count).toBe(1);
  });

  it('handles read entry with null last_read_at (falls back to created_at)', async () => {
    const ticket = { id: 't1', created_at: '2024-01-01T00:00:00Z', status: 'open' };
    const adminMessage = { ticket_id: 't1', created_at: '2024-01-02T00:00:00Z' };
    const readEntry = { ticket_id: 't1', last_read_at: null }; // null → not stored in map

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [readEntry], error: null },
          support_messages: { data: [adminMessage], error: null },
          support_ticket_events: { data: [], error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    // Falls back to created_at baseline → message after created_at → unread
    expect(body.data[0].unread_reply_count).toBe(1);
  });

  it('enriches status change events when unread', async () => {
    const ticket = { id: 't1', created_at: '2024-01-01T00:00:00Z', status: 'resolved' };
    const statusEvent = {
      ticket_id: 't1',
      created_at: '2024-01-03T00:00:00Z', // after baseline → unread
      payload: { to: 'resolved' },
    };

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [], error: null },
          support_messages: { data: [], error: null },
          support_ticket_events: { data: [statusEvent], error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    expect(body.data[0].status_changed_since_read).toBe(true);
    expect(body.data[0].status_changed_to).toBe('resolved');
  });

  it('ignores duplicate status events for same ticket (takes first only)', async () => {
    const ticket = { id: 't1', created_at: '2024-01-01T00:00:00Z', status: 'resolved' };
    const events = [
      { ticket_id: 't1', created_at: '2024-01-03T00:00:00Z', payload: { to: 'resolved' } },
      { ticket_id: 't1', created_at: '2024-01-02T00:00:00Z', payload: { to: 'in_progress' } },
    ];

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [], error: null },
          support_messages: { data: [], error: null },
          support_ticket_events: { data: events, error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    // Only first event per ticket is stored
    expect(body.data[0].status_changed_to).toBe('resolved');
  });

  it('ignores status event when payload is not an object or has no string "to"', async () => {
    const events = [
      { ticket_id: 't1', created_at: '2024-01-03T00:00:00Z', payload: null },
      { ticket_id: 't2', created_at: '2024-01-03T00:00:00Z', payload: [1, 2, 3] }, // array
      { ticket_id: 't3', created_at: '2024-01-03T00:00:00Z', payload: { to: 42 } }, // non-string
      { ticket_id: 't4', created_at: '2024-01-03T00:00:00Z', payload: { to: '  ' } }, // blank
    ];

    const tickets = [
      { id: 't1', created_at: '2024-01-01T00:00:00Z', status: 'open' },
      { id: 't2', created_at: '2024-01-01T00:00:00Z', status: 'open' },
      { id: 't3', created_at: '2024-01-01T00:00:00Z', status: 'open' },
      { id: 't4', created_at: '2024-01-01T00:00:00Z', status: 'open' },
    ];

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: tickets, error: null },
          support_ticket_reads: { data: [], error: null },
          support_messages: { data: [], error: null },
          support_ticket_events: { data: events, error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    // All four tickets: status_changed_since_read=true but to_status=null
    for (const t of body.data) {
      expect(t.status_changed_to).toBeNull();
    }
  });

  it('ignores read status event (event before last_read_at)', async () => {
    const ticket = { id: 't1', created_at: '2024-01-01T00:00:00Z', status: 'open' };
    const readEntry = { ticket_id: 't1', last_read_at: '2024-01-05T00:00:00Z' };
    const statusEvent = {
      ticket_id: 't1',
      created_at: '2024-01-03T00:00:00Z', // BEFORE last_read_at → already read
      payload: { to: 'resolved' },
    };

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [readEntry], error: null },
          support_messages: { data: [], error: null },
          support_ticket_events: { data: [statusEvent], error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    expect(body.data[0].status_changed_since_read).toBe(false);
  });

  it('returns 500 on unexpected error in catch block', async () => {
    mockCreateRouteHandlerClient.mockRejectedValue(new Error('unexpected'));

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
  });

  it('handles admin message with null created_at (ternary false branch → not unread)', async () => {
    const ticket = { id: 't1', created_at: '2024-01-01T00:00:00Z', status: 'open' };
    const adminMessage = { ticket_id: 't1', created_at: null }; // null → ternary false → not unread

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [], error: null },
          support_messages: { data: [adminMessage], error: null },
          support_ticket_events: { data: [], error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    // baseline = '2024-01-01' (created_at), message.created_at = null → ternary = false → not unread
    expect(body.data[0].unread_reply_count).toBe(0);
  });

  it('handles status event with null created_at (event ternary false branch)', async () => {
    const ticket = { id: 't1', created_at: '2024-01-01T00:00:00Z', status: 'open' };
    const event = { ticket_id: 't1', created_at: null, payload: { to: 'resolved' } };

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [], error: null },
          support_messages: { data: [], error: null },
          support_ticket_events: { data: [event], error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    // event.created_at is null → ternary false → isUnread = false → event skipped
    expect(body.data[0].status_changed_since_read).toBe(false);
  });

  it('handles ticket with null created_at (ticketCreatedAt ?? null and null baseline)', async () => {
    const ticket = { id: 't1', created_at: null, status: 'open' }; // null created_at
    const adminMessage = { ticket_id: 't1', created_at: '2024-01-02T00:00:00Z' };

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [], error: null },
          support_messages: { data: [adminMessage], error: null },
          support_ticket_events: { data: [], error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    // baseline = null (no read, no created_at) → !baseline = true → message is unread
    expect(body.data[0].unread_reply_count).toBe(1);
  });

  it('handles multiple unread messages for same ticket (unreadReplyCount ?? 0 left branch)', async () => {
    const ticket = { id: 't1', created_at: '2024-01-01T00:00:00Z', status: 'open' };
    const messages = [
      { ticket_id: 't1', created_at: '2024-01-03T00:00:00Z' }, // first → ?? 0 right side → 0+1=1
      { ticket_id: 't1', created_at: '2024-01-04T00:00:00Z' }, // second → ?? 0 left side (1) → 1+1=2
    ];

    mockCreateRouteHandlerClient.mockResolvedValue(
      makeSupabase({
        tables: {
          support_tickets: { data: [ticket], error: null },
          support_ticket_reads: { data: [], error: null },
          support_messages: { data: messages, error: null },
          support_ticket_events: { data: [], error: null },
        },
      }),
    );
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const res = await GET(makeGetRequest());
    const body = await res.json();
    expect(body.data[0].unread_reply_count).toBe(2);
  });
});

// ─── POST handler ─────────────────────────────────────────────────────────

describe('POST /api/support/tickets', () => {
  const mockSession = {
    user: { id: 'user-1', email: 'user@example.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockStorageFrom.mockReturnValue({ upload: mockUpload, remove: mockRemove });
    mockGetSupabaseServer.mockReturnValue(adminClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Validation guards ──────────────────────────────────────────────────

  it('returns 400 for invalid category', async () => {
    const supabase = makeSupabase({ session: null });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'invalid' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid category');
  });

  it('returns 400 when subject is missing', async () => {
    const supabase = makeSupabase({ session: null });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'general', subject: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Subject and description are required');
  });

  it('returns 400 when description is missing', async () => {
    const supabase = makeSupabase({ session: null });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', description: '' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when consent is false', async () => {
    const supabase = makeSupabase({ session: null });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', consent: 'false' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('data storage');
  });

  it('returns 401 when no session', async () => {
    const supabase = makeSupabase({ session: null });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'general' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when email cannot be resolved', async () => {
    // session exists but no email from session or form
    const supabase = makeSupabase({
      session: { user: { id: 'user-1', email: undefined } },
      tables: {
        users: { data: { display_name: null, username: null, email: null }, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'general', email: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Email is required');
  });

  // ── Bug category ───────────────────────────────────────────────────────

  it('returns 400 for bug with missing steps/expected/actual', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(
      makePostRequest({
        ...BASE_FIELDS,
        category: 'bug',
        steps_to_reproduce: '',
        expected: '',
        actual: '',
        severity: 'medium',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('steps');
  });

  it('returns 400 for bug with invalid severity', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...BUG_FIELDS, severity: 'extreme' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('severity');
  });

  it('creates bug ticket successfully (201)', async () => {
    const ticket = { id: 'ticket-bug-1', user_id: 'user-1' };
    const message = { id: 'msg-1', ticket_id: 'ticket-bug-1' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: { display_name: 'Alice', username: 'alice', email: 'alice@example.com' } },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest(BUG_FIELDS));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.ticket_id).toBe('ticket-bug-1');
  });

  // ── Feature category ───────────────────────────────────────────────────

  it('returns 400 for feature with missing use_case or value', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...FEATURE_FIELDS, use_case: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('use case');
  });

  it('returns 400 for feature with invalid urgency', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...FEATURE_FIELDS, urgency: 'critical' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('priority');
  });

  it('creates feature ticket successfully (201)', async () => {
    const ticket = { id: 'ticket-feat-1' };
    const message = { id: 'msg-feat-1' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest(FEATURE_FIELDS));
    expect(res.status).toBe(201);
  });

  // ── Author rights category ─────────────────────────────────────────────

  it('returns 400 for author_rights with missing reason', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'author_rights', reason: '' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('reason');
  });

  it('creates author_rights ticket with optional fields (201)', async () => {
    const ticket = { id: 'ticket-ar-1' };
    const message = { id: 'msg-ar-1' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(
      makePostRequest({
        ...BASE_FIELDS,
        category: 'author_rights',
        reason: 'I own this content',
        profile_link: 'https://example.com/profile',
        portfolio_links: 'https://a.com, https://b.com',
        requested_permissions: JSON.stringify(['edit', 'delete']),
      }),
    );
    expect(res.status).toBe(201);
  });

  it('creates author_rights ticket without optional fields (201)', async () => {
    const ticket = { id: 'ticket-ar-2' };
    const message = { id: 'msg-ar-2' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'author_rights', reason: 'DMCA claim' }),
    );
    expect(res.status).toBe(201);
  });

  // ── General category ───────────────────────────────────────────────────

  it('creates general ticket with topic (201)', async () => {
    const ticket = { id: 'ticket-gen-1' };
    const message = { id: 'msg-gen-1' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', topic: 'Account questions' }),
    );
    expect(res.status).toBe(201);
  });

  it('creates general ticket without topic (201)', async () => {
    const ticket = { id: 'ticket-gen-2' };
    const message = { id: 'msg-gen-2' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'general' }));
    expect(res.status).toBe(201);
  });

  // ── Attachment validation ──────────────────────────────────────────────

  it('returns 400 for too many attachments', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const files = Array.from({ length: 6 }, (_, i) => makeFile(`f${i}.png`));
    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', attachments: files }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('up to 5 files');
  });

  it('returns 400 for invalid file type', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const badFile = makeFile('script.js', 'application/javascript');
    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', attachments: [badFile] }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Only PNG');
  });

  it('returns 400 for file exceeding 5MB', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const bigFile = makeFile('huge.pdf', 'application/pdf', 6 * 1024 * 1024);
    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', attachments: [bigFile] }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('5MB');
  });

  // ── DB error paths ─────────────────────────────────────────────────────

  it('returns 500 when ticket insert fails', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: null, error: { message: 'insert fail' } },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'general' }));
    expect(res.status).toBe(500);
  });

  it('returns 500 when message insert fails', async () => {
    const ticket = { id: 'ticket-1' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: null, error: { message: 'msg insert fail' } },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'general' }));
    expect(res.status).toBe(500);
  });

  // ── File upload paths ──────────────────────────────────────────────────

  it('creates ticket successfully with a valid file attachment (201)', async () => {
    const ticket = { id: 'ticket-attach-1' };
    const message = { id: 'msg-attach-1' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
        support_attachments: { error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);
    mockUpload.mockResolvedValue({ error: null });

    const file = makeFile('screenshot.png', 'image/png', 100);
    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', attachments: [file] }),
    );
    expect(res.status).toBe(201);
    expect(mockUpload).toHaveBeenCalled();
  });

  it('returns 500 when file storage upload fails', async () => {
    const ticket = { id: 'ticket-upload-fail' };
    const message = { id: 'msg-upload-fail' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);
    mockUpload.mockResolvedValue({ error: { message: 'storage error' } });

    const file = makeFile('screenshot.png', 'image/png', 100);
    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', attachments: [file] }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('upload failed');
  });

  it('returns 500 when attachment DB insert fails (removes uploaded file)', async () => {
    const ticket = { id: 'ticket-db-fail' };
    const message = { id: 'msg-db-fail' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
        support_attachments: { error: { message: 'attach insert fail' } },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);
    mockUpload.mockResolvedValue({ error: null });

    const file = makeFile('doc.pdf', 'application/pdf', 100);
    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', attachments: [file] }),
    );
    expect(res.status).toBe(500);
    expect(mockRemove).toHaveBeenCalled(); // cleanup after failed insert
  });

  // ── User profile enrichment ────────────────────────────────────────────

  it('uses session email and profile display_name when form fields are empty', async () => {
    const ticket = { id: 'ticket-profile-1' };
    const message = { id: 'msg-profile-1' };
    const supabase = makeSupabase({
      session: { user: { id: 'user-1', email: 'session@example.com' } },
      tables: {
        users: {
          data: {
            display_name: 'Profile Name',
            username: 'username1',
            email: 'profile@example.com',
          },
        },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', name: '', email: '' }),
    );
    expect(res.status).toBe(201);
  });

  it('falls back to username when display_name is null', async () => {
    const ticket = { id: 'ticket-profile-2' };
    const message = { id: 'msg-profile-2' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: {
          data: { display_name: null, username: 'user123', email: 'u@example.com' },
        },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'general', name: '' }));
    expect(res.status).toBe(201);
  });

  // ── Catch block ────────────────────────────────────────────────────────

  it('returns 500 on unexpected error in catch block', async () => {
    mockCreateRouteHandlerClient.mockRejectedValue(new Error('connection error'));

    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'general' }));
    expect(res.status).toBe(500);
  });

  // ── coerceBoolean edge cases ───────────────────────────────────────────

  it('accepts consent=on as truthy', async () => {
    const supabase = makeSupabase({ session: null });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    // With consent='on', should pass consent check and reach the no-session 401
    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'general', consent: 'on' }));
    // Reaches the session check, fails with 401
    expect(res.status).toBe(401);
  });

  it('accepts consent=1 as truthy', async () => {
    const supabase = makeSupabase({ session: null });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'general', consent: '1' }));
    expect(res.status).toBe(401); // reaches session check
  });

  // ── parseOptionalJson ──────────────────────────────────────────────────

  it('ignores invalid JSON in environment field', async () => {
    const ticket = { id: 'ticket-json-1' };
    const message = { id: 'msg-json-1' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    // Invalid JSON for environment → parseOptionalJson returns null, ticket is still created
    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', environment: '{invalid json}' }),
    );
    expect(res.status).toBe(201);
  });

  // ── Filename edge cases ────────────────────────────────────────────────

  it('uploads file with no extension (pop() || "file" fallback)', async () => {
    const ticket = { id: 'ticket-noext-1' };
    const message = { id: 'msg-noext-1' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
        support_attachments: { error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);
    mockUpload.mockResolvedValue({ error: null });

    // File named "." → split('.') = ['',''] → pop() = '' → falsy → uses 'file'
    const file = new File(['data'], '.', { type: 'image/png' });
    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', attachments: [file] }),
    );
    expect([200, 201]).toContain(res.status);
  });

  it('uploads file with name that sanitizes to empty (safeName fallback)', async () => {
    const ticket = { id: 'ticket-noname-1' };
    const message = { id: 'msg-noname-1' };
    const supabase = makeSupabase({
      session: mockSession,
      tables: {
        users: { data: null },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
        support_attachments: { error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);
    mockUpload.mockResolvedValue({ error: null });

    // File named "!!!" → sanitizeFilename returns '' → uses `attachment.${ext}` fallback
    const file = new File(['data'], '!!!', { type: 'image/png' });
    const res = await POST(
      makePostRequest({ ...BASE_FIELDS, category: 'general', attachments: [file] }),
    );
    expect([200, 201]).toContain(res.status);
  });

  // ── coerceBoolean File branch ──────────────────────────────────────────

  it('treats File as consent=false (coerceBoolean File branch → 400)', async () => {
    const supabase = makeSupabase({ session: null });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    // File as 'consent' → typeof value !== 'string' → coerceBoolean returns false → 400
    const fields: Record<string, string | File | (string | File)[]> = {
      ...BASE_FIELDS,
      category: 'general',
      consent: makeFile('c.png'),
    };
    const res = await POST(makePostRequest(fields));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('data storage');
  });

  // ── OPTIONS handler ────────────────────────────────────────────────────

  it('OPTIONS returns 200', async () => {
    const { OPTIONS } = await import('../route');
    const res = await OPTIONS();
    expect(res.status).toBe(200);
  });

  // ── null ?? '' branch coverage (absent FormData fields) ────────────────

  it('returns 400 when category field is absent from form (null ?? "" branch line 240)', async () => {
    const supabase = makeSupabase({ session: null });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    // No category field → formData.get('category') returns null → null ?? '' → ''
    const res = await POST(
      makePostRequest({ subject: 'Test', description: 'Test desc', consent: 'true' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid category');
  });

  it('returns 400 when subject and description fields are absent (null ?? "" branches lines 241-244)', async () => {
    const supabase = makeSupabase({ session: null });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    // Only category + consent — subject/description/name/email all absent
    // formData.get('subject') → null → null ?? '' → '' (line 241 null branch)
    // formData.get('description') → null → null ?? '' → '' (line 242 null branch)
    // formData.get('name') → null → null ?? '' → '' (line 243 null branch)
    // formData.get('email') → null → null ?? '' → '' (line 244 null branch)
    const res = await POST(makePostRequest({ category: 'general', consent: 'true' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Subject and description');
  });

  it('saves null name when name+email absent from form and profile names are null (lines 272, 371)', async () => {
    const ticket = { id: 'ticket-null-name' };
    const message = { id: 'msg-null-name' };
    const supabase = makeSupabase({
      session: { user: { id: 'user-1', email: 'session@example.com' } },
      tables: {
        users: { data: { display_name: null, username: null, email: null } },
        support_tickets: { data: ticket, error: null },
        support_messages: { data: message, error: null },
      },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    // name and email absent from form → null ?? '' → '' for each
    // resolvedEmail = '' || 'session@example.com' → passes email check
    // resolvedName = '' || null || null || '' → '' (line 272 || '' right branch)
    // name: '' || null → null (line 371 || null right branch)
    const res = await POST(
      makePostRequest({
        subject: 'Test subject',
        description: 'Test description',
        consent: 'true',
        category: 'general',
        // name intentionally absent (null ?? '')
        // email intentionally absent (null ?? '')
      }),
    );
    expect(res.status).toBe(201);
  });

  it('returns 400 for bug category with all bug fields absent (null ?? "" branches lines 294-297)', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    // steps_to_reproduce, expected, actual, severity all absent → null ?? '' → ''
    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'bug' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('steps');
  });

  it('returns 400 for feature category with all feature fields absent (null ?? "" branches lines 313-315)', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    // use_case, value, urgency all absent → null ?? '' → ''
    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'feature' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('use case');
  });

  it('returns 400 for author_rights with reason field absent (null ?? "" branch line 332)', async () => {
    const supabase = makeSupabase({
      session: mockSession,
      tables: { users: { data: null } },
    });
    mockCreateRouteHandlerClient.mockResolvedValue(supabase);

    // reason absent → null ?? '' → ''
    const res = await POST(makePostRequest({ ...BASE_FIELDS, category: 'author_rights' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('reason');
  });
});
