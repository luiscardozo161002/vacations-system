import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ColorBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color: string | null;
}

export function ColorBadge({ color, className, style, ...props }: ColorBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        color
          ? 'bg-[color-mix(in_srgb,var(--tone)_16%,transparent)] text-[color-mix(in_srgb,var(--tone)_65%,var(--text))]'
          : 'bg-neutral text-neutral-fg',
        className,
      )}
      style={color ? ({ ...style, '--tone': color } as CSSProperties) : style}
      {...props}
    />
  );
}
