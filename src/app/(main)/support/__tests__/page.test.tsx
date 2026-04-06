import { render, screen } from '@testing-library/react';
import SupportPage, { metadata } from '@/app/(main)/support/page';
import { SITE_CONTACT_EMAIL } from '@/config/site';
import { requireServerAuth } from '@/lib/auth/requireServerAuth';

jest.mock('@/lib/auth/requireServerAuth', () => ({
  requireServerAuth: jest.fn(),
}));

jest.mock('@/app/components/support/SupportForm.client', () => ({
  __esModule: true,
  default: ({
    securityEmail,
    contactEmail,
  }: {
    securityEmail: string | null;
    contactEmail: string;
  }) => (
    <div data-testid="support-form">
      <span>{`security:${String(securityEmail)}`}</span>
      <span>{`contact:${contactEmail}`}</span>
    </div>
  ),
}));

describe('SupportPage', () => {
  const originalSecurityEmail = process.env.SUPPORT_SECURITY_EMAIL;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalSecurityEmail === undefined) {
      delete process.env.SUPPORT_SECURITY_EMAIL;
    } else {
      process.env.SUPPORT_SECURITY_EMAIL = originalSecurityEmail;
    }
  });

  it('exports expected metadata', () => {
    expect(metadata.title).toBe('Support');
    expect(metadata.description).toBe('Contact support for account, content, or platform issues.');
    expect(String(metadata.alternates?.canonical)).toContain('/support');
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('requires auth and renders support form with env security email', async () => {
    process.env.SUPPORT_SECURITY_EMAIL = 'security@hobbistas.local';

    render(await SupportPage());

    expect(requireServerAuth).toHaveBeenCalledWith('/support');
    expect(screen.getByTestId('support-form')).toBeInTheDocument();
    expect(screen.getByText('security:security@hobbistas.local')).toBeInTheDocument();
    expect(screen.getByText(`contact:${SITE_CONTACT_EMAIL}`)).toBeInTheDocument();
  });

  it('passes null security email when env is unset', async () => {
    delete process.env.SUPPORT_SECURITY_EMAIL;

    render(await SupportPage());

    expect(screen.getByText('security:null')).toBeInTheDocument();
  });
});
