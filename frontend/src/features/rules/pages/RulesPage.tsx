import { useMemo, useState } from 'react';
import type { AccrualRule, CallOptions, ListAccrualRulesParams } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { usePagedList } from '../../../lib/use-paged-list';
import { refreshData } from '../../../lib/query-client';
import { useUrlFilters } from '../../../lib/use-url-filters';
import { DataTable, type Column } from '../../../components/DataTable';
import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/toast-context';
import { useAuth } from '../../auth/auth-context';
import { RuleForm } from '../components/RuleForm';

const PAGE_SIZE = 10;
const LFT_REFORM_YEAR = 2023;
const FILTERS = { pagina: '1' };

const listRules = (params: ListAccrualRulesParams, options: CallOptions) => sdk.accrualRules.list(params, options);

const seniority = (rule: AccrualRule): string => {
  if (rule.years_to === rule.years_from) return `${rule.years_from} año${rule.years_from === 1 ? '' : 's'}`;
  return `${rule.years_from}–${rule.years_to ?? 'más'} años`;
};

export function RulesPage() {
  const showToast = useToast();
  const { can } = useAuth();
  const [filters, setFilters] = useUrlFilters(FILTERS);
  const page = Number(filters.pagina);
  const params = useMemo(() => ({ page, pageSize: PAGE_SIZE, sort: 'years_from' }), [page]);
  const { data, loading, error } = usePagedList('accrual-rules', listRules, params);
  const [editing, setEditing] = useState<AccrualRule | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const effectiveYear = Math.max(LFT_REFORM_YEAR, ...(data?.data.map((rule) => rule.effective_year) ?? []));

  const openForm = (rule: AccrualRule | null) => {
    setEditing(rule);
    setFormOpen(true);
  };

  const handleSaved = (message: string) => {
    setFormOpen(false);
    showToast(message);
    refreshData();
  };

  const columns: Column<AccrualRule>[] = [
    { header: 'Antigüedad', render: seniority, className: 'cell-main' },
    { header: 'Días otorgados', render: (rule) => `${rule.vacation_days} días` },
    { header: 'Vigente desde', render: (rule) => rule.effective_year },
    { header: 'Estado', render: (rule) => <StatusBadge status={rule.status} /> },
    {
      header: '',
      render: (rule) =>
        can('rules:update') && (
          <button type="button" className="icon-btn" title="Editar" onClick={() => openForm(rule)}>
            <Icon name="edit" />
          </button>
        ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Reglas de acumulación</h1>
          <p className="page-sub">Días de vacaciones por antigüedad — reforma "vacaciones dignas" (Art. 76 LFT).</p>
        </div>
        {can('rules:create') && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => openForm(null)}>
              <Icon name="plus" /> Nueva regla
            </button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(rule) => rule.rule_id}
        loading={loading}
        emptyMessage={error ?? 'No hay reglas registradas.'}
        pagination={{
          page,
          totalPages: data?.pagination.totalPages ?? 1,
          total: data?.pagination.total ?? 0,
          onPageChange: (next) => setFilters({ pagina: String(next) }),
        }}
      />

      {formOpen && (
        <RuleForm
          key={editing?.rule_id ?? 'new'}
          rule={editing}
          effectiveYear={effectiveYear}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
