import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DataTable, type Column } from './DataTable';

interface Row {
  id: number;
  name: string;
}

const columns: Column<Row>[] = [{ header: 'Nombre', render: (row) => row.name }];

const page = (data: Row[], pagination: { page: number; totalPages: number; total: number }) => ({
  data,
  pagination: { pageSize: 10, ...pagination },
});

const table = (props: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) => (
  <DataTable
    columns={columns}
    data={page([{ id: 1, name: 'Ana' }, { id: 2, name: 'Luis' }], { page: 2, totalPages: 3, total: 25 })}
    rowKey={(row) => row.id}
    page={2}
    onPageChange={() => undefined}
    emptyMessage="No hay filas."
    {...props}
  />
);

describe('DataTable', () => {
  it('pinta las filas y el total de la página que recibe', () => {
    render(table());

    expect(screen.getAllByRole('row').slice(1).map((row) => row.textContent)).toEqual(['Ana', 'Luis']);
    expect(screen.getByText('25 resultados')).toBeTruthy();
    expect(screen.getByText('Página 2 de 3')).toBeTruthy();
  });

  it('pide la página anterior y la siguiente', () => {
    const onPageChange = vi.fn();
    render(table({ onPageChange }));

    fireEvent.click(screen.getByTitle('Página anterior'));
    fireEvent.click(screen.getByTitle('Página siguiente'));

    expect(onPageChange.mock.calls).toEqual([[1], [3]]);
  });

  it('bloquea los extremos', () => {
    render(table({ data: page([{ id: 1, name: 'Ana' }], { page: 1, totalPages: 1, total: 1 }), page: 1 }));

    expect((screen.getByTitle('Página anterior') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTitle('Página siguiente') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('1 resultado')).toBeTruthy();
  });

  it('muestra el mensaje vacío sin datos y "Cargando..." mientras carga', () => {
    const { rerender } = render(table({ data: null }));
    expect(screen.getByText('No hay filas.')).toBeTruthy();
    expect(screen.getByText('0 resultados')).toBeTruthy();

    rerender(table({ data: null, loading: true }));
    expect(screen.getByText('Cargando...')).toBeTruthy();
  });
});
