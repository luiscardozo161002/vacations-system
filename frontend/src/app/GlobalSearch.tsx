import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Employee } from '@vacations/sdk';
import { sdk } from '../api/sdk';
import { useApiQuery } from '../hooks/use-api-query';
import { Icon } from '../components/atoms/Icon';
import { DropdownEmpty, DropdownItem, DropdownPanel } from '../components/molecules/DropdownPanel';
import { useDepartments } from '../features/departments/hooks/useDepartments';

const RESULT_LIMIT = 6;
const DEBOUNCE_MS = 250;

export function GlobalSearch() {
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const { departments } = useDepartments();

  const departmentNames = useMemo(
    () => new Map(departments.map((department) => [department.department_id, department.department_name])),
    [departments],
  );

  const text = query.trim();

  useEffect(() => {
    const timer = setTimeout(() => setTerm(text), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const search = useApiQuery(
    ['employees', 'search', term],
    (signal) => sdk.employees.list({ search: term, sort: 'employee_name', pageSize: RESULT_LIMIT }, { signal }),
    Boolean(term),
  );
  const results: Employee[] | null = term === text && search.data ? search.data.data : null;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', closeOnOutsideClick);
    return () => document.removeEventListener('click', closeOnOutsideClick);
  }, [open]);

  const change = (value: string) => {
    setQuery(value);
    setOpen(Boolean(value.trim()));
  };

  const pick = (employee: Employee) => {
    setOpen(false);
    setQuery('');
    navigate(`/empleados?perfil=${employee.employee_id}`);
  };

  return (
    <div
      id="global-search-wrap"
      ref={wrapRef}
      className="relative hidden h-9 w-[380px] items-center gap-2 rounded-sm border border-line bg-subtle px-2.5 text-muted focus-within:border-fg focus-within:shadow-[0_0_0_3px_rgba(15,23,42,0.08)] wide:flex"
    >
      <Icon name="search" />
      <input
        className="flex-1 border-none bg-transparent text-fg outline-none"
        type="text"
        id="global-search-input"
        aria-label="Buscar empleados"
        placeholder="Buscar empleados por nombre o número..."
        autoComplete="off"
        value={query}
        onChange={(e) => change(e.target.value)}
        onFocus={() => setOpen(Boolean(text))}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && results?.[0]) pick(results[0]);
        }}
      />
      <DropdownPanel id="global-search-dropdown" className="w-full" hidden={!open}>
        {results === null ? (
          <DropdownEmpty>Buscando...</DropdownEmpty>
        ) : results.length ? (
          results.map((employee) => (
            <DropdownItem
              key={employee.employee_id}
              title={employee.employee_name}
              subtitle={`${departmentNames.get(employee.department_id) ?? ''} · ${employee.employee_number}`}
              onClick={() => pick(employee)}
            />
          ))
        ) : (
          <DropdownEmpty>Sin resultados para "{text}".</DropdownEmpty>
        )}
      </DropdownPanel>
    </div>
  );
}
