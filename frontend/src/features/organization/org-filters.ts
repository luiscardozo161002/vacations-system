export const ORG_FILTERS = { empresa: '', sede: '', departamento: '' };

export type OrgFilterValues = typeof ORG_FILTERS;

const asId = (value: string) => (value ? Number(value) : undefined);

export const orgParams = ({ empresa, sede, departamento }: OrgFilterValues) => ({
  company_id: asId(empresa),
  branch_id: asId(sede),
  department_id: asId(departamento),
});
