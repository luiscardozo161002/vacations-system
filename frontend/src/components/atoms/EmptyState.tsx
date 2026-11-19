import { Icon } from './Icon';

export function EmptyState({ message, icon = 'inbox' }: { message: string; icon?: string }) {
  return (
    <div className="px-5 py-12 text-center text-muted">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-subtle">
        <Icon name={icon} />
      </div>
      <p>{message}</p>
    </div>
  );
}
