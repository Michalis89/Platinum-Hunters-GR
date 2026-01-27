// components/ui/Card.tsx
'use client';

import { ReactNode, createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CardContextValue {
  isCollapsed: boolean;
  isCollapsible: boolean;
  toggle: () => void;
}

const CardContext = createContext<CardContextValue | null>(null);

interface CardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly id?: string;
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
}

export function Card({
  children,
  className = '',
  id,
  collapsible = false,
  defaultCollapsed = false,
}: Readonly<CardProps>) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggle = () => setIsCollapsed(prev => !prev);

  return (
    <CardContext.Provider value={{ isCollapsed, isCollapsible: collapsible, toggle }}>
      <div
        id={id}
        className={`rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] shadow-[0_12px_30px_rgba(3,7,18,0.45)] ${className}`}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}

interface CardContentProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function CardContent({ children, className = '' }: Readonly<CardContentProps>) {
  const context = useContext(CardContext);
  const isCollapsed = context?.isCollapsed ?? false;
  const isCollapsible = context?.isCollapsible ?? false;

  if (!isCollapsible) {
    return <div className={`p-4 ${className}`}>{children}</div>;
  }

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className={`p-4 ${className}`}>{children}</div>
      </div>
    </div>
  );
}

export function CardHeader({ children, className = '' }: Readonly<CardContentProps>) {
  const context = useContext(CardContext);
  const isCollapsible = context?.isCollapsible ?? false;
  const isCollapsed = context?.isCollapsed ?? false;
  const toggle = context?.toggle;

  if (isCollapsible) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between border-b border-[var(--hb-border)] p-4 text-left transition-colors hover:bg-[var(--hb-card)] ${isCollapsed ? 'border-b-0' : ''} ${className}`}
      >
        <div className="flex-1">{children}</div>
        <ChevronDown
          className={`ml-2 h-5 w-5 text-[var(--hb-muted)] transition-transform duration-200 ${
            isCollapsed ? '' : 'rotate-180'
          }`}
        />
      </button>
    );
  }

  return <div className={`border-b border-[var(--hb-border)] p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: Readonly<CardContentProps>) {
  const context = useContext(CardContext);
  const isCollapsed = context?.isCollapsed ?? false;
  const isCollapsible = context?.isCollapsible ?? false;

  if (!isCollapsible) {
    return <div className={`border-t border-[var(--hb-border)] p-4 ${className}`}>{children}</div>;
  }

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className={`border-t border-[var(--hb-border)] p-4 ${className}`}>{children}</div>
      </div>
    </div>
  );
}

export function CardTitle({ children, className = '' }: Readonly<CardContentProps>) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--hb-headline)] ${className}`}>{children}</h3>
  );
}

export function CardDescription({ children, className = '' }: Readonly<CardContentProps>) {
  return <p className={`text-sm text-[var(--hb-muted)] ${className}`}>{children}</p>;
}
