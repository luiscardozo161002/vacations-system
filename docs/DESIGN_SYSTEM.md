# Sistema de diseño

Define los estilos, componentes y patrones de interacción compartidos por el frontend.

[Producto](PRD.md) · [Arquitectura](ARCHITECTURE.md) · [Roadmap](ROADMAP.md)

## Referencias del proyecto

El prototipo de Vacation Manager es la referencia visual. La interfaz usa Tailwind CSS, componentes de Radix UI y Atomic Design, y el tema de Tailwind es la fuente de verdad de los tokens.

| Recurso | Referencia |
| --- | --- |
| Tokens y tema de Tailwind | [tailwind.css](../frontend/src/tailwind.css) |
| Variables y estilos heredados, en migración | [styles.css](../frontend/src/styles.css) |
| Componentes React | [components](../frontend/src/components) |
| Tema y preferencias | [appearance.ts](../frontend/src/utils/appearance.ts) |
| Menú y nombres de módulos | [navigation.ts](../frontend/src/app/navigation.ts) |

Los componentes se organizan por nivel: `atoms` (botón, insignia, icono), `molecules` (campos, búsqueda, encabezado) y `organisms` (tabla, paneles, diálogos). Las páginas viven en `features`. Las variantes se declaran con `class-variance-authority` y las clases se combinan con `cn`. Las clases nuevas usan los tokens del tema, como `bg-primary` o `text-muted`; no se agregan clases a `styles.css`.

## Fundamentos visuales

### Color

Los tokens expresan la función de cada color. El tema oscuro cambia sus valores mediante `data-theme="dark"`.

| Uso | Token | Tema claro |
| --- | --- | --- |
| Fondo | `--bg` | `#ffffff` |
| Fondo secundario | `--bg-subtle` | `#f8fafc` |
| Superficie | `--surface-solid` | `#ffffff` |
| Texto | `--text` | `#0f172a` |
| Texto secundario | `--text-muted` | `#64748b` |
| Borde | `--border` | `#e2e8f0` |
| Texto atenuado | `--text-faint` | `#cbd5e1` |
| Anillo de foco | `--focus-ring` | `rgba(15, 23, 42, 0.08)` |
| Acción principal | `--btn-primary-bg` | `#111111` |

Los colores de éxito, advertencia, error y estado neutral tienen tokens propios para texto y fondo. Las preferencias de apariencia permiten cambiar el fondo exterior, el color del botón principal y la opacidad de la ventana.

Cada tema recuerda su propio fondo exterior. Si el fondo elegido contradice el tema, como un fondo claro con el tema oscuro, la opacidad de la ventana no baja de 85 % para que el texto siga legible, y Configuración lo indica. [Reglas de apariencia](../frontend/src/utils/appearance.ts)

### Tipografía y forma

La interfaz utiliza Inter con fuentes del sistema como alternativa. El texto base es de 14 px y tiene una altura de línea de 1.5. Los títulos usan peso 600.

Los radios compartidos son de 8, 10 y 12 px, con un radio independiente para controles redondeados. Las sombras y las dimensiones de la navegación se definen en los mismos estilos. [Tokens visuales](../frontend/src/tailwind.css)

## Componentes

| Componente | Uso |
| --- | --- |
| `Button`, `IconButton` | Acciones con variantes `primary`, `secondary`, `outline` y `ghost` |
| `Badge` | Etiqueta con tono semántico |
| `Avatar`, `Divider`, `ProgressBar`, `LinkButton`, `BrandMark` | Iniciales, separador, barra de avance, enlace y logotipo |
| `Card`, `CardHeader`, `CardTitle`, `KeyValue`, `KeyValueGrid` | Tarjeta y pares etiqueta-valor |
| `Grid`, `ListRow`, `Tabs`, `SwatchPicker` | Rejilla de 2, 3 o 4 columnas, fila de lista, pestañas y selector de color |
| `DataTable` | Tablas con carga, estado vacío y paginación |
| `Modal`, `Drawer` | Base accesible sobre Radix Dialog y panel lateral para formularios y detalle |
| `Dialog`, `ConfirmDialog` | Confirmaciones y acciones que necesitan contexto |
| `Input`, `Select`, `Textarea`, `Checkbox` | Controles de formulario; `Select` y `Checkbox` usan Radix y `Select` admite `compact` para las barras de filtros |
| `FieldError`, `FieldHint` | Mensaje de error y texto de ayuda de un campo |
| `FormField`, `TextField`, `SelectField`, `CheckboxRow` | Campos con etiqueta, ayuda y validación |
| `SearchBox`, `SearchInput`, `SearchSelect` | Búsqueda y selección de registros |
| `Toolbar`, `ToolbarSpacer`, `RowActions` | Barra de filtros y acciones de una fila |
| `StatusBadge` | Estado con texto y tono semántico |
| `Toaster`, `useToast` | Confirmación breve del resultado de una acción, con Sonner |
| `EmptyState` | Mensaje para listas sin resultados |
| `StatCard` | Indicadores resumidos |
| `Icon` | Iconos del catálogo compartido |

La implementación y las propiedades disponibles se consultan en el componente correspondiente. [Catálogo de componentes](../frontend/src/components)

## Patrones de interacción

### Listados y formularios

- Los filtros muestran el criterio aplicado y la paginación conserva el contexto del listado.
- La búsqueda por texto espera 300 ms antes de actualizar los resultados.
- Las tablas distinguen carga y ausencia de resultados.
- Los campos tienen una etiqueta visible y la ayuda se vincula al control.
- Los formularios presentan los errores de la API junto al contexto de la operación.

### Paneles y confirmaciones

Los paneles y diálogos se cierran con el botón de cierre, Escape o un clic en el fondo. El foco permanece dentro del panel y vuelve al control de origen al cerrarlo.

Las confirmaciones muestran una acción con un verbo concreto, como «Aprobar», «Rechazar» o «Cancelar». La notificación breve comunica el resultado y se anuncia mediante una región de estado. Al abrir un panel el foco pasa a su primer campo, o al elemento marcado con `data-autofocus`. [Modal](../frontend/src/components/organisms/Modal.tsx), [diálogos](../frontend/src/components/organisms/Dialog.tsx), [notificaciones](../frontend/src/components/organisms/Toaster.tsx)

### Estados

| Estado del dato | Etiqueta | Tono |
| --- | --- | --- |
| `active` | Activo | Éxito |
| `approved` | Aprobada | Éxito |
| `pending` | Pendiente | Advertencia |
| `rejected` | Rechazada | Error |
| `locked` | Bloqueado | Error |
| `inactive` | Inactivo | Neutral |
| `cancelled` | Cancelada | Neutral |
| `success` / `failed` | Exitoso / Fallido | Éxito / Error |

Cada estado se comunica con texto además de color. [StatusBadge](../frontend/src/components/atoms/StatusBadge.tsx)

## Accesibilidad y adaptación

Al modificar una pantalla, comprueba la navegación por teclado, las etiquetas de los controles y la recuperación del foco. Los diálogos deben conservar su título y sus atributos de modalidad.

Revisa los temas claro y oscuro, los estados de carga, vacío y error, y los anchos de escritorio y móvil. Las reglas adaptables viven en el CSS compartido. Las pruebas de formularios y diálogos verifican parte de estas interacciones. [Pruebas de componentes](../frontend/src/components/organisms/Dialog.test.tsx)

## Referencias

La organización en fundamentos, componentes y patrones toma como referencia GOV.UK Design System. Los valores visuales y el comportamiento descritos corresponden a este proyecto. [GOV.UK Design System](https://design-system.service.gov.uk/)
