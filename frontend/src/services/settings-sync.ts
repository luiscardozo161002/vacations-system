import { exportAppearance, importAppearance, subscribeAppearance } from '../utils/appearance';
import { sdk } from './sdk';

const SAVE_DELAY_MS = 600;

export const startSettingsSync = (): (() => void) => {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let unsubscribe: (() => void) | undefined;

  const save = () => {
    sdk.settings.save(exportAppearance()).catch(() => undefined);
  };

  sdk.settings
    .get()
    .then((saved) => {
      if (stopped) return;
      if (Object.values(saved).some((value) => value !== null)) importAppearance(saved);
      else save();
    })
    .catch(() => undefined)
    .finally(() => {
      if (stopped) return;
      unsubscribe = subscribeAppearance(() => {
        clearTimeout(timer);
        timer = setTimeout(save, SAVE_DELAY_MS);
      });
    });

  return () => {
    stopped = true;
    clearTimeout(timer);
    unsubscribe?.();
  };
};
