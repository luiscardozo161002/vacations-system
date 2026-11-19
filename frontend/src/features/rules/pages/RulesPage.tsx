import { useMemo } from 'react';
import type { AccrualRule } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { config } from '../../../lib/config';
import { usePagedList } from '../../../lib/use-paged-list';
import { usePageFilters } from '../../../lib/use-page-filters';
import { useRecordForm } from '../../../lib/use-record-form';
import { DataTable, type Column } from '../../../components/DataTable';
import { Icon } from '../../../components/Icon';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { useAuth } from '../../auth/auth-context';
import { RuleForm } from '../components/RuleForm';

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
    { header: 'Antigüedad', render: seniority, className: 'cell-main' },
    { header: 'Días otorgados', render: (rule) => `${rule.vacation_days} días` },
    { header: 'Vigente desde', render: (rule) => rule.effective_year },
    { header: 'Estado', render: (rule) => <StatusBadge status={rule.status} /> },
    {
      header: '',
      render: (rule) =>
        can('rules:update') && (
          <button type="button" className="icon-btn" title="Editar" onClick={() => form.open(rule)}>
            <Icon name="edit" />
          </button>
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Reglas de acumulación" subtitle='Días de vacaciones por antigüedad — reforma "vacaciones dignas" (Art. 76 LFT).'>
        {can('rules:create') && (
          <button type="button" className="btn btn-primary" onClick={() => form.open()}>
            <Icon name="plus" /> Nueva regla
          </button>
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
