import type React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@radix-ui/react-checkbox', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  const Root = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'button'>,
      ref: React.ForwardedRef<HTMLButtonElement>,
    ) => (
      <button ref={ref} data-testid="checkbox-root" className={className} {...props}>
        {children}
      </button>
    ),
  );
  Root.displayName = 'CheckboxPrimitiveRoot';

  const Indicator = ({ children, className, ...props }: React.ComponentProps<'span'>) => (
    <span data-testid="checkbox-indicator" className={className} {...props}>
      {children}
    </span>
  );

  return {
    __esModule: true,
    Root,
    Indicator,
  };
});

jest.mock('lucide-react', () => ({
  __esModule: true,
  Check: ({ className }: { className?: string }) => (
    <svg data-testid="checkbox-icon" className={className} />
  ),
}));

import { Checkbox } from '@/components/ui/checkbox';

describe('components/ui/checkbox', () => {
  it('renders the checkbox root, indicator and check icon', () => {
    render(<Checkbox aria-label="Accept terms" />);

    expect(screen.getByTestId('checkbox-root')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept terms' })).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-icon')).toBeInTheDocument();
  });

  it('merges custom classes and applies the default indicator and icon classes', () => {
    render(<Checkbox className="custom-checkbox" aria-label="Enable sync" />);

    const root = screen.getByTestId('checkbox-root');
    const indicator = screen.getByTestId('checkbox-indicator');
    const icon = screen.getByTestId('checkbox-icon');

    expect(root.className).toContain('custom-checkbox');
    expect(root.className).toContain('place-content-center');
    expect(root.className).toContain('rounded-sm');
    expect(indicator.className).toContain('grid');
    expect(indicator.className).toContain('text-current');
    expect(icon.getAttribute('class')).toContain('h-4');
    expect(icon.getAttribute('class')).toContain('w-4');
  });

  it('preserves the radix root displayName', () => {
    expect(Checkbox.displayName).toBe('CheckboxPrimitiveRoot');
  });
});
