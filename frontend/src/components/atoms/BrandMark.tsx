import { cva, type VariantProps } from 'class-variance-authority';
import { Icon } from './Icon';

const mark = cva('flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg', {
  variants: {
    size: {
      default: 'size-10 [&_svg]:size-5',
      lg: 'size-14 [&_svg]:size-7',
    },
  },
  defaultVariants: { size: 'default' },
});

export function BrandMark({ size }: VariantProps<typeof mark>) {
  return (
    <div className={mark({ size })}>
      <Icon name="calendar-check" />
    </div>
  );
}
