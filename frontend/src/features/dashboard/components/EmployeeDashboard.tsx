import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { MySummary } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { formatAbsenceRange, formatDate, formatDaysHours } from '../../../lib/format';
import { EmptyState } from '../../../components/EmptyState';
import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';

export function EmployeeDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<MySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    sdk.dashboard
      .me({ signal: controller.signal })
      .then(setSummary)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(err));
      });
    return () => controller.abort();
  }, []);

  if (error) return <EmptyState message={error} />;
  if (!summary) return <EmptyState message="Cargando..." />;

  const { profile, balance, requests, notices } = summary;
  const usedShare = balance && balance.total_days ? (balance.used_days / balance.total_days) * 100 : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Hola, {profile.employee_name.split(' ')[0]}</h1>
          <p className="page-sub">
            {profile.department_name} · {profile.shift_name}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/solicitudes')}>
            <Icon name="plus" /> Nueva solicitud
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3 className="section-title">Mi perfil</h3>
        </div>
        <div className="kv-grid">
          <div className="kv-item">
            <div className="k">Departamento</div>
            <div className="v">{profile.department_name}</div>
          </div>
          <div className="kv-item">
            <div className="k">Turno</div>
            <div className="v">{profile.shift_name}</div>
          </div>
          <div className="kv-item">
            <div className="k">Fecha de ingreso</div>
            <div className="v">{formatDate(profile.start_date)}</div>
          </div>
          <div className="kv-item">
            <div className="k">Antigüedad</div>
            <div className="v">
              {profile.years_of_service} año{profile.years_of_service === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      {balance && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head">
            <h3 className="section-title">
              Mis días de vacaciones — periodo {formatDate(balance.period_start)} – {formatDate(balance.period_end)}
            </h3>
          </div>
          <div className="kv-grid" style={{ marginBottom: 12 }}>
            <div className="kv-item">
              <div className="k">Otorgados</div>
              <div className="v">{balance.total_days} días</div>
            </div>
            <div className="kv-item">
              <div className="k">Usados</div>
              <div className="v">{balance.used_days} días</div>
            </div>
            <div className="kv-item">
              <div className="k">Disponibles</div>
              <div className="v">{balance.available.days} días</div>
            </div>
          </div>
          <div className="progress-track" style={{ marginBottom: 16 }}>
            <div className="progress-fill" style={{ width: `${usedShare}%` }} />
          </div>
          <div className="divider" />
          <h3 className="section-title" style={{ margin: '14px 0 10px' }}>
            Horas de permisos (dentro del día en curso)
          </h3>
          <p className="cell-sub" style={{ marginBottom: 10 }}>
            Tu turno equivale a {balance.daily_hours}h al día. Las horas de permiso ya tomadas se descuentan de ese día antes de
            consumir un día completo.
          </p>
          <div className="kv-grid">
            <div className="kv-item">
              <div className="k">Horas usadas</div>
              <div className="v">{balance.used_hours} h</div>
            </div>
            <div className="kv-item">
              <div className="k">Horas restantes hoy</div>
              <div className="v">{balance.available.hours} h</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h3 className="section-title">Mis solicitudes</h3>
          </div>
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
        </div>
        <div className="card">
          <div className="card-head">
            <h3 className="section-title">Mis avisos</h3>
          </div>
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
        </div>
      </div>
    </>
  );
}
