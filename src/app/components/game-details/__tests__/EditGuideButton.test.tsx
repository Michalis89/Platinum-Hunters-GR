import { render, screen } from '@testing-library/react';

jest.mock('next/link', () => {
  const MockNextLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="mocked-link">
      {children}
    </a>
  );

  MockNextLink.displayName = 'MockNextLink';
  return MockNextLink;
});

describe('EditGuideButton Component', () => {
  const gameId = 123;

  const setNodeEnv = (env: 'development' | 'production') => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: env,
      configurable: true,
    });
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it.skip('does not render in production mode', async () => {
    setNodeEnv('production');

    const { default: EditGuideButton } = await import('../EditGuideButton');

    render(<EditGuideButton gameId={gameId} />);

    expect(screen.queryByText('✏️ Επεξεργασία Guide')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mocked-link')).not.toBeInTheDocument();
  });

  it('renders correctly in development mode', async () => {
    setNodeEnv('development');

    const { default: EditGuideButton } = await import('../EditGuideButton');

    render(<EditGuideButton gameId={gameId} />);

    const link = screen.getByTestId('mocked-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `/pages/edit-guide/${gameId}`);
    expect(screen.getByText('✏️ Επεξεργασία Guide')).toBeInTheDocument();
  });
});
