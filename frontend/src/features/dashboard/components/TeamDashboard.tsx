import { useNavigate } from 'react-router';
import { sdk } from '../../../api/sdk';
import { useApiQuery } from '../../../hooks/use-api-query';
import { formatDate, formatDateTime, initials } from '../../../utils/format';
import { EmptyState } from '../../../components/atoms/EmptyState';
import { Icon } from '../../../components/atoms/Icon';
import { PageHeader } from '../../../components/molecules/PageHeader';
import { StatCard } from '../../../components/molecules/StatCard';
import { Button } from '../../../components/atoms/Button';
import { Card, CardHeader, CardTitle } from '../../../components/molecules/Card';
import { Avatar } from '../../../components/atoms/Avatar';

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
  const { data: summary, error } = useApiQuery(['dashboard', 'team'], (signal) => sdk.dashboard.summary({ signal }));

  const departments = summary?.by_department ?? [];
  const maxCount = Math.max(...departments.map((department) => department.active_employees), 1);
  const repeatedNames = new Set(departments.map((department) => department.department_name)).size < departments.length;
  const absentShare = summary?.active_employees ? ((summary.absent_today / summary.active_employees) * 100).toFixed(1) : '0';

  return (
    <>
      <PageHeader title={`Buenos días, ${firstName}`} subtitle="Este es el panorama de tu equipo hoy.">
        <Button variant="secondary" onClick={() => navigate('/calendario')}>
          <Icon name="calendar" /> Ver quién falta
        </Button>
      </PageHeader>

      {error && <p className="field-error" role="alert">{error}</p>}

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
        <Card style={{ gridColumn: 'span 2' }}>
          <CardHeader>
            <CardTitle>Próximas ausencias</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/calendario')}>
              Ver calendario <Icon name="arrow-right" />
            </Button>
          </CardHeader>
          {summary?.upcoming_absences.length ? (
            summary.upcoming_absences.map((absence) => (
              <div key={absence.notice_id} className="list-row">
                <Avatar>{initials(absence.employee_name)}</Avatar>
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
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por departamento</CardTitle>
          </CardHeader>
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
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <CardTitle style={{ marginBottom: 12 }}>
          Actividad reciente
        </CardTitle>
        {summary?.recent_activity.length ? (
          summary.recent_activity.map((activity) => (
            <div key={activity.notice_id} className="list-row">
              <Avatar>{initials(activity.employee_name)}</Avatar>
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
      </Card>
    </>
  );
}
