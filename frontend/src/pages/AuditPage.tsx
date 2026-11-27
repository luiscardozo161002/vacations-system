import { useMemo, useState } from 'react';
import type { AuditLogEntry } from '@vacations/sdk';
import { sdk } from '../services/sdk';
import { config } from '../config';
import { formatDateTime } from '../utils/format';
import { ROLE_LABELS } from '../layouts/navigation';
import { usePagedList } from '../hooks/use-paged-list';
import { usePageFilters } from '../hooks/use-page-filters';
import { DataTable, type Column } from '../components/organisms/DataTable';
import { Icon } from '../components/atoms/Icon';
import { IconButton } from '../components/atoms/IconButton';
import { Select } from '../components/atoms/Select';
import { PageHeader } from '../components/molecules/PageHeader';
import { ClearFilters } from '../components/molecules/ClearFilters';
import { SearchInput } from '../components/molecules/SearchInput';
import { StatusBadge } from '../components/atoms/StatusBadge';
import { RowActions, Toolbar } from '../components/molecules/Toolbar';
import { AuditDetail } from '../features/audit/components/AuditDetail';
import { MODULE_LABELS, eventLabel, moduleLabel, targetLabel } from '../features/audit/labels';

const FILTERS = { resultado: '', modulo: '', q: '' };

const RESULT_OPTIONS = [
  { value: '', label: 'Todos los resultados' },
  { value: 'success', label: 'Exitoso' },
  { value: 'failed', label: 'Fallido' },
];

const MODULE_OPTIONS = [
  { value: '', label: 'Todos los módulos' },
  ...Object.entries(MODULE_LABELS).map(([value, label]) => ({ value, label })),
];

export function AuditPage() {
  const { filters, page, setFilter, setPage, clear, active } = usePageFilters(FILTERS);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const params = useMemo(
    () => ({
      page,
      pageSize: config.pageSize,
      result: filters.resultado ? (filters.resultado as 'success' | 'failed') : undefined,
      entity: filters.modulo || undefined,
      search: filters.q || undefined,
    }),
    [page, filters.resultado, filters.modulo, filters.q],
  );
  const { data, loading, error } = usePagedList('audit-log', sdk.auditLog, params);

  const columns: Column<AuditLogEntry>[] = [
    {
      header: 'Usuario',
      render: (entry) => (
        <>
          <span className="font-medium">{entry.username ?? 'desconocido'}</span>
          <div className="text-[12.5px] text-muted">{ROLE_LABELS[entry.role_code ?? ''] ?? entry.role_code}</div>
        </>
      ),
    },
    { header: 'Fecha y hora', render: (entry) => formatDateTime(entry.created_at), className: 'text-[12.5px] text-muted' },
    { header: 'Módulo', render: moduleLabel },
    {
      header: 'Acción',
      render: (entry) => (
        <>
          {eventLabel(entry)}
          <div className="text-[12.5px] text-muted">{targetLabel(entry)}</div>
        </>
      ),
    },
    { header: 'Resultado', render: (entry) => <StatusBadge status={entry.result} /> },
    {
      header: '',
      render: (entry) => (
        <RowActions>
          <IconButton title="Ver detalle" onClick={() => setSelected(entry)}>
            <Icon name="eye" />
          </IconButton>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Auditoría" subtitle="Quién hizo qué, cuándo, en qué módulo y desde dónde." />
      <Toolbar>
        <Select compact aria-label="Módulo" value={filters.modulo} onChange={(modulo) => setFilter({ modulo })} options={MODULE_OPTIONS} />
        <Select compact aria-label="Resultado" value={filters.resultado} onChange={(resultado) => setFilter({ resultado })} options={RESULT_OPTIONS} />
        <SearchInput placeholder="Buscar usuario o evento..." value={filters.q} onSearch={(q) => setFilter({ q })} />
        <ClearFilters active={active} onClear={clear} />
      </Toolbar>
      <DataTable
        columns={columns}
        data={data}
        rowKey={(entry) => entry.log_id}
        page={page}
        onPageChange={setPage}
        loading={loading}
        emptyMessage={error ?? 'No hay eventos con estos filtros.'}
      />
      {selected && <AuditDetail entry={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
