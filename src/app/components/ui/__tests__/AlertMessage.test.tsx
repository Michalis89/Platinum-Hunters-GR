import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import AlertMessage from '../AlertMessage';

describe('AlertMessage Component', () => {
  jest.useFakeTimers();

  it('renders success alert with message', () => {
    render(<AlertMessage type="success" message="Success message" />);

    const alertElement = screen.getByText('Success message');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement.closest('.bg-green-500')).toBeTruthy();
  });

  it('renders error alert with message', () => {
    render(<AlertMessage type="error" message="Error message" />);

    const alertElement = screen.getByText('Error message');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement.closest('.bg-red-500')).toBeTruthy();
  });

  it('closes alert when close button is clicked', async () => {
    render(<AlertMessage type="error" message="Error message" />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });
  });

  it('auto-hides alert after duration', async () => {
    render(<AlertMessage type="success" message="Auto-hide message" duration={3000} />);

    expect(screen.getByText('Auto-hide message')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Auto-hide message'), {
      timeout: 4000,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});
