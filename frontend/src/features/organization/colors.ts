export const ORG_COLORS = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#9333ea',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#475569',
  '#ea580c',
];

export const branchColor = (branch: { color: string | null; company_color: string | null }) => branch.color ?? branch.company_color;

export const departmentColor = (department: { branch_color: string | null; company_color: string | null }) =>
  department.branch_color ?? department.company_color;
