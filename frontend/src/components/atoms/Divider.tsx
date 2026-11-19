import { cn } from '../../utils/cn';

export function Divider({ className }: { className?: string }) {
  return <div role="separator" className={cn('my-[18px] h-px bg-line', className)} />;
}
