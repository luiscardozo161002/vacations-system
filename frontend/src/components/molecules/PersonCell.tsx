import { initial } from '../../utils/format';
import { Avatar } from '../atoms/Avatar';

export function PersonCell({ name }: { name: string | null }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar>{initial(name ?? '')}</Avatar>
      <span className="font-medium">{name}</span>
    </div>
  );
}
