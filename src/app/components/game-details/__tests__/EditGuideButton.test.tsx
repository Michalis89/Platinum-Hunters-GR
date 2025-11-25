import { render, screen } from '@testing-library/react';
import EditGuideButton from '../EditGuideButton';

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
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('renders correctly in development mode', () => {
    process.env.NODE_ENV = 'development';

    render(<EditGuideButton gameId={gameId} />);

    const link = screen.getByTestId('mocked-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `/pages/edit-guide/${gameId}`);
    expect(screen.getByText('✏️ Επεξεργασία Guide')).toBeInTheDocument();
  });

  it('does not render in production mode', () => {
    process.env.NODE_ENV = 'production';

    const { container } = render(<EditGuideButton gameId={gameId} />);

    expect(container).toBeEmptyDOMElement();
  });
});
