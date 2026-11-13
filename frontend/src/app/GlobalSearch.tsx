import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Employee } from '@vacations/sdk';
import { sdk } from '../lib/sdk';
import { Icon } from '../components/Icon';
import { useDepartments } from '../features/departments/hooks/useDepartments';

const RESULT_LIMIT = 6;
const DEBOUNCE_MS = 250;

export function GlobalSearch() {
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Employee[] | null>(null);
  const [open, setOpen] = useState(false);
  const { departments } = useDepartments();

  const departmentNames = useMemo(
    () => new Map(departments.map((department) => [department.department_id, department.department_name])),
    [departments],
  );

  const text = query.trim();

  useEffect(() => {
    if (!text) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      sdk.employees
        .list({ search: text, sort: 'employee_name', pageSize: RESULT_LIMIT }, { signal: controller.signal })
        .then((page) => setResults(page.data))
        .catch(() => undefined);
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

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
    setResults(null);
    setOpen(Boolean(value.trim()));
  };

  const pick = (employee: Employee) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    navigate(`/empleados?perfil=${employee.employee_id}`);
  };

  return (
    <div className="search-box" id="global-search-wrap" style={{ position: 'relative' }} ref={wrapRef}>
      <Icon name="search" />
      <input
        type="text"
        id="global-search-input"
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
      <div className="notif-dropdown" id="global-search-dropdown" style={{ width: '100%' }} hidden={!open}>
        {results === null ? (
          <div className="notif-empty">Buscando...</div>
        ) : results.length ? (
          results.map((employee) => (
            <div key={employee.employee_id} className="notif-item" onClick={() => pick(employee)}>
              <span className="dot" />
              <div className="notif-text">
                {employee.employee_name}
                <div className="sub">
                  {departmentNames.get(employee.department_id) ?? ''} · {employee.employee_number}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="notif-empty">Sin resultados para "{text}".</div>
        )}
      </div>
    </div>
  );
}
