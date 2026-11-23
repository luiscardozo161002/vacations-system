import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Branch, Company, User } from '@vacations/sdk';
import { UserAssignment } from './UserAssignment';

vi.mock('../../../services/sdk', () => ({ sdk: { users: { replaceBranches: vi.fn(), update: vi.fn() } } }));

const branches = [
  { branch_id: 5, company_id: 2, code: 'THH_HGO', branch_name: 'Hidalgo' },
  { branch_id: 6, company_id: 2, code: 'THH_PUE', branch_name: 'Puebla' },
] as Branch[];

const companies = [{ company_id: 2, folio: 'THH', company_name: 'Transportes' }] as Company[];

const user = {
  user_id: 2,
  username: 'r.jimenez',
  employee_name: 'Roberto Jimenez Cruz',
  role_code: 'USER',
  branch_codes: ['THH_HGO'],
  review_actions: ['approve'],
} as User;

describe('UserAssignment', () => {
  it('muestra las sedes sin guion bajo y marca las asignadas', () => {
    render(<UserAssignment user={user} branches={branches} companies={companies} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByText('THH HGO · Hidalgo')).toBeTruthy();
    expect(screen.getByText('THH PUE · Puebla')).toBeTruthy();
    expect(screen.queryByText(/THH_HGO/)).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'THH HGO · Hidalgo' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('checkbox', { name: 'THH PUE · Puebla' }).getAttribute('aria-checked')).toBe('false');
  });
});
