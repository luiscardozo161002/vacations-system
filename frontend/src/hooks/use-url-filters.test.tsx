import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderApp } from '../test/render';
import { useUrlFilters } from './use-url-filters';

const FILTERS = { estado: '', pagina: '1' };

function Filters() {
  const [filters, setFilters] = useUrlFilters(FILTERS);
  return (
    <>
      <span data-testid="values">{`${filters.estado}|${filters.pagina}`}</span>
      <button type="button" onClick={() => setFilters({ estado: 'active', pagina: '1' })}>
        activos
      </button>
      <button type="button" onClick={() => setFilters({ pagina: '3' })}>
        página 3
      </button>
    </>
  );
}

describe('useUrlFilters', () => {
  it('lee los filtros de la URL y usa el valor por omisión si faltan', () => {
    renderApp(<Filters />, '/empleados?pagina=2');
    expect(screen.getByTestId('values').textContent).toBe('|2');
  });

  it('guarda los cambios en la URL y quita los valores por omisión', () => {
    renderApp(<Filters />, '/empleados?pagina=2');

    fireEvent.click(screen.getByText('activos'));
    expect(screen.getByTestId('location').textContent).toBe('/empleados?estado=active');

    fireEvent.click(screen.getByText('página 3'));
    expect(screen.getByTestId('location').textContent).toBe('/empleados?estado=active&pagina=3');
    expect(screen.getByTestId('values').textContent).toBe('active|3');
  });
});
