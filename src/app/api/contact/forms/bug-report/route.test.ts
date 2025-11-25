import { POST } from './route';
import supabase from '@/lib/db';

jest.mock('@/lib/db', () => {
  const mockInsert = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  const mockUpload = jest.fn().mockResolvedValue({ error: null });
  return {
    from: jest.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    })),
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
      })),
    },
  };
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

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

describe('POST /api/bug-report', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should submit a bug report successfully without a file', async () => {
    const formData = new FormData();
    formData.append('bug_type', 'UI');
    formData.append('description', 'Button misaligned');

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

    const req = {
      formData: jest.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('✅ Η αναφορά υποβλήθηκε επιτυχώς!');
    expect(supabase.from).toHaveBeenCalledWith('submissions');
    expect(supabase.from).toHaveBeenCalledWith('bug_reports');
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it('should submit a bug report successfully with a file', async () => {
    const formData = new FormData();
    formData.append('bug_type', 'Crash');
    formData.append('description', 'App crashes on load');
    const file = new File(['test content'], 'screenshot.png', { type: 'image/png' });
    const fileBuffer = Buffer.from('test content');

    Object.defineProperty(file, 'arrayBuffer', {
      value: jest.fn().mockResolvedValue(fileBuffer),
    });

    formData.append('screenshot', file);

    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
    });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

    const req = {
      formData: jest.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('✅ Η αναφορά υποβλήθηκε επιτυχώς!');
    expect(supabase.storage.from).toHaveBeenCalledWith('bug_reports');
    expect(supabase.from).toHaveBeenCalledWith('submissions');
    expect(supabase.from).toHaveBeenCalledWith('bug_reports');
  });

  it('should return 400 if bug_type is missing', async () => {
    const formData = new FormData();
    formData.append('description', 'Button misaligned');

    const req = {
      formData: jest.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Όλα τα απαιτούμενα πεδία πρέπει να συμπληρωθούν.');
  });

  it('should return 400 if description is missing', async () => {
    const formData = new FormData();
    formData.append('bug_type', 'UI');

    const req = {
      formData: jest.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Όλα τα απαιτούμενα πεδία πρέπει να συμπληρωθούν.');
  });

  it('should return 500 if file upload fails', async () => {
    const formData = new FormData();
    formData.append('bug_type', 'Crash');
    formData.append('description', 'App crashes');
    const file = new File(['test content'], 'screenshot.png', { type: 'image/png' });
    const fileBuffer = Buffer.from('test content');

    Object.defineProperty(file, 'arrayBuffer', {
      value: jest.fn().mockResolvedValue(fileBuffer),
    });

    formData.append('screenshot', file);

    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: new Error('Upload failed') }),
    });

    const req = {
      formData: jest.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Upload failed');
  });

  it('should return 500 if submission insertion fails', async () => {
    const formData = new FormData();
    formData.append('bug_type', 'UI');
    formData.append('description', 'Button misaligned');

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Submission failed'),
        }),
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

    const req = {
      formData: jest.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Submission failed');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
});
