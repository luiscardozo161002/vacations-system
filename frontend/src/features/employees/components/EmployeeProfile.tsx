import { useState } from 'react';
import type { Employee, EmployeeAccount, Notice, VacationEntitlement } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { useApiQuery } from '../../../lib/use-api-query';
import { refreshData } from '../../../lib/query-client';
import { formatAbsenceRange, formatDate, initials } from '../../../lib/format';
import { Drawer } from '../../../components/Drawer';
import { ConfirmDialog } from '../../../components/Dialog';
import { EmptyState } from '../../../components/EmptyState';
import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/toast-context';
import { useAuth } from '../../auth/auth-context';
import { AccessDialog, type GrantedAccess } from './AccessDialog';

interface EmployeeProfileProps {
  employee: Employee;
  departmentName: string;
  shiftName: string;
  onClose: () => void;
}

interface ProfileData {
  account: EmployeeAccount | null;
  balance: VacationEntitlement | null;
  history: Notice[];
}

const passwordState = (account: EmployeeAccount): string => {
  if (!account.must_change_password) return 'Definida por el empleado';
  const expires = account.temporary_password_expires_at ?? '';
  return new Date(expires) < new Date() ? 'Temporal vencida' : `Temporal, vence ${formatDate(expires)}`;
};

const HISTORY_SIZE = 20;

const EMPTY_PROFILE: ProfileData = { account: null, balance: null, history: [] };

const loadProfile = async (employeeId: number, signal: AbortSignal): Promise<ProfileData> => {
  const options = { signal };
  const [detail, balances, notices] = await Promise.all([
    sdk.employees.get(employeeId, options),
    sdk.vacationEntitlements.list({ employee_id: employeeId, status: 'active', sort: '-period_start', pageSize: 1 }, options),
    sdk.notices.list({ employee_id: employeeId, sort: '-request_date', pageSize: HISTORY_SIZE }, options),
  ]);
  return { account: detail.account ?? null, balance: balances.data[0] ?? null, history: notices.data };
};

const yearsSince = (isoDate: string): number => {
  const start = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  const today = new Date();
  const anniversaryPassed =
    today.getMonth() > start.getMonth() || (today.getMonth() === start.getMonth() && today.getDate() >= start.getDate());
  return today.getFullYear() - start.getFullYear() - (anniversaryPassed ? 0 : 1);
};

export function EmployeeProfile({ employee, departmentName, shiftName, onClose }: EmployeeProfileProps) {
  const { can } = useAuth();
  const showToast = useToast();
  const profile = useApiQuery(['employees', 'profile', employee.employee_id], (signal) =>
    loadProfile(employee.employee_id, signal),
  );
  const data = profile.data ?? (profile.error ? EMPTY_PROFILE : null);
  const [email, setEmail] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [granted, setGranted] = useState<GrantedAccess | null>(null);

  const years = yearsSince(employee.start_date);
  const balance = data?.balance;
  const account = data?.account ?? null;
  const canGrant =
    Boolean(data) && can('employees:update') && employee.status === 'active' && (!account || account.role_code === 'EMPLOYEE');

  const grant = async () => {
    setConfirming(false);
    setWorking(true);
    try {
      const result = await sdk.employees.grantAccess(employee.employee_id, account ? undefined : email.trim());
      refreshData();
      setGranted({ ...result, employee_name: employee.employee_name });
      setEmail('');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <Drawer
        title="Perfil del empleado"
        onClose={onClose}
        footer={
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        }
      >
        <div className="profile-head">
          <div className="avatar">{initials(employee.employee_name)}</div>
          <div>
            <h2 style={{ fontSize: 16 }}>{employee.employee_name}</h2>
            <p className="cell-sub">
              {employee.employee_number} · {employee.folio}
            </p>
          </div>
        </div>
        <div className="kv-grid">
          <div className="kv-item">
            <div className="k">Departamento</div>
            <div className="v">{departmentName}</div>
          </div>
          <div className="kv-item">
            <div className="k">Turno</div>
            <div className="v">{shiftName}</div>
          </div>
          <div className="kv-item">
            <div className="k">Fecha de ingreso</div>
            <div className="v">{formatDate(employee.start_date)}</div>
          </div>
          <div className="kv-item">
            <div className="k">Estado</div>
            <div className="v">
              <StatusBadge status={employee.status} />
            </div>
          </div>
          <div className="kv-item">
            <div className="k">Antigüedad</div>
            <div className="v">
              {years} año{years === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <div className="divider" />
        <h3 className="section-title" style={{ marginBottom: 10 }}>
          Acceso al sistema
        </h3>
        {account ? (
          <div className="kv-grid">
            <div className="kv-item">
              <div className="k">Usuario</div>
              <div className="v">{account.username}</div>
            </div>
            <div className="kv-item">
              <div className="k">Correo</div>
              <div className="v">{account.email}</div>
            </div>
            <div className="kv-item">
              <div className="k">Contraseña</div>
              <div className="v">{account.role_code === 'EMPLOYEE' ? passwordState(account) : 'Cuenta administrativa'}</div>
            </div>
          </div>
        ) : canGrant ? (
          <div className="field">
            <label htmlFor="ep-email">Correo electrónico</label>
            <input
              id="ep-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              maxLength={120}
            />
            <p className="field-hint">Aún no tiene cuenta. Se creará con una contraseña temporal válida por un mes.</p>
          </div>
        ) : (
          <p className="cell-sub">{data ? 'Sin cuenta en el sistema.' : 'Cargando...'}</p>
        )}
        {canGrant && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 10 }}
            onClick={() => (account ? setConfirming(true) : grant())}
            disabled={working || (!account && !email.trim())}
          >
            <Icon name="mail" /> {account ? 'Reenviar acceso' : 'Crear acceso'}
          </button>
        )}
        <div className="divider" />
        <h3 className="section-title" style={{ marginBottom: 10 }}>
          Saldo de vacaciones{' '}
          {balance ? `${formatDate(balance.period_start)} – ${formatDate(balance.period_end)}` : ''}
        </h3>
        {balance ? (
          <>
            <div className="kv-grid">
              <div className="kv-item">
                <div className="k">Otorgados</div>
                <div className="v">{balance.total_days}</div>
              </div>
              <div className="kv-item">
                <div className="k">Usados</div>
                <div className="v">{balance.used_days}</div>
              </div>
              <div className="kv-item">
                <div className="k">Disponibles</div>
                <div className="v">{balance.available.days}</div>
              </div>
            </div>
            <div className="progress-track" style={{ marginTop: 10 }}>
              <div
                className="progress-fill"
                style={{ width: `${balance.total_days ? (balance.used_days / balance.total_days) * 100 : 0}%` }}
              />
            </div>
          </>
        ) : (
          <p className="cell-sub">{data ? 'Sin saldo registrado todavía.' : 'Cargando...'}</p>
        )}
        <div className="divider" />
        <h3 className="section-title" style={{ marginBottom: 10 }}>
          Historial de movimientos
        </h3>
        {data?.history.length ? (
          data.history.map((notice) => (
            <div key={notice.notice_id} className="list-row">
              <div className="info">
                <div className="name">{formatAbsenceRange(notice)}</div>
                <div className="sub">{notice.reason_description}</div>
              </div>
              <div className="meta">
                <StatusBadge status={notice.status} />
              </div>
            </div>
          ))
        ) : (
          <EmptyState message={data ? 'Sin movimientos registrados.' : 'Cargando...'} />
        )}
      </Drawer>

      {confirming && (
        <ConfirmDialog
          title="Reenviar acceso"
          message={
            <>
              ¿Generar una nueva contraseña temporal para <strong>{employee.employee_name}</strong>? La actual dejará de
              funcionar.
            </>
          }
          confirmLabel="Reenviar"
          onConfirm={grant}
          onCancel={() => setConfirming(false)}
        />
      )}

      {granted && <AccessDialog access={granted} onClose={() => setGranted(null)} />}
    </>
  );
}
