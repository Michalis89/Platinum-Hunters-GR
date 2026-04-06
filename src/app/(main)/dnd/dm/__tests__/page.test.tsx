import { render, screen } from '@testing-library/react';
import DMDashboardPage, { metadata } from '@/app/(main)/dnd/dm/page';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/lib/settings', () => ({
  __esModule: true,
  getUserSettings: jest.fn(),
}));

jest.mock('@/app/components/layout', () => ({
  __esModule: true,
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

jest.mock('@/app/components/layout/PageHeader', () => ({
  __esModule: true,
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  __esModule: true,
  Card: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/alert', () => ({
  __esModule: true,
  Alert: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

function mockSession(session: { user: { id: string } } | null) {
  (createRouteHandlerClient as jest.Mock).mockResolvedValue({
    auth: {
      getSession: async () => ({
        data: { session },
      }),
    },
  });
}

describe('DMDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'DM Dashboard',
      description: 'Dungeon Master tools',
      robots: { index: false, follow: false },
    });
  });

  it('redirects to login when session is missing', async () => {
    mockSession(null);
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(DMDashboardPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects to /dnd when dnd is disabled or role is not dm', async () => {
    mockSession({ user: { id: 'u1' } });
    (getUserSettings as jest.Mock).mockResolvedValue({ dnd_enabled: true, dnd_role: 'player' });
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(DMDashboardPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/dnd');
  });

  it('renders dm dashboard content', async () => {
    mockSession({ user: { id: 'u1' } });
    (getUserSettings as jest.Mock).mockResolvedValue({ dnd_enabled: true, dnd_role: 'dm' });

    render(await DMDashboardPage());

    expect(screen.getByTestId('page-container')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'DM Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('End-to-End Encryption Setup Required')).toBeInTheDocument();
    expect(screen.getByText('DM Tools')).toBeInTheDocument();
  });
});
