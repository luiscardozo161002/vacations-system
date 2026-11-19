import { cn } from '../../utils/cn';

const sameColor = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

interface SwatchPickerProps {
  colors: string[];
  selected: string;
  onPick: (color: string) => void;
  onCustom: (color: string) => void;
}

export function SwatchPicker({ colors, selected, onPick, onCustom }: SwatchPickerProps) {
  return (
    <>
      <div className="mt-3.5 mb-5 flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = sameColor(color, selected);
          return (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={color}
              aria-pressed={isSelected}
              style={{ background: color }}
              onClick={() => onPick(color)}
              className={cn(
                'relative size-11 cursor-pointer rounded-[10px] border border-line transition-transform duration-[80ms] hover:scale-[1.06]',
                isSelected &&
                  "border-2 border-fg after:absolute after:inset-0 after:rounded-[9px] after:shadow-[inset_0_0_0_2px_var(--surface-solid)] after:content-['']",
              )}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={selected}
          aria-label="Color personalizado"
          onChange={(e) => onCustom(e.target.value)}
          className="size-11 cursor-pointer rounded-[10px] border border-line bg-surface p-0.5"
        />
        <span className="text-[12.5px] text-muted">Personalizado</span>
      </div>
    </>
  );
}
