import React from 'react';
import { render, screen } from '@testing-library/react';

const redirectMock = jest.fn(() => {
  throw new Error('NEXT_REDIRECT');
});

const getSessionMock = jest.fn();
const getUserSettingsMock = jest.fn();
let suspendSettingsForm = false;
const pendingPromise = new Promise<never>(() => {});

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

jest.mock('@/utils/seo/metadata/helpers', () => ({
  buildMetadata: ({
    title,
    description,
    path,
    noindex,
  }: {
    title: string;
    description: string;
    path: string;
    noindex: boolean;
  }) => ({
    title,
    description,
    alternates: { canonical: path },
    robots: { index: !noindex, follow: !noindex },
  }),
}));

jest.mock('@/lib/supabase-route-handler', () => ({
  createRouteHandlerClient: async () => ({
    auth: {
      getSession: getSessionMock,
    },
  }),
}));

jest.mock('@/lib/settings', () => ({
  getUserSettings: (...args: unknown[]) => getUserSettingsMock(...args),
}));

jest.mock('@/app/components/layout', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

jest.mock('@/app/components/layout/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

jest.mock('@/app/(main)/settings/SettingsForm', () => ({
  SettingsForm: ({ initialSettings }: { initialSettings: { user_id: string } }) =>
    suspendSettingsForm ? (
      (() => {
        throw pendingPromise;
      })()
    ) : (
      <div data-testid="settings-form">{initialSettings.user_id}</div>
    ),
}));

import SettingsPage, { metadata } from '@/app/(main)/settings/page';

describe('settings/page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    suspendSettingsForm = false;
  });

  it('exports expected metadata', () => {
    expect(metadata.title).toBe('Application Settings');
    expect(metadata.description).toContain('Fine-tune your experience');
    expect(String(metadata.alternates?.canonical)).toContain('/settings');
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('redirects to login when session is missing', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    await expect(SettingsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/auth/login');
    expect(getUserSettingsMock).not.toHaveBeenCalled();
  });

  it('renders settings page for authenticated user', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    getUserSettingsMock.mockResolvedValue({ user_id: 'user-1' });

    render(await SettingsPage());

    expect(screen.getByText('Application Settings')).toBeInTheDocument();
    expect(screen.getByTestId('page-container')).toBeInTheDocument();
    expect(screen.getByTestId('settings-form')).toHaveTextContent('user-1');
    expect(getUserSettingsMock).toHaveBeenCalledWith('user-1', expect.any(Object));
  });

  it('renders Suspense fallback skeleton when settings form suspends', async () => {
    suspendSettingsForm = true;
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'user-2' } } } });
    getUserSettingsMock.mockResolvedValue({ user_id: 'user-2' });

    render(await SettingsPage());

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
