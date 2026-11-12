import { useEffect, useState } from 'react';
import type { Employee, Notice, VacationEntitlement } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { formatAbsenceRange, formatDate, initials } from '../../../lib/format';
import { Drawer } from '../../../components/Drawer';
import { EmptyState } from '../../../components/EmptyState';
import { StatusBadge } from '../../../components/StatusBadge';

interface EmployeeProfileProps {
  employee: Employee;
  departmentName: string;
  shiftName: string;
  onClose: () => void;
}

interface ProfileData {
  balance: VacationEntitlement | null;
  history: Notice[];
}

const HISTORY_SIZE = 20;

const yearsSince = (isoDate: string): number => {
  const start = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  const today = new Date();
  const anniversaryPassed =
    today.getMonth() > start.getMonth() || (today.getMonth() === start.getMonth() && today.getDate() >= start.getDate());
  return today.getFullYear() - start.getFullYear() - (anniversaryPassed ? 0 : 1);
};

export function EmployeeProfile({ employee, departmentName, shiftName, onClose }: EmployeeProfileProps) {
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    Promise.all([
      sdk.vacationEntitlements.list(
        { employee_id: employee.employee_id, status: 'active', sort: '-period_start', pageSize: 1 },
        options,
      ),
      sdk.notices.list({ employee_id: employee.employee_id, sort: '-request_date', pageSize: HISTORY_SIZE }, options),
    ])
      .then(([balances, notices]) => setData({ balance: balances.data[0] ?? null, history: notices.data }))
      .catch(() => {
        if (!controller.signal.aborted) setData({ balance: null, history: [] });
      });
    return () => controller.abort();
  }, [employee.employee_id]);

  const years = yearsSince(employee.start_date);
  const balance = data?.balance;

  return (
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
  );
}
