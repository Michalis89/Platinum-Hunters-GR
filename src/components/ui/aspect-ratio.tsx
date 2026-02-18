'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type AspectRatioProps = React.HTMLAttributes<HTMLDivElement> & {
  ratio?: number;
};

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 1, className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative w-full', className)}
      style={{ aspectRatio: String(ratio), ...style }}
      {...props}
    />
  ),
);
AspectRatio.displayName = 'AspectRatio';

export { AspectRatio };
