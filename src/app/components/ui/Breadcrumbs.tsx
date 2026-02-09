/**
 * Breadcrumbs Navigation Component
 * Follows Apple Human Interface Guidelines for breadcrumb navigation
 * Provides clear navigation hierarchy for deep pages
 */

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-sm ${className}`}
    >
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={`${item.href || item.label}-${index}`} className="flex items-center gap-1.5">
              {!isFirst && (
                <ChevronRight
                  className="h-3.5 w-3.5 text-[var(--apple-tertiary-label)]"
                  aria-hidden="true"
                />
              )}

              {isLast || !item.href ? (
                <span
                  className="apple-body-tracking font-medium text-[var(--apple-label)]"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="
                    apple-body-tracking text-[var(--apple-secondary-label)]
                    transition-colors duration-150
                    hover:text-[var(--apple-label)]
                    hover:underline hover:underline-offset-2
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[var(--apple-system-blue)]
                    focus-visible:ring-offset-2
                    rounded-sm
                  "
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
