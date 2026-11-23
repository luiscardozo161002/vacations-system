import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: string | null;
}

export function Card({ className, accent, style, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg border border-line bg-surface p-[18px] shadow-sm', className)}
      style={accent ? { ...style, borderTop: `4px solid ${accent}` } : style}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-3.5 flex items-center justify-between', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('mb-0.5 text-[15px] font-semibold text-fg', className)} {...props} />;
}
