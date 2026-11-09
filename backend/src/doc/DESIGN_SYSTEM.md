# Design System

## Dirección

Limpio, claro, minimal — estilo panel de administración (ver referencia visual al final), no estilo producto de consumo. Fondo blanco, bordes sutiles en vez de sombras, una sola jerarquía tipográfica clara. El contraste lo da el espaciado y un acento usado con moderación (botón primario, links, foco, estados), no decoración.

## Colores

Ya implementados en [frontend/src/index.css](../../../frontend/src/index.css) como custom properties, con variante para modo oscuro. Se mantienen tal cual — nombres semánticos, pocos, ya cubren claro/oscuro:

```css
--bg            /* fondo de la página */
--bg-subtle     /* superficies secundarias: badge inactivo, filas alternas */
--text          /* texto de cuerpo */
--text-h        /* texto de encabezados */
--border        /* bordes de tablas, inputs, tarjetas */
--accent        /* color de marca: botón primario, links, foco */
--accent-bg     /* fondo tenue del acento: hover, selección */
--accent-contrast
--danger / --danger-bg         /* rechazar, dar de baja, errores */
--success-bg / --success-text  /* activo, aprobado */
```

Falta un tono para estados intermedios (avisos `pending`). Agregar:

```css
--warning-bg: rgba(217, 119, 6, 0.12);
--warning-text: #b45309;

/* dentro de @media (prefers-color-scheme: dark) */
--warning-bg: rgba(251, 191, 36, 0.15);
--warning-text: #fbbf24;
```

No se cambia el acento morado (`--accent: #aa3bff`) ya en uso: tocar la paleta ahora sería cosmético y afectaría toda la UI ya construida sin ganar nada — lo "limpio y minimal" lo da la disciplina de espaciado y tipografía, no el tono del acento.

## Tipografía

Sin fuente custom — menos peso de carga, ya consistente con "minimal": `system-ui, 'Segoe UI', Roboto, sans-serif` (ya en `index.css`).

| Uso | Tamaño | Peso |
|---|---|---|
| H1 — título de página | 28px | 600 |
| H2 — título de modal/sección | 20px | 600 |
| Body | 15px | 400 |
| Small — badges, ayuda, metadatos | 13px | 400 |

## Espaciado

Sistema de 8px, ya usado de facto en `App.css`: 4, 8, 12, 16, 20, 24, 32, 48. Formalizarlo evita que aparezcan valores sueltos en componentes nuevos.

## Radios y bordes

- `6px` — inputs, botones, banners.
- `10px` — modales, tarjetas.
- `999px` — badges/pills.
- `1px solid var(--border)` para separar superficies, sin sombra.

## Componentes

Inventario actual (clases globales en `App.css`, CSS plano — se mantiene así, no hace falta Tailwind ni una librería de componentes para este tamaño de proyecto):

- `.page` / `.page-header` — layout de página con título + acción principal.
- `.banner.banner-error` — mensaje de error inline.
- `.toolbar` — fila de filtros.
- `.table` — tabla de datos con bordes sutiles.
- `.badge.badge-active` / `.badge-inactive` — estado en pill.
- `.pagination` — anterior/siguiente + "Página X de Y".
- `.button-primary` / `.button-secondary` / `.button-link` (+ `.button-danger`) — tres variantes, sin librería.
- `.modal-overlay` / `.modal` — diálogo centrado para formularios.

Para completar el módulo de avisos y las pantallas que faltan, agregar (mismo patrón, sin dependencias nuevas):

- `.badge-pending` / `.badge-approved` / `.badge-rejected` / `.badge-cancelled`, usando `--warning-*` y los tokens ya existentes.
- Un diálogo de confirmación reutilizable (variante pequeña de `.modal`) para reemplazar los `window.confirm()` actuales en aprobar/rechazar/dar de baja.
- Una barra de navegación simple (Empleados / Departamentos / Turnos / Avisos) en `App.tsx` — hoy no existe ninguna, el App solo renderiza `EmployeesPage` directo. Hace falta ese shell antes de sumar más pantallas.

## Responsive

Mobile: < 640px · Tablet: 640–1024px · Desktop: > 1024px. El layout actual (`max-width: 1024px` centrado) ya es compatible.

## Referencia visual

Panel de administración tipo Tailscale: fondo blanco, tabs superiores por sección, tabla de datos con buscador y filtros a la derecha, puntos de estado de color en vez de iconos grandes. Es el mismo patrón que ya tiene `EmployeesPage` (toolbar + tabla) — se trata de extenderlo a Departamentos, Turnos y Avisos bajo un shell común, no de rediseñarlo.
