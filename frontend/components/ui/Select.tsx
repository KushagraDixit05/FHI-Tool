'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  ref?: React.Ref<HTMLSelectElement>;
}

/**
 * Styled native `<select>`. Kept native (rather than Radix) so it drops straight
 * into react-hook-form's `register()` spread with zero extra wiring.
 */
export function Select({ className, invalid, children, ref, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'flex h-10 w-full appearance-none rounded-lg border bg-muted/40 pl-3 pr-9 py-2 text-sm text-foreground',
          'transition-colors cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring',
          'disabled:cursor-not-allowed disabled:opacity-60',
          invalid ? 'border-destructive focus-visible:ring-destructive/20' : 'border-input',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
