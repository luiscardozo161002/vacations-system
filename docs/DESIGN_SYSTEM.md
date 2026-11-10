# Design System

## Fuente de verdad

El diseño aprobado es el prototipo de `C:\Develop\vacations-design-system` (`index.html`, `styles.css`, `app.js`): 14 pantallas y 3 roles. Para verlo:

```bash
npx serve C:/Develop/vacations-design-system -l 4600
```

Si el frontend y el prototipo no coinciden, gana el prototipo. Este documento resume las reglas de ese diseño y cómo están portadas a [frontend/src/index.css](../frontend/src/index.css).

## Dirección

Panel de administración limpio: fuente Inter, texto casi negro sobre blanco, bordes sutiles y botón primario negro. No hay color de marca. El color se usa solo para comunicar estados (éxito, advertencia, peligro). En la app final, el contenido vive en una "ventana" con esquinas redondeadas sobre un fondo gris (`--backdrop`). Eso llega con el shell (VM-030).

## Tokens

Todos son custom properties en `:root`. El tema oscuro los redefine en `:root[data-theme='dark']`.

| Grupo | Tokens | Uso |
|---|---|---|
| Superficies | `--bg`, `--bg-subtle`, `--surface`, `--surface-solid` | fondo de página, encabezados de tabla y hover, tarjetas, modales e inputs |
| Texto | `--text`, `--text-muted` | cuerpo y encabezados; ayudas, metadatos y encabezados de tabla |
| Bordes | `--border`, `--divider` | tablas, inputs y tarjetas; separadores del sidebar |
| Botón primario | `--btn-primary-bg`, `--btn-primary-bg-hover`, `--btn-primary-text` | acción principal de cada pantalla |
| Botón secundario | `--btn-secondary-bg`, `--btn-secondary-bg-hover`, `--btn-secondary-text`, `--btn-secondary-border` | cancelar y acciones alternas |
| Estados | `--success-*`, `--warning-*`, `--danger-*`, `--neutral-*` (cada uno con `-bg` y `-text`) | badges, banners y acciones destructivas |
| Radios | `--radius-sm` 8px, `--radius-md` 10px, `--radius-lg` 12px, `--radius-pill` 999px | botones e inputs; tarjetas; tablas y modales; badges |
| Sombras | `--shadow-sm`, `--shadow-md`, `--focus-ring` | tarjetas; modales y menús; foco de inputs |
| Layout | `--sidebar-w` 248px, `--sidebar-w-collapsed` 76px, `--topbar-h` 60px, `--backdrop`, `--window-margin`, `--window-radius`, `--window-bg-rgb`, `--window-bg-alpha` | shell de la aplicación |

Reglas:

- Los componentes usan tokens, nunca colores sueltos. La única excepción es el overlay de los modales.
- Los estados van en pares: un fondo `-bg` siempre con su texto `-text`.
- Estados de un aviso o solicitud: `approved` → success, `pending` → warning, `rejected` → danger, `cancelled` e `inactive` → neutral.

## Tema claro y oscuro

- El tema se elige con `data-theme="light" | "dark"` en `<html>`, desde [frontend/src/lib/theme.ts](../frontend/src/lib/theme.ts).
- Al arrancar, `initTheme()` usa el tema guardado en `localStorage` (`vm_theme`) o, si no hay ninguno, el del sistema operativo.
- `setTheme` y `toggleTheme` lo cambian y lo guardan. El botón para cambiarlo vive en la topbar (VM-030).
- Las preferencias de color de fondo, color del botón primario y transparencia de la ventana son de la pantalla de Configuración (VM-045). Se aplican sobrescribiendo `--backdrop`, `--btn-primary-*` y `--window-bg-alpha` en `<html>`. Si el fondo del botón es claro, el texto pasa a `#0f172a`.

## Tipografía

Inter (400, 500, 600 y 700), cargada desde Google Fonts en `index.html`, con `system-ui` como respaldo.

| Uso | Tamaño | Peso |
|---|---|---|
| Título de página (`h1`) | 22px | 600 |
| Título de modal o drawer | 18px | 600 |
| Cuerpo, botones e inputs | 14px | 400 / 500 |
| Celdas de tabla y subtítulos | 13.5px | 400 |
| Labels y paginación | 13px | 500 |
| Encabezados de tabla (mayúsculas) y badges | 12px | 600 / 500 |

## Espaciado

Múltiplos de 2 y 4: 4, 6, 8, 10, 12, 16, 20, 24, 32, 48. Las celdas de tabla usan `12px 16px`, los modales `24px` y los espacios entre controles `10px`.

## Componentes

**Hoy en `App.css`**, ya con los tokens nuevos:
- `.page` y `.page-header`
- `.banner-error`
- `.toolbar`
- `.table`
- `.badge` (`-active` / `-inactive`)
- `.pagination`
- `.button-primary`, `.button-secondary` y `.button-link` (`+ .button-danger`)
- `.modal-overlay` y `.modal`

**Kit del prototipo, pendiente para VM-031:**
- Botones: `btn` (primary, secondary, outline, ghost y sm) e `icon-btn`.
- Formularios: `field` con label, error y ayuda.
- Datos: `DataTable` con pie de paginación y orden por columna.
- Feedback: badges success, warning, danger y neutral; `Toast`; `EmptyState`.
- Capas: `Drawer` y diálogo de confirmación, que reemplaza a `window.confirm`.
- Otros: `StatCard`, `Toolbar` con buscador y `SearchSelect`.

Cuando entre el kit, las clases de `App.css` se reemplazan por esos componentes.

## Accesibilidad

- Todo elemento interactivo muestra foco con `:focus-visible` (contorno de 2px en `--text`). Los inputs, además, usan `--focus-ring`.
- El texto sobre `--btn-primary-bg` mantiene un contraste legible con cualquier color elegido en Configuración.
- En el prototipo, el botón primario es `#111111` también en el tema oscuro, y casi no se distingue del fondo. En la app, el tema oscuro lo invierte: fondo `#f1f5f9` con texto `#0f172a`. Si el usuario elige un color en Configuración, se usa ese en los dos temas.
- El prototipo oculta las barras de scroll. En la app no se ocultan, para no perder la pista de que una lista sigue.

## Responsive

Cortes del prototipo:
- **< 640px:** las rejillas bajan a una columna.
- **< 960px:** la ventana ocupa toda la pantalla, sin margen ni esquinas. El sidebar se abre como panel desde el botón de menú.
- **< 1100px:** las rejillas de 4 y 3 columnas bajan a 2.
