'use client';

import { type ReactNode, createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
        className={`rounded-[var(--apple-radius-card)] border-[var(--apple-hairline)] border-[var(--apple-separator)] bg-[var(--hb-panel)] text-[var(--apple-label)] shadow-[var(--apple-shadow)] backdrop-blur-[18px] ${className}`}
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
        className={`border-b border-[var(--apple-separator-soft)] bg-[var(--hb-card)]/85 p-4 text-[var(--apple-label)] ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={context.toggle}
      className={`flex w-full items-center justify-between border-b border-[var(--apple-separator-soft)] bg-[var(--hb-card)]/85 p-4 text-left text-[var(--apple-label)] transition-colors duration-200 hover:bg-[var(--apple-tertiary-fill)]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hb-ring)] ${context.isCollapsed ? 'border-b-0' : ''} ${className}`}
    >
      <div className="flex-1">{children}</div>
      <ChevronDown
        className={`ml-2 h-5 w-5 text-[var(--apple-secondary-label)] transition-transform duration-200 ${context.isCollapsed ? '' : 'rotate-180'}`}
      />
    </button>
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
        className={`border-t border-[var(--apple-separator-soft)] p-4 text-[var(--apple-label)] ${className}`}
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
          className={`border-t border-[var(--apple-separator-soft)] p-4 text-[var(--apple-label)] ${className}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
