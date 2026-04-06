import type React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@radix-ui/react-switch', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  const Root = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'button'>,
      ref: React.ForwardedRef<HTMLButtonElement>,
    ) => (
      <button ref={ref} data-testid="switch-root" className={className} {...props}>
        {children}
      </button>
    ),
  );
  Root.displayName = 'SwitchPrimitiveRoot';

  const Thumb = ({ className }: { className?: string }) => (
    <span data-testid="switch-thumb" className={className} />
  );

  return {
    __esModule: true,
    Root,
    Thumb,
  };
});

import { Switch } from '@/components/ui/switch';

describe('components/ui/switch', () => {
  it('renders the switch root with the radix thumb', () => {
    render(<Switch aria-label="Enable notifications" />);

    expect(screen.getByTestId('switch-root')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enable notifications' })).toBeInTheDocument();
    expect(screen.getByTestId('switch-thumb')).toBeInTheDocument();
  });

  it('merges custom classes into the switch root and applies thumb classes', () => {
    render(<Switch className="custom-switch" aria-label="Dark mode" />);

    const root = screen.getByTestId('switch-root');
    const thumb = screen.getByTestId('switch-thumb');

    expect(root.className).toContain('custom-switch');
    expect(root.className).toContain('inline-flex');
    expect(root.className).toContain('rounded-full');
    expect(thumb.className).toContain('pointer-events-none');
    expect(thumb.className).toContain('translate-x-4');
  });

  it('preserves the radix root displayName', () => {
    expect(Switch.displayName).toBe('SwitchPrimitiveRoot');
  });
});
