import { render, screen, fireEvent } from '@testing-library/react';
import UnderConstruction from '../UnderConstruction';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('UnderConstruction Component', () => {
  let mockRouter: { push: jest.Mock };

  beforeEach(() => {
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders the under construction message', () => {
    render(<UnderConstruction />);
    expect(screen.getByText('Under Construction')).toBeInTheDocument();
  });

  it('shows countdown starting from 10', () => {
    render(<UnderConstruction />);

    expect(
      screen.getAllByText(
        (_, element) => !!element?.textContent?.includes('Αυτόματη ανακατεύθυνση σε 10'),
      ).length,
    ).toBeGreaterThan(0);
  });

  it('redirects to home when the button is clicked', () => {
    render(<UnderConstruction />);

    const button = screen.getByRole('button', { name: 'Επιστροφή στην Αρχική' });
    fireEvent.click(button);

    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });
});
