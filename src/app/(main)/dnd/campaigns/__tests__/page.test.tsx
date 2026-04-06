import { render, screen } from '@testing-library/react';
import CampaignsPage, { metadata } from '@/app/(main)/dnd/campaigns/page';
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
    actions,
  }: {
    title: string;
    description: string;
    actions?: React.ReactNode;
  }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
      <div>{actions}</div>
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

jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: ({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) => (
    <button type="button" disabled={disabled}>
      {children}
    </button>
  ),
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

describe('CampaignsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'My Campaigns',
      description: 'Manage your D&D campaigns',
      robots: { index: false, follow: false },
    });
  });

  it('redirects to login when user is not authenticated', async () => {
    mockSession(null);
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(CampaignsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects to settings when dnd is disabled', async () => {
    mockSession({ user: { id: 'u1' } });
    (getUserSettings as jest.Mock).mockResolvedValue({ dnd_enabled: false, dnd_role: 'player' });
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(CampaignsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/settings');
  });

  it('renders dm variant with new campaign action', async () => {
    mockSession({ user: { id: 'u1' } });
    (getUserSettings as jest.Mock).mockResolvedValue({ dnd_enabled: true, dnd_role: 'dm' });

    render(await CampaignsPage());

    expect(screen.getByTestId('page-container')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My Campaigns' })).toBeInTheDocument();
    expect(screen.getByText('Manage your campaigns')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Campaign' })).toBeDisabled();
    expect(
      screen.getByText(
        'Create your first campaign to start managing sessions and sharing tools with players.',
      ),
    ).toBeInTheDocument();
  });

  it('renders player variant without new campaign action', async () => {
    mockSession({ user: { id: 'u2' } });
    (getUserSettings as jest.Mock).mockResolvedValue({ dnd_enabled: true, dnd_role: 'player' });

    render(await CampaignsPage());

    expect(screen.getByText("Campaigns you're part of")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New Campaign' })).not.toBeInTheDocument();
    expect(
      screen.getByText("You haven't joined any campaigns yet. Ask your DM for an invitation."),
    ).toBeInTheDocument();
  });
});
