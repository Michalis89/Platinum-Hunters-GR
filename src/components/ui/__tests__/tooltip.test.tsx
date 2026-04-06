import type React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@radix-ui/react-tooltip', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  const Provider = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  );
  const Root = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-root">{children}</div>
  );
  const Trigger = ({ children }: { children: React.ReactNode }) => <button>{children}</button>;
  const Portal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const Content = React.forwardRef(
    (
      {
        children,
        className,
        sideOffset,
        ...props
      }: React.ComponentProps<'div'> & { sideOffset?: number },
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => (
      <div
        ref={ref}
        data-testid="tooltip-content"
        data-side-offset={sideOffset}
        className={className}
        {...props}
      >
        {children}
      </div>
    ),
  );
  Content.displayName = 'TooltipPrimitiveContent';

  return {
    __esModule: true,
    Provider,
    Root,
    Trigger,
    Portal,
    Content,
  };
});

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

describe('components/ui/tooltip', () => {
  it('renders the radix wrappers and tooltip content with the default sideOffset', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Open tooltip</TooltipTrigger>
          <TooltipContent>Tooltip body</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-root')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open tooltip' })).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveAttribute('data-side-offset', '4');
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Tooltip body');
  });

  it('merges custom classes and respects an explicit sideOffset', () => {
    render(
      <TooltipContent className="custom-class" sideOffset={12}>
        Custom tooltip
      </TooltipContent>,
    );

    const content = screen.getByTestId('tooltip-content');

    expect(content).toHaveAttribute('data-side-offset', '12');
    expect(content.className).toContain('custom-class');
    expect(content.className).toContain('z-50');
    expect(content.className).toContain('rounded-md');
  });

  it('preserves the radix content displayName', () => {
    expect(TooltipContent.displayName).toBe('TooltipPrimitiveContent');
  });
});
