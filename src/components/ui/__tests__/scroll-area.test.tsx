import type React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@radix-ui/react-scroll-area', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  const Root = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'div'>,
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => (
      <div ref={ref} data-testid="scroll-area-root" className={className} {...props}>
        {children}
      </div>
    ),
  );
  Root.displayName = 'ScrollAreaPrimitiveRoot';

  const Viewport = ({ children, className, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="scroll-area-viewport" className={className} {...props}>
      {children}
    </div>
  );

  const ScrollAreaScrollbar = React.forwardRef(
    (
      {
        children,
        className,
        orientation,
        ...props
      }: React.ComponentProps<'div'> & { orientation?: string },
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => (
      <div
        ref={ref}
        data-testid="scroll-area-scrollbar"
        data-orientation={orientation}
        className={className}
        {...props}
      >
        {children}
      </div>
    ),
  );
  ScrollAreaScrollbar.displayName = 'ScrollAreaPrimitiveScrollbar';

  const ScrollAreaThumb = ({ className, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="scroll-area-thumb" className={className} {...props} />
  );

  return {
    __esModule: true,
    Root,
    Viewport,
    ScrollAreaScrollbar,
    ScrollAreaThumb,
  };
});

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

describe('components/ui/scroll-area', () => {
  it('renders the scroll area root and viewport with merged classes', () => {
    render(
      <ScrollArea className="custom-scroll-area">
        <div>Scrollable content</div>
      </ScrollArea>,
    );

    expect(screen.getByTestId('scroll-area-root').className).toContain('relative');
    expect(screen.getByTestId('scroll-area-root').className).toContain('custom-scroll-area');
    expect(screen.getByTestId('scroll-area-viewport').className).toContain('h-full');
    expect(screen.getByTestId('scroll-area-viewport')).toHaveTextContent('Scrollable content');
  });

  it('renders a vertical scrollbar by default with the correct classes', () => {
    render(<ScrollBar />);

    const scrollbar = screen.getByTestId('scroll-area-scrollbar');
    const thumb = screen.getByTestId('scroll-area-thumb');

    expect(scrollbar).toHaveAttribute('data-orientation', 'vertical');
    expect(scrollbar.className).toContain('touch-none');
    expect(scrollbar.className).toContain('h-full');
    expect(scrollbar.className).toContain('w-2.5');
    expect(thumb.className).toContain('rounded-full');
    expect(thumb.className).toContain('bg-border');
  });

  it('renders a horizontal scrollbar with orientation-specific and custom classes', () => {
    render(<ScrollBar orientation="horizontal" className="custom-scrollbar" />);

    const scrollbar = screen.getByTestId('scroll-area-scrollbar');

    expect(scrollbar).toHaveAttribute('data-orientation', 'horizontal');
    expect(scrollbar.className).toContain('h-2.5');
    expect(scrollbar.className).toContain('flex-col');
    expect(scrollbar.className).toContain('custom-scrollbar');
  });

  it('preserves the radix display names', () => {
    expect(ScrollArea.displayName).toBe('ScrollAreaPrimitiveRoot');
    expect(ScrollBar.displayName).toBe('ScrollAreaPrimitiveScrollbar');
  });
});
