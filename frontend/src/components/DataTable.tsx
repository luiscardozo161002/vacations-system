import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { Icon } from './Icon';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface TablePagination {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyMessage: string;
  pagination?: TablePagination;
}

export function DataTable<T>({ columns, rows, rowKey, loading = false, emptyMessage, pagination }: DataTableProps<T>) {
  const showEmpty = loading || rows.length === 0;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {showEmpty ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState message={loading ? 'Cargando...' : emptyMessage} />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column, index) => (
                  <td key={index} className={column.className}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination && <TableFoot {...pagination} />}
    </div>
  );
}

function TableFoot({ page, totalPages, total, onPageChange }: TablePagination) {
  const lastPage = Math.max(1, totalPages);

  return (
    <div className="table-foot">
      <span>
        {total} resultado{total === 1 ? '' : 's'}
      </span>
      <div className="pagination">
        <button
          type="button"
          className="icon-btn"
          title="Página anterior"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <Icon name="chevron-left" />
        </button>
        <span>
          Página {page} de {lastPage}
        </span>
        <button
          type="button"
          className="icon-btn"
          title="Página siguiente"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
        >
          <Icon name="chevron-right" />
        </button>
      </div>
    </div>
  );
}
