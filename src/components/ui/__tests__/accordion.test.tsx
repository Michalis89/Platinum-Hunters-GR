import type React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@radix-ui/react-accordion', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  const Root = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-root">{children}</div>
  );

  const Item = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'div'>,
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => (
      <div ref={ref} data-testid="accordion-item" className={className} {...props}>
        {children}
      </div>
    ),
  );
  Item.displayName = 'AccordionPrimitiveItem';

  const Header = ({ children, className, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="accordion-header" className={className} {...props}>
      {children}
    </div>
  );

  const Trigger = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'button'>,
      ref: React.ForwardedRef<HTMLButtonElement>,
    ) => (
      <button ref={ref} data-testid="accordion-trigger" className={className} {...props}>
        {children}
      </button>
    ),
  );
  Trigger.displayName = 'AccordionPrimitiveTrigger';

  const Content = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'div'>,
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => (
      <div ref={ref} data-testid="accordion-content" className={className} {...props}>
        {children}
      </div>
    ),
  );
  Content.displayName = 'AccordionPrimitiveContent';

  return {
    __esModule: true,
    Root,
    Item,
    Header,
    Trigger,
    Content,
  };
});

jest.mock('lucide-react', () => ({
  __esModule: true,
  ChevronDown: ({ className }: { className?: string }) => (
    <svg data-testid="accordion-icon" className={className} />
  ),
}));

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

describe('components/ui/accordion', () => {
  it('renders the accordion wrappers, trigger text and chevron icon', () => {
    render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section title</AccordionTrigger>
          <AccordionContent>Section body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByTestId('accordion-root')).toBeInTheDocument();
    expect(screen.getByTestId('accordion-item')).toBeInTheDocument();
    expect(screen.getByTestId('accordion-header').className).toContain('flex');
    expect(screen.getByTestId('accordion-trigger')).toHaveTextContent('Section title');
    expect(screen.getByTestId('accordion-icon')).toBeInTheDocument();
    expect(screen.getByTestId('accordion-content')).toHaveTextContent('Section body');
  });

  it('merges custom classes into item, trigger and content wrappers', () => {
    render(
      <>
        <AccordionItem className="custom-item" value="item-2">
          Item
        </AccordionItem>
        <AccordionTrigger className="custom-trigger">Trigger</AccordionTrigger>
        <AccordionContent className="custom-content">Content</AccordionContent>
      </>,
    );

    expect(screen.getByTestId('accordion-item').className).toContain('custom-item');
    expect(screen.getByTestId('accordion-item').className).toContain('border-b');
    expect(screen.getByTestId('accordion-trigger').className).toContain('custom-trigger');
    expect(screen.getByTestId('accordion-trigger').className).toContain('hover:underline');
    expect(screen.getByTestId('accordion-content').className).toContain('overflow-hidden');
    const innerContentWrapper = screen.getByText('Content');
    expect(innerContentWrapper.className).toContain('custom-content');
    expect(innerContentWrapper.className).toContain('pb-4');
  });

  it('preserves the expected display names', () => {
    expect(AccordionItem.displayName).toBe('AccordionItem');
    expect(AccordionTrigger.displayName).toBe('AccordionPrimitiveTrigger');
    expect(AccordionContent.displayName).toBe('AccordionPrimitiveContent');
  });
});
