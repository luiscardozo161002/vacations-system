import { Icon } from './Icon';

export function EmptyState({ message, icon = 'inbox' }: { message: string; icon?: string }) {
  return (
    <div className="empty-state">
      <div className="mark">
        <Icon name={icon} />
      </div>
      <p>{message}</p>
    </div>
  );
}
