import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function DropdownPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'absolute top-[calc(100%+10px)] right-0 z-[60] max-h-[360px] w-80 overflow-y-auto rounded-md border border-line bg-surface shadow-md',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownTitle({ children }: { children: ReactNode }) {
  return <div className="border-b border-line px-3.5 py-3 text-[13.5px] font-semibold text-fg">{children}</div>;
}

interface DropdownItemProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onClick: () => void;
}

export function DropdownItem({ title, subtitle, onClick }: DropdownItemProps) {
  return (
    <div
      className="flex cursor-pointer items-start gap-2.5 border-b border-line px-3.5 py-2.5 last:border-b-0 hover:bg-subtle"
      onClick={onClick}
    >
      <span className="mt-1.5 size-[7px] shrink-0 rounded-full bg-primary" />
      <div className="text-[12.5px] leading-[1.4] text-fg">
        {title}
        {subtitle && <div className="mt-0.5 text-[11.5px] text-muted">{subtitle}</div>}
      </div>
    </div>
  );
}

export function DropdownEmpty({ children }: { children: ReactNode }) {
  return <div className="px-3.5 py-[22px] text-center text-sm text-muted">{children}</div>;
}
