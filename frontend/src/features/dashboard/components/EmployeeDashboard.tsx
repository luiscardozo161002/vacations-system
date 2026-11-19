import { useNavigate } from 'react-router';
import { sdk } from '../../../api/sdk';
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

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const { data: summary, error } = useApiQuery(['dashboard', 'me'], (signal) => sdk.dashboard.me({ signal }));

  if (error) return <EmptyState message={error} />;
  if (!summary) return <EmptyState message="Cargando..." />;

  const { profile, balance, requests, notices } = summary;
  const usedShare = balance && balance.total_days ? (balance.used_days / balance.total_days) * 100 : 0;

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

      <Card style={{ marginBottom: 16 }}>
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
        <Card style={{ marginBottom: 16 }}>
          <CardHeader>
            <CardTitle>
              Mis días de vacaciones — periodo {formatDate(balance.period_start)} – {formatDate(balance.period_end)}
            </CardTitle>
          </CardHeader>
          <KeyValueGrid className="mb-3">
            <KeyValue label="Otorgados">{balance.total_days} días</KeyValue>
            <KeyValue label="Usados">{balance.used_days} días</KeyValue>
            <KeyValue label="Disponibles">{balance.available.days} días</KeyValue>
          </KeyValueGrid>
          <div className="progress-track" style={{ marginBottom: 16 }}>
            <div className="progress-fill" style={{ width: `${usedShare}%` }} />
          </div>
          <Divider />
          <CardTitle style={{ margin: '14px 0 10px' }}>
            Horas de permisos (dentro del día en curso)
          </CardTitle>
          <p className="cell-sub" style={{ marginBottom: 10 }}>
            Tu turno equivale a {balance.daily_hours}h al día. Las horas de permiso ya tomadas se descuentan de ese día antes de
            consumir un día completo.
          </p>
          <KeyValueGrid>
            <KeyValue label="Horas usadas">{balance.used_hours} h</KeyValue>
            <KeyValue label="Horas restantes hoy">{balance.available.hours} h</KeyValue>
          </KeyValueGrid>
        </Card>
      )}

      <div className="grid grid-2">
        <Card>
          <CardHeader>
            <CardTitle>Mis solicitudes</CardTitle>
          </CardHeader>
          {requests.length ? (
            requests.map((request) => (
              <div key={request.notice_id} className="list-row">
                <div className="info">
                  <div className="name">
                    {formatAbsenceRange(request)} · {formatDaysHours(request.days_taken, request.hours_taken)}
                  </div>
                  <div className="sub">
                    {request.reason_description}
                    {request.remarks ? ` — ${request.remarks}` : ''}
                  </div>
                </div>
                <div className="meta">
                  <StatusBadge status={request.status} />
                </div>
              </div>
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
              <div key={notice.notice_id} className="list-row">
                <div className="info">
                  <div className="name">{notice.reason_description}</div>
                  <div className="sub">
                    {formatAbsenceRange(notice)}
                    {notice.remarks ? ` — ${notice.remarks}` : ''}
                  </div>
                </div>
                <div className="meta">
                  <StatusBadge status={notice.status} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState message="Aún no tienes avisos." />
          )}
        </Card>
      </div>
    </>
  );
}
