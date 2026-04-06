import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlobalError from '@/app/global-error';

const pushMock = jest.fn();
const useRouterMock = jest.fn(() => ({ push: pushMock }));

jest.mock('next/navigation', () => ({
  useRouter: () => useRouterMock(),
}));

describe('GlobalError', () => {
  beforeEach(() => {
    pushMock.mockReset();
    useRouterMock.mockClear();
  });

  it('renders the fallback UI content', () => {
    render(<GlobalError reset={jest.fn()} />);

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'The application encountered an unexpected error. You can try again or return to the home page.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to home' })).toBeInTheDocument();
    expect(document.querySelector('[data-icon="AlertTriangle"]')).toBeInTheDocument();
  });

  it('calls reset when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    const reset = jest.fn();

    render(<GlobalError reset={reset} />);

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('navigates to home when "Go to home" is clicked', async () => {
    const user = userEvent.setup();

    render(<GlobalError reset={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Go to home' }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/');
  });
});
