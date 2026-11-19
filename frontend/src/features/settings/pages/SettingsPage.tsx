import { useState, useSyncExternalStore } from 'react';
import { Icon } from '../../../components/atoms/Icon';
import { PageHeader } from '../../../components/molecules/PageHeader';
import { useToast } from '../../../components/organisms/toast-context';
import {
  BACKDROP_PRESETS,
  BUTTON_COLOR_PRESETS,
  getAppearance,
  getTheme,
  setBackdrop,
  setButtonColor,
  setTheme,
  setWindowAlpha,
  subscribeTheme,
  type Theme,
} from '../../../utils/appearance';
import { Button } from '../../../components/atoms/Button';
import { Card, CardTitle } from '../../../components/molecules/Card';
import { Divider } from '../../../components/atoms/Divider';

const sameColor = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

interface SwatchesProps {
  colors: string[];
  selected: string;
  onPick: (color: string) => void;
  onCustom: (color: string) => void;
}

function Swatches({ colors, selected, onPick, onCustom }: SwatchesProps) {
  return (
    <>
      <div className="swatch-row">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`swatch${sameColor(color, selected) ? ' selected' : ''}`}
            style={{ background: color }}
            title={color}
            aria-label={color}
            aria-pressed={sameColor(color, selected)}
            onClick={() => onPick(color)}
          />
        ))}
      </div>
      <div className="custom-color-row">
        <input type="color" value={selected} aria-label="Color personalizado" onChange={(e) => onCustom(e.target.value)} />
        <span className="cell-sub">Personalizado</span>
      </div>
    </>
  );
}

export function SettingsPage() {
  const showToast = useToast();
  const theme = useSyncExternalStore(subscribeTheme, getTheme);
  const [appearance, setAppearance] = useState(getAppearance);
  const alphaPercent = Math.round(appearance.windowAlpha * 100);

  const chooseTheme = (next: Theme) => {
    setTheme(next);
    showToast(`Tema ${next === 'dark' ? 'oscuro' : 'claro'} activado.`);
  };

  const changeBackdrop = (color: string) => {
    setBackdrop(color);
    setAppearance((current) => ({ ...current, backdrop: color }));
  };

  const changeButtonColor = (color: string) => {
    setButtonColor(color);
    setAppearance((current) => ({ ...current, buttonColor: color }));
  };

  const changeWindowAlpha = (percent: number) => {
    setWindowAlpha(percent / 100);
    setAppearance((current) => ({ ...current, windowAlpha: percent / 100 }));
  };

  return (
    <>
      <PageHeader title="Configuración" subtitle="Preferencias de apariencia de tu sesión." />

      <Card style={{ maxWidth: 480, marginBottom: 16 }}>
        <CardTitle>Tema</CardTitle>
        <p className="cell-sub">Elige el modo de color de la interfaz.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button
            type="button"
            className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => chooseTheme('light')}
          >
            <Icon name="sun" /> Claro
          </button>
          <button
            type="button"
            className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => chooseTheme('dark')}
          >
            <Icon name="moon" /> Oscuro
          </button>
        </div>
      </Card>

      <Card style={{ maxWidth: 480, marginBottom: 16 }}>
        <CardTitle>Color de fondo</CardTitle>
        <p className="cell-sub">Se aplica al área alrededor de la ventana del sistema.</p>
        <Swatches
          colors={BACKDROP_PRESETS}
          selected={appearance.backdrop}
          onPick={(color) => {
            changeBackdrop(color);
            showToast('Color de fondo actualizado.');
          }}
          onCustom={changeBackdrop}
        />
      </Card>

      <Card style={{ maxWidth: 480, marginBottom: 16 }}>
        <CardTitle>Color de botones</CardTitle>
        <p className="cell-sub">Color del botón primario (acciones principales).</p>
        <Swatches
          colors={BUTTON_COLOR_PRESETS}
          selected={appearance.buttonColor}
          onPick={(color) => {
            changeButtonColor(color);
            showToast('Color de botones actualizado.');
          }}
          onCustom={changeButtonColor}
        />
        <Divider />
        <Button size="sm">
          Vista previa del botón
        </Button>
      </Card>

      <Card style={{ maxWidth: 480 }}>
        <CardTitle>Transparencia del contenedor</CardTitle>
        <p className="cell-sub">Qué tan transparente se ve la ventana del sistema sobre el fondo.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <input
            type="range"
            min={40}
            max={100}
            value={alphaPercent}
            aria-label="Transparencia del contenedor"
            onChange={(e) => changeWindowAlpha(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span className="cell-sub" style={{ width: 40 }}>
            {alphaPercent}%
          </span>
        </div>
      </Card>
    </>
  );
}
