import { render, screen } from '@testing-library/react';
import LegalLayout from '@/app/(legal)/layout';

jest.mock('@/app/components/NavbarWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar-wrapper" />,
}));

jest.mock('@/app/components/layout/Footer', () => ({
  __esModule: true,
  Footer: () => <footer data-testid="footer" />,
}));

jest.mock('@/app/components/layout', () => ({
  __esModule: true,
  PageContainer: ({
    children,
    size,
    noPadding,
  }: {
    children: React.ReactNode;
    size?: string;
    noPadding?: boolean;
  }) => (
    <div data-testid="page-container" data-size={size} data-no-padding={String(Boolean(noPadding))}>
      {children}
    </div>
  ),
}));

describe('LegalLayout', () => {
  it('renders legal shell and forwards children into PageContainer', () => {
    render(
      <LegalLayout>
        <article>Legal content</article>
      </LegalLayout>,
    );

    expect(screen.getByTestId('navbar-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();

    const container = screen.getByTestId('page-container');
    expect(container).toHaveAttribute('data-size', 'lg');
    expect(container).toHaveAttribute('data-no-padding', 'true');
    expect(screen.getByText('Legal content')).toBeInTheDocument();
  });
});
