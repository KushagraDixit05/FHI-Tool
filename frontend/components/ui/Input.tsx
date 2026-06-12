'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders the input with a destructive ring to signal a validation error. */
  invalid?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * Standard text input. Pairs with react-hook-form's `register()` — the returned
 * `ref` is accepted directly (React 19 ref-as-prop).
 */
export function Input({ className, invalid, type = 'text', ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex h-10 w-full rounded-lg border bg-muted/40 px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring',
        'disabled:cursor-not-allowed disabled:opacity-60',
        invalid ? 'border-destructive focus-visible:ring-destructive/20' : 'border-input',
        className
      )}
      {...props}
    />
  );
}
