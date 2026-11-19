import { useState } from 'react';
import type { Employee, EmployeeAccount, Notice, VacationEntitlement } from '@vacations/sdk';
import { sdk } from '../../../services/sdk';
import { config } from '../../../config';
import { getErrorMessage } from '../../../utils/get-error-message';
import { useApiQuery } from '../../../hooks/use-api-query';
import { refreshData } from '../../../services/query-client';
import { formatAbsenceRange, formatDate, initials } from '../../../utils/format';
import { Drawer } from '../../../components/organisms/Drawer';
import { ConfirmDialog } from '../../../components/organisms/Dialog';
import { EmptyState } from '../../../components/atoms/EmptyState';
import { Icon } from '../../../components/atoms/Icon';
import { TextField } from '../../../components/molecules/FormField';
import { StatusBadge } from '../../../components/atoms/StatusBadge';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../contexts/auth-context';
import { AccessDialog, type GrantedAccess } from './AccessDialog';
import { Button } from '../../../components/atoms/Button';
import { KeyValue, KeyValueGrid } from '../../../components/molecules/KeyValue';
import { Avatar } from '../../../components/atoms/Avatar';
import { Divider } from '../../../components/atoms/Divider';
import { ListRow } from '../../../components/molecules/ListRow';
import { ProgressBar } from '../../../components/atoms/ProgressBar';
import { CardTitle } from '../../../components/molecules/Card';

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
    Boolean(data) && can('employees:update') && employee.status === 'active' && (!account || account.role_code === config.roles.employee);

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
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        <div className="mb-[18px] flex items-center gap-3.5">
          <Avatar size="lg">{initials(employee.employee_name)}</Avatar>
          <div>
            <h2 className="text-lg">{employee.employee_name}</h2>
            <p className="text-[12.5px] text-muted">
              {employee.employee_number} · {employee.folio}
            </p>
          </div>
        </div>
        <KeyValueGrid>
          <KeyValue label="Departamento">{departmentName}</KeyValue>
          <KeyValue label="Turno">{shiftName}</KeyValue>
          <KeyValue label="Fecha de ingreso">{formatDate(employee.start_date)}</KeyValue>
          <KeyValue label="Estado"><StatusBadge status={employee.status} /></KeyValue>
          <KeyValue label="Antigüedad">{years} año{years === 1 ? '' : 's'}</KeyValue>
        </KeyValueGrid>
        <Divider />
        <CardTitle className="mb-2.5">
          Acceso al sistema
        </CardTitle>
        {account ? (
          <KeyValueGrid>
            <KeyValue label="Usuario">{account.username}</KeyValue>
            <KeyValue label="Correo">{account.email}</KeyValue>
            <KeyValue label="Contraseña">{account.role_code === config.roles.employee ? passwordState(account) : 'Cuenta administrativa'}</KeyValue>
          </KeyValueGrid>
        ) : canGrant ? (
          <TextField
            id="ep-email"
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="nombre@empresa.com"
            maxLength={120}
            hint="Aún no tiene cuenta. Se creará con una contraseña temporal válida por un mes."
          />
        ) : (
          <p className="text-[12.5px] text-muted">{data ? 'Sin cuenta en el sistema.' : 'Cargando...'}</p>
        )}
        {canGrant && (
          <Button variant="secondary" size="sm" className="mt-2.5" onClick={() => (account ? setConfirming(true) : grant())} disabled={working || (!account && !email.trim())}>
            <Icon name="mail" /> {account ? 'Reenviar acceso' : 'Crear acceso'}
          </Button>
        )}
        <Divider />
        <CardTitle className="mb-2.5">
          Saldo de vacaciones{' '}
          {balance ? `${formatDate(balance.period_start)} – ${formatDate(balance.period_end)}` : ''}
        </CardTitle>
        {balance ? (
          <>
            <KeyValueGrid>
              <KeyValue label="Otorgados">{balance.total_days}</KeyValue>
              <KeyValue label="Usados">{balance.used_days}</KeyValue>
              <KeyValue label="Disponibles">{balance.available.days}</KeyValue>
            </KeyValueGrid>
            <ProgressBar percent={balance.total_days ? (balance.used_days / balance.total_days) * 100 : 0} className="mt-2.5" />
          </>
        ) : (
          <p className="text-[12.5px] text-muted">{data ? 'Sin saldo registrado todavía.' : 'Cargando...'}</p>
        )}
        <Divider />
        <CardTitle className="mb-2.5">
          Historial de movimientos
        </CardTitle>
        {data?.history.length ? (
          data.history.map((notice) => (
            <ListRow key={notice.notice_id} title={formatAbsenceRange(notice)} subtitle={notice.reason_description} meta={<StatusBadge status={notice.status} />} />
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
