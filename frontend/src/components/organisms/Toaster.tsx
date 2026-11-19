import { Toaster as Sonner } from 'sonner';
import { config } from '../../config';

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      offset={20}
      duration={config.toastMs}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'flex w-[356px] max-w-full items-center gap-2.5 rounded-sm bg-fg px-4 py-3 text-[13.5px] text-page shadow-md',
        },
      }}
    />
  );
}
