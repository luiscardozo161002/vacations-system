import type { ReactNode } from 'react';
import type { Paginated } from '@vacations/sdk';
import { cn } from '../../utils/cn';
import { EmptyState } from '../atoms/EmptyState';
import { Icon } from '../atoms/Icon';
import { IconButton } from '../atoms/IconButton';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: Paginated<T> | null;
  rowKey: (row: T) => string | number;
  page: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  emptyMessage: string;
}

export function DataTable<T>({ columns, data, rowKey, page, onPageChange, loading = false, emptyMessage }: DataTableProps<T>) {
  const rows = data?.data ?? [];
  const showEmpty = loading || rows.length === 0;

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[640px] border-collapse" aria-busy={loading}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="whitespace-nowrap border-b border-line bg-subtle px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.03em] text-muted"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child_td]:border-b-0">
          {showEmpty ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState message={loading ? 'Cargando...' : emptyMessage} />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-subtle">
                {columns.map((column, index) => (
                  <td key={index} className={cn('border-b border-line px-4 py-3 align-middle text-[13.5px]', column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <TableFoot page={page} totalPages={data?.pagination.totalPages ?? 1} total={data?.pagination.total ?? 0} onPageChange={onPageChange} />
    </div>
  );
}

interface TableFootProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

function TableFoot({ page, totalPages, total, onPageChange }: TableFootProps) {
  const lastPage = Math.max(1, totalPages);

  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-muted">
      <span>
        {total} resultado{total === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-2.5">
        <IconButton title="Página anterior" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <Icon name="chevron-left" />
        </IconButton>
        <span>
          Página {page} de {lastPage}
        </span>
        <IconButton title="Página siguiente" onClick={() => onPageChange(page + 1)} disabled={page >= lastPage}>
          <Icon name="chevron-right" />
        </IconButton>
      </div>
    </div>
  );
}
