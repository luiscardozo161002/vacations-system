import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderApp } from '../test/render';
import { usePageFilters } from './use-page-filters';

const FILTERS = { estado: '' };

function Filters() {
  const { filters, page, setFilter, setPage } = usePageFilters(FILTERS);
  return (
    <>
      <span data-testid="values">{`${filters.estado}|${page}`}</span>
      <button type="button" onClick={() => setFilter({ estado: 'active' })}>
        activos
      </button>
      <button type="button" onClick={() => setPage(3)}>
        página 3
      </button>
    </>
  );
}

describe('usePageFilters', () => {
  it('lee la página de la URL y usa la primera si falta', () => {
    renderApp(<Filters />, '/empleados');
    expect(screen.getByTestId('values').textContent).toBe('|1');
  });

  it('cambiar de página conserva los filtros', () => {
    renderApp(<Filters />, '/empleados?estado=active');

    fireEvent.click(screen.getByText('página 3'));

    expect(screen.getByTestId('location').textContent).toBe('/empleados?estado=active&pagina=3');
    expect(screen.getByTestId('values').textContent).toBe('active|3');
  });

  it('cambiar un filtro vuelve a la primera página', () => {
    renderApp(<Filters />, '/empleados?pagina=4');

    fireEvent.click(screen.getByText('activos'));

    expect(screen.getByTestId('location').textContent).toBe('/empleados?estado=active');
    expect(screen.getByTestId('values').textContent).toBe('active|1');
  });
});
