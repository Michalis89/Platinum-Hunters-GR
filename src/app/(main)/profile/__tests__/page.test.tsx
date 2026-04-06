import { act, render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '@/app/(main)/profile/page';

let isSuspended = false;
let suspensePromise: Promise<void> | null = null;
let resolveSuspense: (() => void) | null = null;

jest.mock('@/app/(main)/profile/ProfilePageClient', () => ({
  __esModule: true,
  default: () => {
    if (isSuspended && suspensePromise) {
      throw suspensePromise;
    }
    return <div data-testid="profile-page-client" />;
  },
}));

jest.mock('@/components/ui/skeleton', () => ({
  __esModule: true,
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" data-class={className} />
  ),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    isSuspended = false;
    suspensePromise = null;
    resolveSuspense = null;
  });

  it('renders the suspense fallback before the profile client resolves', async () => {
    isSuspended = true;
    suspensePromise = new Promise<void>(resolve => {
      resolveSuspense = () => {
        isSuspended = false;
        resolve();
      };
    });

    render(<ProfilePage />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(6);

    await act(async () => {
      resolveSuspense?.();
      await suspensePromise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('profile-page-client')).toBeInTheDocument();
    });
  });
});
