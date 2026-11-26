import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '../../utils/cn';
import { Icon } from '../atoms/Icon';

interface SearchBoxProps extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
  wrapperId?: string;
  wrapperRef?: Ref<HTMLDivElement>;
  onClear?: () => void;
  children?: ReactNode;
}

export function SearchBox({ wrapperClassName, wrapperId, wrapperRef, onClear, children, className, ...input }: SearchBoxProps) {
  const canClear = Boolean(onClear) && typeof input.value === 'string' && input.value !== '' && !input.disabled;

  return (
    <div
      id={wrapperId}
      ref={wrapperRef}
      className={cn(
        'relative flex h-9 w-60 items-center gap-2 rounded-sm border border-line bg-subtle px-2.5 text-muted focus-within:border-fg focus-within:shadow-[0_0_0_3px_var(--focus-ring)] has-[input[aria-invalid=true]]:border-danger-fg has-[input:disabled]:bg-subtle',
        wrapperClassName,
      )}
    >
      <Icon name="search" />
      <input type="text" className={cn('h-full min-w-0 flex-1 border-none bg-transparent text-base text-fg outline-none', className)} {...input} />
      {canClear && (
        <button
          type="button"
          aria-label="Borrar"
          title="Borrar"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClear}
          className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-line hover:text-fg"
        >
          <Icon name="x" />
        </button>
      )}
      {children}
    </div>
  );
}
