const DEV_PASSWORD = 'Vacaciones2026!';

const DEV_ACCOUNTS = [
  { role: 'Superusuario', email: 'sysadmin@grupo-jo.com' },
  { role: 'Usuario', email: 'r.jimenez@thh.com.mx' },
  { role: 'Empleado', email: 'j.perez@jo.com.mx' },
];

export function DevAccounts({ onPick }: { onPick: (email: string, password: string) => void }) {
  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="mb-2 text-xs text-muted">Cuentas de prueba — clic para autocompletar:</p>
      <div className="flex flex-wrap gap-1.5">
        {DEV_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            className="cursor-pointer rounded-full border border-line bg-subtle px-3 py-1.5 text-xs text-fg hover:border-fg"
            onClick={() => onPick(account.email, DEV_PASSWORD)}
          >
            {account.role}
            <span className="mt-px block text-[10.5px] text-muted">{account.email}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
