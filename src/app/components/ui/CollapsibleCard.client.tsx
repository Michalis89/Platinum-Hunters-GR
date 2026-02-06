'use client';

import { type ReactNode, createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CollapsibleCardContextValue = {
  isCollapsed: boolean;
  toggle: () => void;
};

const CollapsibleCardContext = createContext<CollapsibleCardContextValue | null>(null);

interface CollapsibleCardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly id?: string;
  readonly defaultCollapsed?: boolean;
}

interface CollapsibleCardSectionProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function CollapsibleCard({
  children,
  className = '',
  id,
  defaultCollapsed = false,
}: Readonly<CollapsibleCardProps>) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <CollapsibleCardContext.Provider
      value={{
        isCollapsed,
        toggle: () => setIsCollapsed(prev => !prev),
      }}
    >
      <div
        id={id}
        className={`rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[var(--hb-shadow-md)] dark:border-[var(--hb-border)] dark:bg-[var(--hb-panel)] dark:text-[var(--hb-text)] dark:shadow-[var(--hb-shadow-md)] ${className}`}
      >
        {children}
      </div>
    </CollapsibleCardContext.Provider>
  );
}

export function CollapsibleCardHeader({
  children,
  className = '',
}: Readonly<CollapsibleCardSectionProps>) {
  const context = useContext(CollapsibleCardContext);

  if (!context) {
    return (
      <div
        className={`border-b border-slate-200 bg-white/80 p-4 text-slate-900 dark:border-[var(--hb-border)] dark:bg-[var(--hb-card)] dark:text-[var(--hb-text)] ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={context.toggle}
      className={`flex w-full items-center justify-between border-b border-slate-200 bg-white/80 p-4 text-left text-slate-900 transition-colors hover:bg-slate-100 dark:border-[var(--hb-border)] dark:bg-[var(--hb-card)] dark:text-[var(--hb-text)] ${context.isCollapsed ? 'border-b-0' : ''} ${className}`}
    >
      <div className="flex-1">{children}</div>
      <ChevronDown
        className={`ml-2 h-5 w-5 text-slate-500 transition-transform duration-200 ${context.isCollapsed ? '' : 'rotate-180'} dark:text-[var(--hb-muted)]`}
      />
    </Button>
  );
}

export function CollapsibleCardContent({
  children,
  className = '',
}: Readonly<CollapsibleCardSectionProps>) {
  const context = useContext(CollapsibleCardContext);

  if (!context) {
    return <div className={`p-4 ${className}`}>{children}</div>;
  }

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${context.isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
    >
      <div className="overflow-hidden">
        <div className={`p-4 ${className}`}>{children}</div>
      </div>
    </div>
  );
}

export function CollapsibleCardFooter({
  children,
  className = '',
}: Readonly<CollapsibleCardSectionProps>) {
  const context = useContext(CollapsibleCardContext);

  if (!context) {
    return (
      <div
        className={`border-t border-slate-200 p-4 text-slate-900 dark:border-[var(--hb-border)] dark:text-[var(--hb-text)] ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${context.isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}
    >
      <div className="overflow-hidden">
        <div
          className={`border-t border-slate-200 p-4 text-slate-900 dark:border-[var(--hb-border)] dark:text-[var(--hb-text)] ${className}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
