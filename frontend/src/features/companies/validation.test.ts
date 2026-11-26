import { describe, expect, it } from 'vitest';
import { cleanCode, cleanFolio, cleanRfc, validateBranch, validateCompany, type CompanyValues } from './validation';

const company: CompanyValues = {
  folio: 'THH',
  company_name: 'TRANSPORTES HIDRO HIDALGUENSES S.A. DE C.V.',
  rfc: 'THH981218DS0',
  phone_number: '',
  location: '',
  logo: '',
  color: null,
};

describe('validateCompany', () => {
  it('acepta una empresa completa y una con solo lo obligatorio', () => {
    expect(validateCompany(company)).toEqual({});
    expect(validateCompany({ ...company, rfc: '', logo: '' })).toEqual({});
  });

  it('cada campo explica qué falló', () => {
    const errors = validateCompany({ ...company, folio: '', company_name: 'AB', rfc: '123', logo: 'logo.png' });

    expect(errors.folio).toBe('Escribe el folio de la empresa');
    expect(errors.company_name).toMatch(/al menos 3 caracteres/);
    expect(errors.rfc).toMatch(/RFC no es válido/);
    expect(errors.logo).toMatch(/empiece con http/);
  });

  it('el logotipo admite solo direcciones http o https', () => {
    expect(validateCompany({ ...company, logo: 'https://example.com/logo.png' }).logo).toBeUndefined();
    expect(validateCompany({ ...company, logo: 'ftp://example.com/logo.png' }).logo).toMatch(/empiece con http/);
  });
});

describe('validateBranch', () => {
  const branch = { company_id: '2', code: 'THH_HGO', branch_name: 'Hidalgo', color: null };

  it('acepta una sede correcta', () => {
    expect(validateBranch(branch)).toEqual({});
  });

  it('pide empresa, código y nombre', () => {
    const errors = validateBranch({ company_id: '', code: '', branch_name: ' ', color: null });

    expect(errors.company_id).toMatch(/Selecciona una empresa/);
    expect(errors.code).toBe('Escribe el código de la sede');
    expect(errors.branch_name).toBe('Escribe el nombre de la sede');
  });

  it('el código no admite espacios ni caracteres raros', () => {
    expect(validateBranch({ ...branch, code: 'A B' }).code).toMatch(/solo admite letras, números y guion bajo/);
  });
});

describe('limpiadores', () => {
  it('el folio, el RFC y el código se escriben en mayúsculas y sin caracteres inválidos', () => {
    expect(cleanFolio('th h-1')).toBe('THH1');
    expect(cleanRfc('thh 981218-ds0')).toBe('THH981218DS0');
    expect(cleanCode('thh hgo_1!')).toBe('THHHGO_1');
  });
});
