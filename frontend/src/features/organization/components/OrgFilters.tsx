import { useMemo } from 'react';
import { formatCode } from '../../../utils/format';
import { SearchSelect } from '../../../components/molecules/SearchSelect';
import { useBranches } from '../../branches/hooks/useBranches';
import { useCompanies } from '../../companies/hooks/useCompanies';
import { useDepartments } from '../../departments/hooks/useDepartments';
import type { OrgFilterValues } from '../org-filters';

interface OrgFiltersProps {
  filters: OrgFilterValues;
  setFilter: (changes: Partial<OrgFilterValues>) => void;
  idPrefix: string;
}

export function OrgFilters({ filters, setFilter, idPrefix }: OrgFiltersProps) {
  const { companies } = useCompanies();
  const { branches } = useBranches();
  const { departments } = useDepartments();

  const companyOptions = useMemo(
    () => companies.map((company) => ({ value: String(company.company_id), label: company.company_name })),
    [companies],
  );

  const branchOptions = useMemo(
    () =>
      branches
        .filter((branch) => !filters.empresa || String(branch.company_id) === filters.empresa)
        .map((branch) => ({ value: String(branch.branch_id), label: `${formatCode(branch.code)} · ${branch.branch_name}` })),
    [branches, filters.empresa],
  );

  const departmentOptions = useMemo(() => {
    const branchesOfCompany = new Set(
      branches.filter((branch) => !filters.empresa || String(branch.company_id) === filters.empresa).map((branch) => branch.branch_id),
    );
    return departments
      .filter((department) => (filters.sede ? String(department.branch_id) === filters.sede : branchesOfCompany.has(department.branch_id)))
      .map((department) => ({
        value: String(department.department_id),
        label: `${department.department_name}${department.branch_code ? ` · ${formatCode(department.branch_code)}` : ''}`,
      }));
  }, [branches, departments, filters.empresa, filters.sede]);

  return (
    <>
      <SearchSelect
        id={`${idPrefix}-company-filter`}
        options={companyOptions}
        value={filters.empresa}
        onChange={(empresa) => setFilter({ empresa, sede: '', departamento: '' })}
        placeholder="Todas las empresas"
      />
      <SearchSelect
        id={`${idPrefix}-branch-filter`}
        options={branchOptions}
        value={filters.sede}
        onChange={(sede) => setFilter({ sede, departamento: '' })}
        placeholder="Todas las sedes"
      />
      <SearchSelect
        id={`${idPrefix}-dept-filter`}
        options={departmentOptions}
        value={filters.departamento}
        onChange={(departamento) => setFilter({ departamento })}
        placeholder="Todos los departamentos"
      />
    </>
  );
}
