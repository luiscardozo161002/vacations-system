import { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../../../utils/cn';
import { formatCode } from '../../../utils/format';
import { control } from '../../../components/atoms/control';
import { Icon } from '../../../components/atoms/Icon';
import { useBranches } from '../../branches/hooks/useBranches';
import { useCompanies } from '../../companies/hooks/useCompanies';
import { useDepartments } from '../../departments/hooks/useDepartments';
import { branchColor, departmentColor } from '../colors';
import type { OrgFilterValues } from '../org-filters';

interface OrgFiltersProps {
  filters: OrgFilterValues;
  setFilter: (changes: Partial<OrgFilterValues>) => void;
  idPrefix: string;
}

interface NodeProps {
  level: 1 | 2 | 3;
  label: string;
  color: string | null;
  selected: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onSelect: () => void;
}

const INDENT = { 1: 'pl-1', 2: 'pl-6', 3: 'pl-11' };

function Node({ level, label, color, selected, expanded, onToggle, onSelect }: NodeProps) {
  return (
    <div role="treeitem" aria-level={level} aria-selected={selected} aria-expanded={onToggle ? expanded : undefined} className={cn('flex items-center gap-1', INDENT[level])}>
      {onToggle ? (
        <button
          type="button"
          aria-label={`${expanded ? 'Contraer' : 'Expandir'} ${label}`}
          onClick={onToggle}
          className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-subtle hover:text-fg"
        >
          <Icon name={expanded ? 'chevron-down' : 'chevron-right'} />
        </button>
      ) : (
        <span className="size-6 shrink-0" />
      )}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-subtle',
          selected && 'bg-subtle font-semibold',
        )}
      >
        <span className="size-2 shrink-0 rounded-full border border-line" style={{ background: color ?? 'transparent' }} />
        <span className="truncate">{label}</span>
        {selected && <Icon name="check" />}
      </button>
    </div>
  );
}

export function OrgFilters({ filters, setFilter, idPrefix }: OrgFiltersProps) {
  const { companies } = useCompanies();
  const { branches } = useBranches();
  const { departments } = useDepartments();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const company = companies.find((item) => String(item.company_id) === filters.empresa);
  const branch = branches.find((item) => String(item.branch_id) === filters.sede);
  const department = departments.find((item) => String(item.department_id) === filters.departamento);

  const label = department
    ? `${department.department_name} · ${formatCode(department.branch_code ?? '')}`
    : branch
      ? `${formatCode(branch.code)} · ${branch.branch_name}`
      : (company?.company_name ?? 'Empresa, sede y departamento');
  const active = Boolean(company || branch || department);

  const changeOpen = (opening: boolean) => {
    if (opening) {
      const path = new Set<string>();
      if (filters.empresa) path.add(`c:${filters.empresa}`);
      if (filters.sede) path.add(`b:${filters.sede}`);
      setExpanded(path);
    }
    setOpen(opening);
  };

  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const pick = (changes: OrgFilterValues) => {
    setFilter(changes);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={`${idPrefix}-org-filter`}
          type="button"
          aria-label="Empresa, sede y departamento"
          className={cn(control, 'flex h-9 w-72 max-w-full cursor-pointer items-center gap-2 px-2.5 text-left', !active && 'text-muted')}
        >
          <Icon name="building-2" />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <Icon name="chevron-down" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] max-h-[var(--radix-popover-content-available-height)] w-80 overflow-y-auto rounded-md border border-line bg-surface p-2 shadow-md focus:outline-none"
        >
          <div role="tree" aria-label="Empresas, sedes y departamentos">
            <button
              type="button"
              onClick={() => pick({ empresa: '', sede: '', departamento: '' })}
              className={cn(
                'mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-subtle',
                !active && 'bg-subtle font-semibold',
              )}
            >
              Todas las empresas
              {!active && <Icon name="check" />}
            </button>
            {companies.map((item) => {
              const companyKey = `c:${item.company_id}`;
              const companyBranches = branches.filter((entry) => entry.company_id === item.company_id);
              return (
                <div key={item.company_id}>
                  <Node
                    level={1}
                    label={item.company_name}
                    color={item.color}
                    selected={filters.empresa === String(item.company_id) && !filters.sede}
                    expanded={expanded.has(companyKey)}
                    onToggle={companyBranches.length ? () => toggle(companyKey) : undefined}
                    onSelect={() => pick({ empresa: String(item.company_id), sede: '', departamento: '' })}
                  />
                  {expanded.has(companyKey) &&
                    companyBranches.map((entry) => {
                      const branchKey = `b:${entry.branch_id}`;
                      const branchDepartments = departments.filter((candidate) => candidate.branch_id === entry.branch_id);
                      return (
                        <div key={entry.branch_id}>
                          <Node
                            level={2}
                            label={`${formatCode(entry.code)} · ${entry.branch_name}`}
                            color={branchColor(entry)}
                            selected={filters.sede === String(entry.branch_id) && !filters.departamento}
                            expanded={expanded.has(branchKey)}
                            onToggle={branchDepartments.length ? () => toggle(branchKey) : undefined}
                            onSelect={() =>
                              pick({ empresa: String(entry.company_id), sede: String(entry.branch_id), departamento: '' })
                            }
                          />
                          {expanded.has(branchKey) &&
                            branchDepartments.map((candidate) => (
                              <Node
                                key={candidate.department_id}
                                level={3}
                                label={candidate.department_name}
                                color={departmentColor(candidate)}
                                selected={filters.departamento === String(candidate.department_id)}
                                onSelect={() =>
                                  pick({
                                    empresa: String(entry.company_id),
                                    sede: String(entry.branch_id),
                                    departamento: String(candidate.department_id),
                                  })
                                }
                              />
                            ))}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
