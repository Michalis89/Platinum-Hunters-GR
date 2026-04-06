import type React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@radix-ui/react-popover', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  const Root = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-root">{children}</div>
  );
  const Trigger = ({ children }: { children: React.ReactNode }) => <button>{children}</button>;
  const Portal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const Content = React.forwardRef(
    (
      {
        children,
        className,
        align,
        sideOffset,
        ...props
      }: React.ComponentProps<'div'> & { align?: string; sideOffset?: number },
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => (
      <div
        ref={ref}
        data-testid="popover-content"
        data-align={align}
        data-side-offset={sideOffset}
        className={className}
        {...props}
      >
        {children}
      </div>
    ),
  );
  Content.displayName = 'PopoverPrimitiveContent';

  return {
    __esModule: true,
    Root,
    Trigger,
    Portal,
    Content,
  };
});

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

describe('components/ui/popover', () => {
  it('renders the radix wrappers and popover content with default alignment and sideOffset', () => {
    render(
      <Popover>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>Popover body</PopoverContent>
      </Popover>,
    );

    expect(screen.getByTestId('popover-root')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open popover' })).toBeInTheDocument();
    expect(screen.getByTestId('popover-content')).toHaveAttribute('data-align', 'center');
    expect(screen.getByTestId('popover-content')).toHaveAttribute('data-side-offset', '4');
    expect(screen.getByTestId('popover-content')).toHaveTextContent('Popover body');
  });

  it('merges custom classes and respects explicit align and sideOffset values', () => {
    render(
      <PopoverContent className="custom-popover" align="start" sideOffset={12}>
        Custom popover
      </PopoverContent>,
    );

    const content = screen.getByTestId('popover-content');

    expect(content).toHaveAttribute('data-align', 'start');
    expect(content).toHaveAttribute('data-side-offset', '12');
    expect(content.className).toContain('custom-popover');
    expect(content.className).toContain('z-50');
    expect(content.className).toContain('w-72');
  });

  it('preserves the radix content displayName', () => {
    expect(PopoverContent.displayName).toBe('PopoverPrimitiveContent');
  });
});
