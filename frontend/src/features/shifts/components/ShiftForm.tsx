import { useState } from 'react';
import type { DayOfWeek, Shift } from '@vacations/sdk';
import { sdk } from '../../../services/sdk';
import { useFormSubmit } from '../../../hooks/use-form-submit';
import { FormDrawer } from '../../../components/organisms/FormDrawer';
import { cn } from '../../../utils/cn';
import { FormField, TextField } from '../../../components/molecules/FormField';
import { TimeSelect } from '../../../components/molecules/TimeSelect';
import { Icon } from '../../../components/atoms/Icon';
import { DAY_LETTERS, WEEK, toBlocks, toSchedule, type ScheduleBlock } from '../schedule-blocks';
import { IconButton } from '../../../components/atoms/IconButton';
import { Button } from '../../../components/atoms/Button';

interface ShiftFormProps {
  shift: Shift | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const SCHEDULE_STEP = 15;

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
  const { submitting, error, setError, submit } = useFormSubmit();

  const changeBlock = (index: number, change: Partial<ScheduleBlock>) =>
    setBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, ...change } : block)));

  const toggleDay = (index: number, day: DayOfWeek) => {
    const days = blocks[index].days;
    changeBlock(index, { days: days.includes(day) ? days.filter((item) => item !== day) : [...days, day] });
  };

  const handleSubmit = () => {
    const problem = validate(name, code, blocks);
    if (problem) {
      setError(problem);
      return;
    }

    const schedule = toSchedule(blocks.filter((block) => block.days.length));
    const data = {
      shift_name: name.trim(),
      code: code.trim(),
      number_days: schedule.filter((day) => day.is_working_day).length,
    };
    submit(async () => {
      const saved = shift ? await sdk.shifts.update(shift.shift_id, data) : await sdk.shifts.create(data);
      await sdk.shifts.replaceSchedule(saved.shift_id, schedule);
      onSaved(shift ? 'Turno actualizado.' : 'Turno creado.');
    });
  };

  return (
    <FormDrawer
      title={shift ? 'Editar turno' : 'Nuevo turno'}
      submitLabel={shift ? 'Guardar cambios' : 'Crear turno'}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField id="s-name" label="Nombre del turno" value={name} onChange={setName} placeholder="Ej. Turno Vespertino" />
      <TextField id="s-code" label="Código" value={code} onChange={setCode} placeholder="Ej. VESPERTINO" maxLength={20} />
      <label className="mb-1.5 block text-sm font-medium">Horario semanal</label>
      <div id="s-blocks">
        {blocks.map((block, index) => (
          <div key={index} className="relative mb-2.5 rounded-md border border-line p-3">
            <IconButton title="Quitar horario" onClick={() => setBlocks((prev) => prev.filter((_, i) => i !== index))} className="absolute top-2 right-2 size-7">
              <Icon name="x" />
            </IconButton>
            <div className="mt-0.5 mb-3 flex gap-1.5 pr-8">
              {WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={cn('inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-xs font-semibold text-muted', block.days.includes(day) && 'border-primary bg-primary text-primary-fg')}
                  onClick={() => toggleDay(index, day)}
                >
                  {DAY_LETTERS[day]}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <FormField label="Hora entrada" htmlFor={`s-start-${index}`} className="mb-0 flex-1">
                <TimeSelect id={`s-start-${index}`} step={SCHEDULE_STEP} value={block.start} onChange={(value) => changeBlock(index, { start: value })} />
              </FormField>
              <FormField label="Hora salida" htmlFor={`s-end-${index}`} className="mb-0 flex-1">
                <TimeSelect id={`s-end-${index}`} step={SCHEDULE_STEP} value={block.end} onChange={(value) => changeBlock(index, { end: value })} />
              </FormField>
            </div>
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" className="mb-4" onClick={() => setBlocks((prev) => [...prev, { ...NEW_BLOCK, days: [] }])}>
        <Icon name="plus" /> Agregar horario
      </Button>
    </FormDrawer>
  );
}
