import { render, screen } from '@testing-library/react';
import ResetPasswordPage, { metadata } from '@/app/(main)/auth/reset-password/page';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/app/components/auth/ResetPasswordForm', () => ({
  __esModule: true,
  default: ({
    allowDevPreview,
    hasRecoveryParams,
  }: {
    allowDevPreview: boolean;
    hasRecoveryParams: boolean;
  }) => (
    <div data-testid="reset-password-form">
      <span>{`allowDevPreview:${String(allowDevPreview)}`}</span>
      <span>{`hasRecoveryParams:${String(hasRecoveryParams)}`}</span>
    </div>
  ),
}));

describe('ResetPasswordPage', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Reset Password',
      description: 'Set a new password for your account securely.',
      robots: { index: false, follow: false },
    });
  });

  it('redirects to login with encoded reset error when search params include error', async () => {
    await ResetPasswordPage({
      searchParams: Promise.resolve({
        error: 'access_denied',
        error_description: 'Link expired + invalid chars: / ? &',
      }),
    });

    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith(
      '/auth/login?reset_error=Link%20expired%20%2B%20invalid%20chars%3A%20%2F%20%3F%20%26',
    );
  });

  it('redirects with default message when error_description is missing', async () => {
    await ResetPasswordPage({
      searchParams: Promise.resolve({
        error: 'access_denied',
      }),
    });

    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith(
      '/auth/login?reset_error=Invalid%20or%20expired%20reset%20link',
    );
  });

  it('passes valid recovery params and dev preview in development', async () => {
    process.env.NODE_ENV = 'development';

    render(
      await ResetPasswordPage({
        searchParams: Promise.resolve({
          token_hash: 'hash',
          type: 'recovery',
        }),
      }),
    );

    expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
    expect(screen.getByText('allowDevPreview:true')).toBeInTheDocument();
    expect(screen.getByText('hasRecoveryParams:true')).toBeInTheDocument();
  });

  it('treats missing type as recovery and accepts code param', async () => {
    process.env.NODE_ENV = 'production';

    render(
      await ResetPasswordPage({
        searchParams: Promise.resolve({
          code: 'code',
        }),
      }),
    );

    expect(screen.getByText('allowDevPreview:false')).toBeInTheDocument();
    expect(screen.getByText('hasRecoveryParams:true')).toBeInTheDocument();
  });

  it('rejects recovery params when type is not recovery', async () => {
    process.env.NODE_ENV = 'production';

    render(
      await ResetPasswordPage({
        searchParams: Promise.resolve({
          token_hash: 'hash',
          type: 'magiclink',
        }),
      }),
    );

    expect(screen.getByText('allowDevPreview:false')).toBeInTheDocument();
    expect(screen.getByText('hasRecoveryParams:false')).toBeInTheDocument();
  });
});
