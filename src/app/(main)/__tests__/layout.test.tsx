import { render, screen } from '@testing-library/react';
import MainLayout from '@/app/(main)/layout';

jest.mock('@/app/components/AppShell', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

describe('MainLayout', () => {
  it('wraps children with AppShell', () => {
    render(
      <MainLayout>
        <main>Home content</main>
      </MainLayout>,
    );

    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(screen.getByText('Home content')).toBeInTheDocument();
  });
});
