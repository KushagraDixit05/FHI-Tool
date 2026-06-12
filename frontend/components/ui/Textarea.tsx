'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export function Textarea({ className, invalid, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex min-h-20 w-full rounded-lg border bg-muted/40 px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground transition-colors resize-y',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring',
        'disabled:cursor-not-allowed disabled:opacity-60',
        invalid ? 'border-destructive focus-visible:ring-destructive/20' : 'border-input',
        className
      )}
      {...props}
    />
  );
}
