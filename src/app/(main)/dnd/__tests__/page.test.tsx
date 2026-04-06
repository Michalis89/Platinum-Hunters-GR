import { render, screen } from '@testing-library/react';
import DndLandingPage, { metadata } from '@/app/(main)/dnd/page';
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
  PageHeader: ({
    title,
    description,
    eyebrow,
  }: {
    title: string;
    description: string;
    eyebrow: string;
  }) => (
    <header>
      <p>{eyebrow}</p>
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

function mockSupabaseSession(session: { user: { id: string } } | null) {
  (createRouteHandlerClient as jest.Mock).mockResolvedValue({
    auth: {
      getSession: async () => ({
        data: { session },
      }),
    },
  });
}

describe('DndLandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'D&D Tools',
      description: 'Campaign management with zero-knowledge encryption',
      robots: { index: false, follow: false },
    });
  });

  it('redirects to login when session is missing', async () => {
    mockSupabaseSession(null);
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(DndLandingPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects to settings when dnd feature is disabled', async () => {
    mockSupabaseSession({ user: { id: 'user-1' } });
    (getUserSettings as jest.Mock).mockResolvedValue({
      dnd_enabled: false,
      dnd_role: 'player',
    });
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(DndLandingPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(getUserSettings).toHaveBeenCalledWith('user-1', { supabase: expect.any(Object) });
    expect(redirect).toHaveBeenCalledWith('/settings');
  });

  it('renders DM content when enabled and role is dm', async () => {
    mockSupabaseSession({ user: { id: 'user-1' } });
    (getUserSettings as jest.Mock).mockResolvedValue({
      dnd_enabled: true,
      dnd_role: 'dm',
    });

    render(await DndLandingPage());

    expect(screen.getByTestId('page-container')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'D&D Tools' })).toBeInTheDocument();
    expect(screen.getByText('Welcome to D&D Tools')).toBeInTheDocument();
    expect(screen.getByText('Your Role: Dungeon Master')).toBeInTheDocument();
    expect(
      screen.getByText(
        'As a DM, you can create campaigns, manage sessions, and share tools with your players.',
      ),
    ).toBeInTheDocument();
  });

  it('renders Player content when enabled and role is not dm', async () => {
    mockSupabaseSession({ user: { id: 'user-2' } });
    (getUserSettings as jest.Mock).mockResolvedValue({
      dnd_enabled: true,
      dnd_role: 'player',
    });

    render(await DndLandingPage());

    expect(screen.getByText('Your Role: Player')).toBeInTheDocument();
    expect(
      screen.getByText('As a Player, you can join campaigns and access tools shared by your DM.'),
    ).toBeInTheDocument();
  });
});
