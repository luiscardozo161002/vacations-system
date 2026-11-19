# Design System

La fuente de diseño es el prototipo `C:\Develop\vacations-design-system`: 14 pantallas y 3 roles.

```bash
npx serve C:/Develop/vacations-design-system -l 4600
```

## Qué se reutiliza

| Prototipo | Frontend | Regla |
|---|---|---|
| `styles.css` | [frontend/src/styles.css](../frontend/src/styles.css) | Copia idéntica, no se edita |
| `icons.js` | [frontend/src/components/Icon.tsx](../frontend/src/components/Icon.tsx) | Mismo mapa: `<Icon name="plus" />` |
| Markup de `app.js` (`renderEmpleados`, `openDrawer`, `openDialog`, `paginationFooter`…) | Componentes React | Mismas clases y estructura |
| `applyTheme`, `applyButtonColor`, `applyWindowAlpha` y las claves `vm_*` | [frontend/src/lib/appearance.ts](../frontend/src/lib/appearance.ts) | Mismos presets y fórmulas; tema claro por defecto |

## Reglas

1. **Una fuente de verdad.** Todo cambio de diseño se hace primero en el prototipo y luego se copia el CSS:
   ```bash
   cp C:/Develop/vacations-design-system/styles.css frontend/src/styles.css
   ```
2. **Sin CSS por pantalla.** Si falta algo, se agrega al prototipo.
3. **Una pantalla nueva** copia el markup de su función `render…` y lo pasa a JSX, cambiando los datos falsos de `data.js` por llamadas al SDK.
4. **Estados** con las clases de `statusBadge`:

| Estado | Clase |
|---|---|
| `active`, `approved` | `badge-success` |
| `pending` | `badge-warning` |
| `rejected` | `badge-danger` |
| `inactive`, `cancelled` | `badge-neutral` |

## Componentes del kit

Están en [frontend/src/components](../frontend/src/components) y reproducen una función de `app.js`.

| Componente | Prototipo | Uso |
|---|---|---|
| `Drawer` | `openDrawer` | Formularios laterales; con `onSubmit` es un `<form>` |
| `Dialog`, `ConfirmDialog` | `openDialog` | Confirmaciones, en lugar de `window.confirm` |
| `ToastProvider`, `useToast()` | `showToast` | Avisos de 3.2 s abajo a la derecha |
| `DataTable` | `table-wrap`, `paginationFooter` | Tabla con estado vacío, carga y paginación |
| `EmptyState` | `emptyState` | Listas sin resultados |
| `StatusBadge` | `statusBadge` | Estado con su color |
| `SearchSelect` | `searchSelect` | Combobox con `datalist` |
| `StatCard` | `statCard` | Indicadores del dashboard |
| `Icon` | `iconSvg` | Iconos |
| `FormField`, `TextField`, `SelectField`, `SearchInput` | Formularios | Campos con etiqueta y ayuda; la búsqueda espera 300 ms |

Drawers y diálogos se cierran con Escape o con clic fuera. Los diálogos de confirmación tienen un solo botón de acción.
