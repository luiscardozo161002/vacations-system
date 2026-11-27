import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

interface ClearFiltersProps {
  active: boolean;
  onClear: () => void;
}

export function ClearFilters({ active, onClear }: ClearFiltersProps) {
  if (!active) return null;

  return (
    <Button variant="ghost" size="sm" onClick={onClear}>
      <Icon name="x" /> Limpiar filtros
    </Button>
  );
}
