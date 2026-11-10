const DEV_PASSWORD = 'Vacaciones2026!';

const DEV_ACCOUNTS = [
  { role: 'Superusuario', email: 'sysadmin@grupo-jo.com' },
  { role: 'Usuario', email: 'r.jimenez@thh.com.mx' },
  { role: 'Empleado', email: 'j.perez@jo.com.mx' },
];

export function DevAccounts({ onPick }: { onPick: (email: string, password: string) => void }) {
  return (
    <div className="login-demo-roles">
      <p>Cuentas de prueba — clic para autocompletar:</p>
      <div className="role-pills">
        {DEV_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            className="role-pill"
            onClick={() => onPick(account.email, DEV_PASSWORD)}
          >
            {account.role}
            <span className="pill-sub">{account.email}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
