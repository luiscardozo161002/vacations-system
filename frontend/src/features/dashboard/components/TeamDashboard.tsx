import { useNavigate } from 'react-router';
import { sdk } from '../../../services/sdk';
import { useApiQuery } from '../../../hooks/use-api-query';
import { formatDate, formatDateTime, initials } from '../../../utils/format';
import { EmptyState } from '../../../components/atoms/EmptyState';
import { Icon } from '../../../components/atoms/Icon';
import { PageHeader } from '../../../components/molecules/PageHeader';
import { StatCard } from '../../../components/molecules/StatCard';
import { Button } from '../../../components/atoms/Button';
import { Card, CardHeader, CardTitle } from '../../../components/molecules/Card';
import { Avatar } from '../../../components/atoms/Avatar';
import { FieldError } from '../../../components/atoms/FieldText';
import { Grid } from '../../../components/molecules/Grid';
import { ListRow } from '../../../components/molecules/ListRow';
import { ProgressBar } from '../../../components/atoms/ProgressBar';

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

      {error && <FieldError>{error}</FieldError>}

      <Grid cols={4} className="mb-4">
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
      </Grid>

      <Grid cols={3}>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Próximas ausencias</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/calendario')}>
              Ver calendario <Icon name="arrow-right" />
            </Button>
          </CardHeader>
          {summary?.upcoming_absences.length ? (
            summary.upcoming_absences.map((absence) => (
              <ListRow
                key={absence.notice_id}
                leading={<Avatar>{initials(absence.employee_name)}</Avatar>}
                title={absence.employee_name}
                subtitle={absence.department_name}
                meta={
                  <>
                    <strong>
                      {formatDate(absence.absence_start_date)} – {formatDate(absence.absence_end_date)}
                    </strong>
                    {absence.days_taken} día{absence.days_taken === 1 ? '' : 's'}
                  </>
                }
              />
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
            <div key={department.department_id} className="mb-3">
              <div className="mb-1.5 flex justify-between text-[12.5px]">
                <span>
                  {department.department_name}
                  {repeatedNames && <span className="text-[12.5px] text-muted"> · {department.branch_code}</span>}
                </span>
                <span className="text-[12.5px] text-muted">{department.active_employees}</span>
              </div>
              <ProgressBar percent={(department.active_employees / maxCount) * 100} />
            </div>
          ))}
        </Card>
      </Grid>

      <Card className="mt-4">
        <CardTitle className="mb-3">Actividad reciente</CardTitle>
        {summary?.recent_activity.length ? (
          summary.recent_activity.map((activity) => (
            <ListRow
              key={activity.notice_id}
              leading={<Avatar>{initials(activity.employee_name)}</Avatar>}
              title={`${ACTIVITY_LABELS[activity.kind][activity.status]} · ${activity.reason_description}`}
              subtitle={activity.employee_name}
              meta={formatDateTime(activity.happened_at)}
            />
          ))
        ) : (
          <EmptyState message={summary ? 'Sin actividad reciente.' : 'Cargando...'} />
        )}
      </Card>
    </>
  );
}
