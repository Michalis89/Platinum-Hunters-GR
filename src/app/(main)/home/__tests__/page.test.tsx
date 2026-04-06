import { render, screen } from '@testing-library/react';
import HomePage, { metadata } from '@/app/(main)/home/page';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  __esModule: true,
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('@/app/components/home/HomeGuestPageClient', () => ({
  __esModule: true,
  default: () => <div data-testid="home-guest-page-client" />,
}));

function mockUser(user: { id: string } | null) {
  (createRouteHandlerClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: async () => ({
        data: { user },
      }),
    },
  });
}

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Your Hobby Hub',
      description:
        'Organize your backlog, track your progress, and keep all your hobbies in one place.',
    });
  });

  it('redirects authenticated users to dashboard', async () => {
    mockUser({ id: 'u1' });
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(HomePage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('renders guest homepage for unauthenticated users', async () => {
    mockUser(null);

    render(await HomePage());
    expect(screen.getByTestId('home-guest-page-client')).toBeInTheDocument();
  });
});
