import { useState, type FormEvent } from 'react';
import type { DayOfWeek, Shift } from '@vacations/sdk';
import { sdk } from '../../../lib/sdk';
import { getErrorMessage } from '../../../lib/get-error-message';
import { Drawer } from '../../../components/Drawer';
import { Icon } from '../../../components/Icon';
import { DAY_LETTERS, WEEK, toBlocks, toSchedule, type ScheduleBlock } from '../schedule-blocks';

interface ShiftFormProps {
  shift: Shift | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const NEW_BLOCK: ScheduleBlock = { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' };

const validate = (name: string, code: string, blocks: ScheduleBlock[]): string | null => {
  if (!name.trim() || !code.trim()) return 'El nombre y el código del turno son obligatorios.';
  const filled = blocks.filter((block) => block.days.length);
  if (!filled.length) return 'Define al menos un horario con días y hora válidos.';
  if (filled.some((block) => !block.start || !block.end || block.end <= block.start)) {
    return 'La hora de salida debe ser posterior a la de entrada.';
  }
  const days = filled.flatMap((block) => block.days);
  if (new Set(days).size !== days.length) return 'Un día no puede estar en dos horarios.';
  return null;
};

export function ShiftForm({ shift, onClose, onSaved }: ShiftFormProps) {
  const [name, setName] = useState(shift?.shift_name ?? '');
  const [code, setCode] = useState(shift?.code ?? '');
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(() => {
    const current = shift ? toBlocks(shift.schedule) : [];
    return current.length ? current : [NEW_BLOCK];
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const changeBlock = (index: number, change: Partial<ScheduleBlock>) =>
    setBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, ...change } : block)));

  const toggleDay = (index: number, day: DayOfWeek) => {
    const days = blocks[index].days;
    changeBlock(index, { days: days.includes(day) ? days.filter((item) => item !== day) : [...days, day] });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate(name, code, blocks);
    if (problem) {
      setFormError(problem);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const schedule = toSchedule(blocks.filter((block) => block.days.length));
    const data = {
      shift_name: name.trim(),
      code: code.trim(),
      number_days: schedule.filter((day) => day.is_working_day).length,
    };
    try {
      const saved = shift ? await sdk.shifts.update(shift.shift_id, data) : await sdk.shifts.create(data);
      await sdk.shifts.replaceSchedule(saved.shift_id, schedule);
      onSaved(shift ? 'Turno actualizado.' : 'Turno creado.');
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title={shift ? 'Editar turno' : 'Nuevo turno'}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {shift ? 'Guardar cambios' : 'Crear turno'}
          </button>
        </>
      }
    >
      {formError && <p className="field-error">{formError}</p>}

      <div className="field">
        <label htmlFor="s-name">Nombre del turno</label>
        <input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Turno Vespertino" />
      </div>
      <div className="field">
        <label htmlFor="s-code">Código</label>
        <input id="s-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej. VESPERTINO" maxLength={20} />
      </div>
      <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Horario semanal</label>
      <div id="s-blocks">
        {blocks.map((block, index) => (
          <div key={index} className="shift-block">
            <button
              type="button"
              className="icon-btn shift-block-remove"
              title="Quitar horario"
              onClick={() => setBlocks((prev) => prev.filter((_, i) => i !== index))}
            >
              <Icon name="x" />
            </button>
            <div className="weekday-toggle-row">
              {WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`weekday-toggle ${block.days.includes(day) ? 'active' : ''}`}
                  onClick={() => toggleDay(index, day)}
                >
                  {DAY_LETTERS[day]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>Hora entrada</label>
                <input type="time" value={block.start} onChange={(e) => changeBlock(index, { start: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>Hora salida</label>
                <input type="time" value={block.end} onChange={(e) => changeBlock(index, { end: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: 16 }}
        onClick={() => setBlocks((prev) => [...prev, { ...NEW_BLOCK, days: [] }])}
      >
        <Icon name="plus" /> Agregar horario
      </button>
    </Drawer>
  );
}
