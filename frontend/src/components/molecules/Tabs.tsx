import type { ComponentProps } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../utils/cn';

export const Tabs = TabsPrimitive.Root;

export function TabList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('mb-[18px] flex gap-1 border-b border-line', className)} {...props} />;
}

export function Tab({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        '-mb-px cursor-pointer border-b-2 border-transparent px-3.5 py-2.5 text-[13.5px] font-medium text-muted data-[state=active]:border-fg data-[state=active]:text-fg',
        className,
      )}
      {...props}
    />
  );
}

export const TabPanel = TabsPrimitive.Content;
