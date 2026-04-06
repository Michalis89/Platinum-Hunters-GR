import type React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@radix-ui/react-progress', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  const Root = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'div'>,
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => (
      <div ref={ref} data-testid="progress-root" className={className} {...props}>
        {children}
      </div>
    ),
  );
  Root.displayName = 'ProgressPrimitiveRoot';

  const Indicator = ({ className, style }: React.ComponentProps<'div'>) => (
    <div data-testid="progress-indicator" className={className} style={style} />
  );

  return {
    __esModule: true,
    Root,
    Indicator,
  };
});

import { Progress } from '@/components/ui/progress';

describe('components/ui/progress', () => {
  it('renders the progress root and indicator with default value fallback', () => {
    render(<Progress aria-label="Loading progress" />);

    const root = screen.getByTestId('progress-root');
    const indicator = screen.getByTestId('progress-indicator');

    expect(root).toBeInTheDocument();
    expect(root.className).toContain('overflow-hidden');
    expect(root.className).toContain('bg-primary/20');
    expect(indicator.className).toContain('transition-all');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('merges custom classes and uses the provided value to compute the translate offset', () => {
    render(<Progress className="custom-progress" value={35} />);

    const root = screen.getByTestId('progress-root');
    const indicator = screen.getByTestId('progress-indicator');

    expect(root.className).toContain('custom-progress');
    expect(root.className).toContain('rounded-full');
    expect(indicator.className).toContain('bg-primary');
    expect(indicator).toHaveStyle({ transform: 'translateX(-65%)' });
  });

  it('preserves the radix root displayName', () => {
    expect(Progress.displayName).toBe('ProgressPrimitiveRoot');
  });
});
