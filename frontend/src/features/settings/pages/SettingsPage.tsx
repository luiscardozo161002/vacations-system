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
import { SwatchPicker } from '../../../components/molecules/SwatchPicker';

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

      <Card className="mb-4 max-w-[480px]">
        <CardTitle>Tema</CardTitle>
        <p className="text-[12.5px] text-muted">Elige el modo de color de la interfaz.</p>
        <div className="mt-3 flex gap-2.5">
          <Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => chooseTheme('light')}>
            <Icon name="sun" /> Claro
          </Button>
          <Button variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => chooseTheme('dark')}>
            <Icon name="moon" /> Oscuro
          </Button>
        </div>
      </Card>

      <Card className="mb-4 max-w-[480px]">
        <CardTitle>Color de fondo</CardTitle>
        <p className="text-[12.5px] text-muted">Se aplica al área alrededor de la ventana del sistema.</p>
        <SwatchPicker
          colors={BACKDROP_PRESETS}
          selected={appearance.backdrop}
          onPick={(color) => {
            changeBackdrop(color);
            showToast('Color de fondo actualizado.');
          }}
          onCustom={changeBackdrop}
        />
      </Card>

      <Card className="mb-4 max-w-[480px]">
        <CardTitle>Color de botones</CardTitle>
        <p className="text-[12.5px] text-muted">Color del botón primario (acciones principales).</p>
        <SwatchPicker
          colors={BUTTON_COLOR_PRESETS}
          selected={appearance.buttonColor}
          onPick={(color) => {
            changeButtonColor(color);
            showToast('Color de botones actualizado.');
          }}
          onCustom={changeButtonColor}
        />
        <Divider />
        <Button size="sm">Vista previa del botón</Button>
      </Card>

      <Card className="max-w-[480px]">
        <CardTitle>Transparencia del contenedor</CardTitle>
        <p className="text-[12.5px] text-muted">Qué tan transparente se ve la ventana del sistema sobre el fondo.</p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="range"
            min={40}
            max={100}
            value={alphaPercent}
            aria-label="Transparencia del contenedor"
            onChange={(e) => changeWindowAlpha(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-10 text-[12.5px] text-muted">{alphaPercent}%</span>
        </div>
      </Card>
    </>
  );
}
