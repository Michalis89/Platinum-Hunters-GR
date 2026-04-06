import { act, render, screen } from '@testing-library/react';
import SuccessAutoRedirect from '@/app/(main)/auth/confirm-email/SuccessAutoRedirect';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SuccessAutoRedirect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('counts down each second and redirects at zero', () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    render(<SuccessAutoRedirect />);

    expect(screen.getByText('Auto redirect to sign in in 6s.')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Auto redirect to sign in in 5s.')).toBeInTheDocument();

    for (let i = 0; i < 6; i += 1) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/auth/login');
  });

  it('supports custom destination and initial seconds', () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    render(<SuccessAutoRedirect seconds={1} to="/home" />);

    expect(screen.getByText('Auto redirect to sign in in 1s.')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1001);
    });

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/home');
  });

  it('redirects immediately when seconds is zero', () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    render(<SuccessAutoRedirect seconds={0} />);

    expect(screen.getByText('Auto redirect to sign in in 0s.')).toBeInTheDocument();
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/auth/login');
  });
});
