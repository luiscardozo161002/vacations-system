export const FOLIO_MAX = 15;
export const NAME_MIN = 3;
export const NAME_MAX = 150;
export const TEXT_MAX = 255;
export const PHONE_MAX = 20;
export const RFC_MAX = 13;
export const CODE_MAX = 20;
export const BRANCH_NAME_MIN = 2;
export const BRANCH_NAME_MAX = 100;

const FOLIO_PATTERN = /^[A-Z0-9]{2,15}$/;
const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const CODE_PATTERN = /^[A-Z0-9_]{2,20}$/;

export interface CompanyValues {
  folio: string;
  company_name: string;
  rfc: string;
  phone_number: string;
  location: string;
  logo: string;
  color: string | null;
}

export interface BranchValues {
  company_id: string;
  code: string;
  branch_name: string;
  color: string | null;
}

export type CompanyErrors = Partial<Record<keyof CompanyValues, string>>;
export type BranchErrors = Partial<Record<keyof BranchValues, string>>;

export const cleanFolio = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, FOLIO_MAX);
export const cleanRfc = (value: string) => value.toUpperCase().replace(/[^A-ZÑ&0-9]/g, '').slice(0, RFC_MAX);
export const cleanCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, CODE_MAX);

const validFolio = (value: string) => {
  if (!value) return 'Escribe el folio de la empresa';
  if (!FOLIO_PATTERN.test(value)) return 'El folio solo admite letras y números, de 2 a 15 caracteres, sin espacios';
};

const validName = (value: string) => {
  const name = value.trim();
  if (!name) return 'Escribe la razón social';
  if (name.length < NAME_MIN) return `La razón social necesita al menos ${NAME_MIN} caracteres`;
  if (name.length > NAME_MAX) return `La razón social admite máximo ${NAME_MAX} caracteres`;
};

const validRfc = (value: string) => {
  if (value && !RFC_PATTERN.test(value)) return 'El RFC no es válido, por ejemplo THH981218DS0 (3 o 4 letras, 6 dígitos y 3 caracteres)';
};

const validLogo = (value: string) => {
  const logo = value.trim();
  if (!logo) return undefined;
  if (logo.length > TEXT_MAX) return `El logotipo admite máximo ${TEXT_MAX} caracteres`;
  try {
    const url = new URL(logo);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol');
  } catch {
    return 'El logotipo debe ser una dirección web que empiece con http:// o https://';
  }
};

const compact = <T extends object>(errors: T) => Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as T;

export const validateCompany = (values: CompanyValues): CompanyErrors =>
  compact<CompanyErrors>({
    folio: validFolio(values.folio),
    company_name: validName(values.company_name),
    rfc: validRfc(values.rfc),
    phone_number: values.phone_number.length > PHONE_MAX ? `El teléfono admite máximo ${PHONE_MAX} caracteres` : undefined,
    location: values.location.length > TEXT_MAX ? `La dirección admite máximo ${TEXT_MAX} caracteres` : undefined,
    logo: validLogo(values.logo),
  });

export const validateBranch = (values: BranchValues): BranchErrors => {
  const name = values.branch_name.trim();
  return compact<BranchErrors>({
    company_id: values.company_id ? undefined : 'Selecciona una empresa de la lista',
    code: !values.code
      ? 'Escribe el código de la sede'
      : CODE_PATTERN.test(values.code)
        ? undefined
        : 'El código solo admite letras, números y guion bajo, de 2 a 20 caracteres, por ejemplo THH_HGO',
    branch_name: !name
      ? 'Escribe el nombre de la sede'
      : name.length < BRANCH_NAME_MIN
        ? `El nombre necesita al menos ${BRANCH_NAME_MIN} caracteres`
        : name.length > BRANCH_NAME_MAX
          ? `El nombre admite máximo ${BRANCH_NAME_MAX} caracteres`
          : undefined,
  });
};
