import { render, screen } from '@testing-library/react';
import DiaryPage from '@/app/(main)/diary/page';

jest.mock('@/app/components/diary/DiaryPageClient', () => ({
  __esModule: true,
  DiaryPageClient: () => <div data-testid="diary-page-client" />,
}));

describe('DiaryPage', () => {
  it('renders DiaryPageClient', () => {
    render(<DiaryPage />);

    expect(screen.getByTestId('diary-page-client')).toBeInTheDocument();
  });
});
