# Design System

El diseño es el prototipo de `C:\Develop\vacations-design-system`: 14 pantallas y 3 roles. No hay otro.

```bash
npx serve C:/Develop/vacations-design-system -l 4600
```

## Cómo se reutiliza

| Prototipo | Frontend | Regla |
|---|---|---|
| `styles.css` | [frontend/src/styles.css](../frontend/src/styles.css) | Copia idéntica, no se edita a mano |
| `icons.js` | [frontend/src/components/Icon.tsx](../frontend/src/components/Icon.tsx) | El mismo mapa de iconos, usado como `<Icon name="plus" />` |
| Markup de `app.js` (`renderEmpleados`, `openDrawer`, `openDialog`, `paginationFooter`…) | Componentes de React | Mismas clases y misma estructura |
| `applyTheme` y `vm_theme` | [frontend/src/lib/theme.ts](../frontend/src/lib/theme.ts) | `data-theme` en `<html>`, claro por defecto |

## Reglas

1. **Una sola fuente de verdad.** Cualquier cambio de diseño (un color, un componente nuevo, otro espaciado) se hace primero en el prototipo. Después se vuelve a copiar `styles.css`:
   ```bash
   cp C:/Develop/vacations-design-system/styles.css frontend/src/styles.css
   ```
2. **No hay CSS propio por pantalla.** Si una pantalla necesita algo que el prototipo no tiene, se agrega al prototipo.
3. **Para armar una pantalla se copia el markup** de la función `render…` correspondiente en `app.js` y se pasa a JSX. Se cambian los datos falsos (`data.js`) por llamadas al SDK.
4. **Estados:** se usan las mismas clases que `statusBadge` en `app.js`.
   - `active` y `approved` → `badge-success`
   - `pending` → `badge-warning`
   - `rejected` → `badge-danger`
   - `inactive` y `cancelled` → `badge-neutral`
