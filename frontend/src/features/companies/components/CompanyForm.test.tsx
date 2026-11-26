import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Company } from '@vacations/sdk';
import { CompanyForm } from './CompanyForm';

const { create, update } = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('../../../services/sdk', () => ({ sdk: { companies: { create, update } } }));

const existing = {
  company_id: 2,
  folio: 'THH',
  company_name: 'TRANSPORTES HIDRO',
  rfc: 'THH981218DS0',
  phone_number: null,
  location: null,
  logo: null,
  color: '#16a34a',
} as Company;

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('CompanyForm', () => {
  beforeEach(() => {
    create.mockReset().mockResolvedValue({ company_id: 9 });
    update.mockReset().mockResolvedValue(existing);
  });

  it('al crear muestra bajo cada campo lo que falta y no envía', () => {
    const onSaved = vi.fn();
    render(<CompanyForm company={null} onClose={vi.fn()} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear empresa' }));

    expect(screen.getByText('Escribe la razón social')).toBeTruthy();
    expect(screen.getByText('Escribe el folio de la empresa')).toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });

  it('crea la empresa con el folio y el RFC en mayúsculas y los opcionales vacíos como nulos', async () => {
    const onSaved = vi.fn();
    render(<CompanyForm company={null} onClose={vi.fn()} onSaved={onSaved} />);

    type('Razón social', 'Empresa Nueva SA de CV');
    type('Folio', 'new');
    type('RFC', 'new010101ab1');
    fireEvent.click(screen.getByRole('button', { name: 'Crear empresa' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Empresa creada.', { company_id: 9 }));
    expect(create).toHaveBeenCalledWith({
      folio: 'NEW',
      company_name: 'Empresa Nueva SA de CV',
      rfc: 'NEW010101AB1',
      phone_number: null,
      location: null,
      logo: null,
      color: null,
    });
  });

  it('al editar abre en solo lectura, Guardar cambios espera un cambio y pregunta antes de enviar', async () => {
    render(<CompanyForm company={existing} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByLabelText('Razón social').matches(':disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const save = screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    type('Teléfono', '771 123 4567');
    fireEvent.click(save);
    expect(screen.getByText('¿Guardar los cambios de TRANSPORTES HIDRO?')).toBeTruthy();
    expect(update).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Guardar cambios' }).at(-1)!);
    await waitFor(() => expect(update).toHaveBeenCalledWith(2, expect.objectContaining({ phone_number: '771 123 4567' })));
  });
});
