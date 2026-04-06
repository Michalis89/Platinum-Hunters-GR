import type React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@radix-ui/react-slider', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  const Root = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'div'>,
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => (
      <div ref={ref} data-testid="slider-root" className={className} {...props}>
        {children}
      </div>
    ),
  );
  Root.displayName = 'SliderPrimitiveRoot';

  const Track = ({ children, className, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="slider-track" className={className} {...props}>
      {children}
    </div>
  );

  const Range = ({ className, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="slider-range" className={className} {...props} />
  );

  const Thumb = ({ className, ...props }: React.ComponentProps<'span'>) => (
    <span data-testid="slider-thumb" className={className} {...props} />
  );

  return {
    __esModule: true,
    Root,
    Track,
    Range,
    Thumb,
  };
});

import { Slider } from '@/components/ui/slider';

describe('components/ui/slider', () => {
  it('renders the radix slider structure with data-slot attributes', () => {
    render(<Slider aria-label="Volume" />);

    expect(screen.getByTestId('slider-root')).toBeInTheDocument();
    expect(screen.getByTestId('slider-root')).toHaveAttribute('data-slot', 'slider-root');
    expect(screen.getByTestId('slider-track')).toHaveAttribute('data-slot', 'slider-track');
    expect(screen.getByTestId('slider-range')).toHaveAttribute('data-slot', 'slider-range');
    expect(screen.getByTestId('slider-thumb')).toHaveAttribute('data-slot', 'slider-thumb');
  });

  it('merges custom classes and keeps default classes on all slider parts', () => {
    render(<Slider className="custom-slider" aria-label="Brightness" />);

    expect(screen.getByTestId('slider-root').className).toContain('custom-slider');
    expect(screen.getByTestId('slider-root').className).toContain('touch-none');
    expect(screen.getByTestId('slider-track').className).toContain('bg-primary/20');
    expect(screen.getByTestId('slider-range').className).toContain('bg-primary');
    expect(screen.getByTestId('slider-thumb').className).toContain('rounded-full');
    expect(screen.getByTestId('slider-thumb').className).toContain('focus-visible:ring-1');
  });

  it('preserves the radix root displayName', () => {
    expect(Slider.displayName).toBe('SliderPrimitiveRoot');
  });
});
