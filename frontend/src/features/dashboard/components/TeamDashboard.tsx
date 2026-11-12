import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { TeamSummary } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { formatDate, formatDateTime, initials } from '../../../lib/format';
import { EmptyState } from '../../../components/EmptyState';
import { Icon } from '../../../components/Icon';
import { StatCard } from '../../../components/StatCard';

const ACTIVITY_LABELS = {
  request: { pending: 'Solicitud pendiente', approved: 'Solicitud aprobada', rejected: 'Solicitud rechazada', cancelled: 'Solicitud cancelada' },
  notice: { pending: 'Aviso pendiente', approved: 'Aviso aprobado', rejected: 'Aviso rechazado', cancelled: 'Aviso cancelado' },
};

interface TeamDashboardProps {
  firstName: string;
  allBranches: boolean;
}

export function TeamDashboard({ firstName, allBranches }: TeamDashboardProps) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    sdk.dashboard
      .summary({ signal: controller.signal })
      .then(setSummary)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(err));
      });
    return () => controller.abort();
  }, []);

  const departments = summary?.by_department ?? [];
  const maxCount = Math.max(...departments.map((department) => department.active_employees), 1);
  const repeatedNames = new Set(departments.map((department) => department.department_name)).size < departments.length;
  const absentShare = summary?.active_employees ? ((summary.absent_today / summary.active_employees) * 100).toFixed(1) : '0';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Buenos días, {firstName}</h1>
          <p className="page-sub">Este es el panorama de tu equipo hoy.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/calendario')}>
            <Icon name="calendar" /> Ver quién falta
          </button>
        </div>
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard icon="users" label="Empleados activos" value={summary?.active_employees ?? '—'} delta={allBranches ? 'En todas las sedes' : 'En tus sedes'} />
        <StatCard icon="bell-ring" label="Ausentes hoy" value={summary?.absent_today ?? '—'} delta={`${absentShare}% del equipo`} />
        <StatCard
          icon="inbox"
          label="Solicitudes pendientes"
          value={summary?.pending_requests ?? '—'}
          delta={`${summary?.pending_requests ?? 0} requieren atención`}
        />
        <StatCard
          icon="pie-chart"
          label="Próximas vacaciones"
          value={summary?.upcoming_vacations ?? '—'}
          delta="En los próximos 30 días"
        />
      </div>

      <div className="grid grid-3">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-head">
            <h3 className="section-title">Próximas ausencias</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/calendario')}>
              Ver calendario <Icon name="arrow-right" />
            </button>
          </div>
          {summary?.upcoming_absences.length ? (
            summary.upcoming_absences.map((absence) => (
              <div key={absence.notice_id} className="list-row">
                <div className="avatar">{initials(absence.employee_name)}</div>
                <div className="info">
                  <div className="name">{absence.employee_name}</div>
                  <div className="sub">{absence.department_name}</div>
                </div>
                <div className="meta">
                  <strong>
                    {formatDate(absence.absence_start_date)} – {formatDate(absence.absence_end_date)}
                  </strong>
                  {absence.days_taken} día{absence.days_taken === 1 ? '' : 's'}
                </div>
              </div>
            ))
          ) : (
            <EmptyState message={summary ? 'No hay ausencias próximas.' : 'Cargando...'} />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="section-title">Por departamento</h3>
          </div>
          {departments.map((department) => (
            <div key={department.department_id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span>
                  {department.department_name}
                  {repeatedNames && <span className="cell-sub"> · {department.branch_code}</span>}
                </span>
                <span className="cell-sub">{department.active_employees}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(department.active_employees / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 12 }}>
          Actividad reciente
        </h3>
        {summary?.recent_activity.length ? (
          summary.recent_activity.map((activity) => (
            <div key={activity.notice_id} className="list-row">
              <div className="avatar">{initials(activity.employee_name)}</div>
              <div className="info">
                <div className="name">
                  {ACTIVITY_LABELS[activity.kind][activity.status]} · {activity.reason_description}
                </div>
                <div className="sub">{activity.employee_name}</div>
              </div>
              <div className="meta">{formatDateTime(activity.happened_at)}</div>
            </div>
          ))
        ) : (
          <EmptyState message={summary ? 'Sin actividad reciente.' : 'Cargando...'} />
        )}
      </div>
    </>
  );
}
