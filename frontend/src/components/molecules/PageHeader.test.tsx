import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('muestra el título, el subtítulo y las acciones', () => {
    render(
      <PageHeader title="Empleados" subtitle="Catálogo de personal.">
        <button type="button">Nuevo empleado</button>
      </PageHeader>,
    );

    expect(screen.getByRole('heading', { name: 'Empleados' })).toBeTruthy();
    expect(screen.getByText('Catálogo de personal.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nuevo empleado' })).toBeTruthy();
  });

  it('no dibuja el contenedor de acciones cuando no hay ninguna', () => {
    const { container } = render(
      <PageHeader title="Auditoría" subtitle="Historial.">
        {false}
      </PageHeader>,
    );

    expect(container.firstElementChild?.children).toHaveLength(1);
  });
});
