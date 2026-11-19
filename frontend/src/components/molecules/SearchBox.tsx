import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '../../utils/cn';
import { Icon } from '../atoms/Icon';

interface SearchBoxProps extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
  wrapperId?: string;
  wrapperRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}

export function SearchBox({ wrapperClassName, wrapperId, wrapperRef, children, className, ...input }: SearchBoxProps) {
  return (
    <div
      id={wrapperId}
      ref={wrapperRef}
      className={cn(
        'relative flex h-9 w-60 items-center gap-2 rounded-sm border border-line bg-subtle px-2.5 text-muted focus-within:border-fg focus-within:shadow-[0_0_0_3px_rgba(15,23,42,0.08)]',
        wrapperClassName,
      )}
    >
      <Icon name="search" />
      <input type="text" className={cn('h-full flex-1 border-none bg-transparent text-base text-fg outline-none', className)} {...input} />
      {children}
    </div>
  );
}
