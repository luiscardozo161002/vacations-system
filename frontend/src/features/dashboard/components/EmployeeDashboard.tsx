import { useNavigate } from 'react-router';
import { sdk } from '../../../services/sdk';
import { useApiQuery } from '../../../hooks/use-api-query';
import { formatAbsenceRange, formatDate, formatDaysHours } from '../../../utils/format';
import { EmptyState } from '../../../components/atoms/EmptyState';
import { Icon } from '../../../components/atoms/Icon';
import { PageHeader } from '../../../components/molecules/PageHeader';
import { StatusBadge } from '../../../components/atoms/StatusBadge';
import { Button } from '../../../components/atoms/Button';
import { KeyValue, KeyValueGrid } from '../../../components/molecules/KeyValue';
import { Card, CardHeader, CardTitle } from '../../../components/molecules/Card';
import { Divider } from '../../../components/atoms/Divider';
import { Grid } from '../../../components/molecules/Grid';
import { ListRow } from '../../../components/molecules/ListRow';
import { ProgressBar } from '../../../components/atoms/ProgressBar';

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const { data: summary, error } = useApiQuery(['dashboard', 'me'], (signal) => sdk.dashboard.me({ signal }));

  if (error) return <EmptyState message={error} />;
  if (!summary) return <EmptyState message="Cargando..." />;

  const { profile, balance, requests, notices } = summary;
  const usedShare =
    balance && balance.total_days ? ((balance.used_days + balance.used_hours / balance.daily_hours) / balance.total_days) * 100 : 0;

  return (
    <>
      <PageHeader
        title={`Hola, ${profile.employee_name.split(' ')[0]}`}
        subtitle={`${profile.department_name} · ${profile.shift_name}`}
      >
        <Button onClick={() => navigate('/solicitudes')}>
          <Icon name="plus" /> Nueva solicitud
        </Button>
      </PageHeader>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
        </CardHeader>
        <KeyValueGrid>
          <KeyValue label="Departamento">{profile.department_name}</KeyValue>
          <KeyValue label="Turno">{profile.shift_name}</KeyValue>
          <KeyValue label="Fecha de ingreso">{formatDate(profile.start_date)}</KeyValue>
          <KeyValue label="Antigüedad">{profile.years_of_service} año{profile.years_of_service === 1 ? '' : 's'}</KeyValue>
        </KeyValueGrid>
      </Card>

      {balance && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>
              Mis días de vacaciones — periodo {formatDate(balance.period_start)} – {formatDate(balance.period_end)}
            </CardTitle>
          </CardHeader>
          <KeyValueGrid className="mb-3">
            <KeyValue label="Otorgados">{balance.total_days} días</KeyValue>
            <KeyValue label="Usados">{formatDaysHours(balance.used_days, balance.used_hours)}</KeyValue>
            <KeyValue label="Disponibles">{formatDaysHours(balance.available.days, balance.available.hours)}</KeyValue>
          </KeyValueGrid>
          <ProgressBar percent={usedShare} className="mb-4" />
          <Divider />
          <CardTitle className="mt-3.5 mb-2.5">Horas de permisos (dentro del día en curso)</CardTitle>
          <p className="mb-2.5 text-[12.5px] text-muted">
            Tu turno equivale a {balance.daily_hours}h al día. Las horas de permiso ya tomadas se descuentan de ese día antes de
            consumir un día completo.
          </p>
          <KeyValueGrid>
            <KeyValue label="Horas usadas">{balance.used_hours} h</KeyValue>
            <KeyValue label="Horas restantes hoy">{balance.available.hours} h</KeyValue>
          </KeyValueGrid>
        </Card>
      )}

      <Grid cols={2}>
        <Card>
          <CardHeader>
            <CardTitle>Mis solicitudes</CardTitle>
          </CardHeader>
          {requests.length ? (
            requests.map((request) => (
              <ListRow
                key={request.notice_id}
                title={`${formatAbsenceRange(request)} · ${formatDaysHours(request.days_taken, request.hours_taken)}`}
                subtitle={`${request.reason_description}${request.remarks ? ` — ${request.remarks}` : ''}`}
                meta={<StatusBadge status={request.status} />}
              />
            ))
          ) : (
            <EmptyState message="Aún no tienes solicitudes." />
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mis avisos</CardTitle>
          </CardHeader>
          {notices.length ? (
            notices.map((notice) => (
              <ListRow
                key={notice.notice_id}
                title={notice.reason_description}
                subtitle={`${formatAbsenceRange(notice)}${notice.remarks ? ` — ${notice.remarks}` : ''}`}
                meta={<StatusBadge status={notice.status} />}
              />
            ))
          ) : (
            <EmptyState message="Aún no tienes avisos." />
          )}
        </Card>
      </Grid>
    </>
  );
}
