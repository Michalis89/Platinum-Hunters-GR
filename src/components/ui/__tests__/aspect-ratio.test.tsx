import React from 'react';
import { render, screen } from '@testing-library/react';

import { AspectRatio } from '@/components/ui/aspect-ratio';

describe('components/ui/aspect-ratio', () => {
  it('applies a default 1:1 ratio and merged classes', () => {
    render(<AspectRatio data-testid="aspect" />);

    const element = screen.getByTestId('aspect');

    expect(element).toHaveClass('relative w-full');
    expect(element.style.aspectRatio).toBe('1');
  });

  it('respects a custom ratio and merges additional class names', () => {
    render(
      <AspectRatio
        data-testid="aspect"
        ratio={1.5}
        className="custom-aspect"
        style={{ backgroundColor: 'red' }}
      />,
    );

    const element = screen.getByTestId('aspect');

    expect(element.style.aspectRatio).toBe('1.5');
    expect(element.className).toContain('custom-aspect');
    expect(element.style.backgroundColor).toBe('red');
  });

  it('preserves the displayName', () => {
    expect(AspectRatio.displayName).toBe('AspectRatio');
  });
});
