import { useMemo } from 'react';
import type { AccrualRule } from '@vacations/sdk';
import { sdk } from '../../../api/sdk';
import { config } from '../../../config';
import { usePagedList } from '../../../hooks/use-paged-list';
import { usePageFilters } from '../../../hooks/use-page-filters';
import { useRecordForm } from '../../../hooks/use-record-form';
import { DataTable, type Column } from '../../../components/organisms/DataTable';
import { Icon } from '../../../components/atoms/Icon';
import { PageHeader } from '../../../components/molecules/PageHeader';
import { StatusBadge } from '../../../components/atoms/StatusBadge';
import { useAuth } from '../../auth/auth-context';
import { RuleForm } from '../components/RuleForm';
import { IconButton } from '../../../components/atoms/IconButton';
import { Button } from '../../../components/atoms/Button';

const FILTERS = {};

const seniority = (rule: AccrualRule): string => {
  if (rule.years_to === rule.years_from) return `${rule.years_from} año${rule.years_from === 1 ? '' : 's'}`;
  return `${rule.years_from}–${rule.years_to ?? 'más'} años`;
};

export function RulesPage() {
  const { can } = useAuth();
  const { page, setPage } = usePageFilters(FILTERS);
  const params = useMemo(() => ({ page, pageSize: config.pageSize, sort: 'years_from' }), [page]);
  const { data, loading, error } = usePagedList('accrual-rules', sdk.accrualRules, params);
  const form = useRecordForm<AccrualRule>();

  const effectiveYear = Math.max(config.lftReformYear, ...(data?.data.map((rule) => rule.effective_year) ?? []));

  const columns: Column<AccrualRule>[] = [
    { header: 'Antigüedad', render: seniority, className: 'font-medium' },
    { header: 'Días otorgados', render: (rule) => `${rule.vacation_days} días` },
    { header: 'Vigente desde', render: (rule) => rule.effective_year },
    { header: 'Estado', render: (rule) => <StatusBadge status={rule.status} /> },
    {
      header: '',
      render: (rule) =>
        can('rules:update') && (
          <IconButton title="Editar" onClick={() => form.open(rule)}>
            <Icon name="edit" />
          </IconButton>
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Reglas de acumulación" subtitle='Días de vacaciones por antigüedad — reforma "vacaciones dignas" (Art. 76 LFT).'>
        {can('rules:create') && (
          <Button onClick={() => form.open()}>
            <Icon name="plus" /> Nueva regla
          </Button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={data}
        rowKey={(rule) => rule.rule_id}
        page={page}
        onPageChange={setPage}
        loading={loading}
        emptyMessage={error ?? 'No hay reglas registradas.'}
      />

      {form.isOpen && (
        <RuleForm
          key={form.record?.rule_id ?? 'new'}
          rule={form.record}
          effectiveYear={effectiveYear}
          onClose={form.close}
          onSaved={form.saved}
        />
      )}
    </>
  );
}
