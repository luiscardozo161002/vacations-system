import { Icon } from '../components/Icon';
import type { NavItem } from './navigation';

export function PendingPage({ item }: { item: NavItem }) {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>{item.title}</h1>
        </div>
      </div>
      <div className="table-wrap">
        <div className="empty-state">
          <div className="mark">
            <Icon name={item.icon} />
          </div>
          <p>Esta pantalla se construye en {item.ticket}.</p>
        </div>
      </div>
    </>
  );
}
