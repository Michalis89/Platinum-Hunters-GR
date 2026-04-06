import type React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@radix-ui/react-tabs', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  const Root = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-root">{children}</div>
  );
  const List = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'div'>,
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => (
      <div ref={ref} data-testid="tabs-list" className={className} {...props}>
        {children}
      </div>
    ),
  );
  List.displayName = 'TabsPrimitiveList';

  const Trigger = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'button'>,
      ref: React.ForwardedRef<HTMLButtonElement>,
    ) => (
      <button ref={ref} data-testid="tabs-trigger" className={className} {...props}>
        {children}
      </button>
    ),
  );
  Trigger.displayName = 'TabsPrimitiveTrigger';

  const Content = React.forwardRef(
    (
      { children, className, ...props }: React.ComponentProps<'div'>,
      ref: React.ForwardedRef<HTMLDivElement>,
    ) => (
      <div ref={ref} data-testid="tabs-content" className={className} {...props}>
        {children}
      </div>
    ),
  );
  Content.displayName = 'TabsPrimitiveContent';

  return {
    __esModule: true,
    Root,
    List,
    Trigger,
    Content,
  };
});

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

describe('components/ui/tabs', () => {
  it('renders the tabs wrappers with their children', () => {
    render(
      <Tabs>
        <TabsList>
          <TabsTrigger>Overview</TabsTrigger>
        </TabsList>
        <TabsContent>Panel body</TabsContent>
      </Tabs>,
    );

    expect(screen.getByTestId('tabs-root')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-trigger')).toHaveTextContent('Overview');
    expect(screen.getByTestId('tabs-content')).toHaveTextContent('Panel body');
  });

  it('merges custom classes into list, trigger and content wrappers', () => {
    render(
      <>
        <TabsList className="list-class">List</TabsList>
        <TabsTrigger className="trigger-class">Trigger</TabsTrigger>
        <TabsContent className="content-class">Content</TabsContent>
      </>,
    );

    expect(screen.getByTestId('tabs-list').className).toContain('list-class');
    expect(screen.getByTestId('tabs-list').className).toContain('inline-flex');
    expect(screen.getByTestId('tabs-trigger').className).toContain('trigger-class');
    expect(screen.getByTestId('tabs-trigger').className).toContain('whitespace-nowrap');
    expect(screen.getByTestId('tabs-content').className).toContain('content-class');
    expect(screen.getByTestId('tabs-content').className).toContain('mt-2');
  });

  it('preserves the radix display names on forwarded components', () => {
    expect(TabsList.displayName).toBe('TabsPrimitiveList');
    expect(TabsTrigger.displayName).toBe('TabsPrimitiveTrigger');
    expect(TabsContent.displayName).toBe('TabsPrimitiveContent');
  });
});
