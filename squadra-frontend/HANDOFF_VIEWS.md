# Squadra — Handoff de vistas: Lista · Calendario · Cronograma (Gantt)

> Especificación de implementación para las tres vistas pendientes.
> Stack: **React 18 + TS + urql + @dnd-kit**. Tokens en [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) / `src/styles/tokens.css`.
> Regla de oro: **referenciar tokens, no valores**. Todas consumen la misma query `projectTasks` variando `groupBy` y el renderizado.

## Contrato de datos común (backend NestJS)

| Elemento | Firma GraphQL | Notas |
|----------|---------------|-------|
| Carga | `projectTasks(projectId: ID!, filter: TaskFilterInput, groupBy: GroupBy)` → `GroupedTasks` | `GroupBy` = `NONE \| SECTION \| ASSIGNEE` |
| Mover/reordenar | `moveTask(input: MoveTaskInput)` | `{ taskId, sectionId?, beforeTaskId?, afterTaskId? }` — orden fraccional |
| Editar | `updateTask(id, input)` | fechas, status, assignee, título |
| Crear | `createTask(input)` | `id` opcional (UUID cliente, offline-first) |
| Dependencias | `addDependency(blockerId, blockedId)` | usado por Gantt |
| Campos personalizados | `CustomField { type: text\|number\|dropdown }` + `CustomFieldValue` | columnas de Lista |

Modelo `Task` disponible: `id, title, status, sectionId, parentTaskId, assigneeId, startDate, dueDate, position, version, subtasks`.
`status ∈ {todo, in_progress, in_review, done, blocked}` → tokens `--status-<estado>-bg/fg`.

**Concurrencia:** toda mutación viaja con `version` (optimistic locking). Si el backend responde conflicto, refetch + re-aplicar. **Tiempo real:** las tres vistas se suscriben al WebSocket (`task.updated` / `task.moved`) y aplican patch por `id`.

---

## Handoff Spec 1 — Vista Lista

### Overview
Tabla densa de tareas agrupadas (por sección o responsable). Es la vista de trabajo por defecto: escaneo rápido, edición inline, ordenamiento por columnas. Soporta subtareas anidadas (expand/collapse) y columnas de campos personalizados.

### Layout
Tabla full-width dentro del `AppShell`. Grid de columnas fijo + columnas dinámicas (custom fields) con scroll horizontal. Filas de `40px`. Encabezado de grupo sticky al hacer scroll vertical.

```
[▸] Título ..................... | Estado | Responsable | Vence | [Custom…] |
── Grupo: "Sección A" (n) ────────────────────────────────────────────────
[▸] Tarea padre                  | pill   | avatar      | 24 jul| …         |
     └ Subtarea (indent 24px)    | pill   | avatar      | —     | …         |
[＋ Añadir tarea]
```

### Design Tokens Used
| Token | Uso |
|-------|-----|
| `--space-2` / `--space-3` | padding de celda (vertical / horizontal) |
| `--gray-100` | hover de fila; fondo header de grupo |
| `--gray-200` | divisor entre filas (`border-bottom 1px`) |
| `--text-md` | texto de fila; `--text-sm` header de columna |
| `--status-*-bg/fg` | `StatusPill` de la columna Estado |
| `--brand-500` | foco de edición inline; checkbox activo |
| `--radius-sm` | inputs inline |

### Components
| Componente | Variante | Props | Notas |
|-----------|----------|-------|-------|
| `ListRow` | task · subtask | `task, depth` | indent = `depth * var(--space-6)` |
| `StatusPill` | — | `status` | reusa el del design system |
| `Avatar` | sm | `name, src` | columna Responsable |
| `InlineEdit` | text · date · select | `value, onCommit` | commit en blur/Enter → `updateTask` |
| `GroupHeader` | section · assignee | `label, count, collapsed` | sticky, colapsable |
| `AddTaskRow` | — | `sectionId` | crea con `createTask` optimista |

### States and Interactions
| Elemento | Estado | Comportamiento |
|----------|--------|----------------|
| Fila | hover | fondo `--gray-100`; aparecen acciones (⋯, ✔) a la derecha |
| Fila | selected | borde izq `2px var(--brand-500)` |
| Celda editable | focus | se transforma en `Input`/select; Esc cancela, Enter/blur confirma |
| Título | click en ▸ | expande/colapsa subtareas (`subtasks` resolver) |
| Checkbox | check | `updateTask(status: done)` optimista + tachado del título |
| Columna header | click | ordena asc/desc (client-side sobre el grupo) |
| Fila | drag | reordena dentro/entre grupos → `moveTask(beforeTaskId/afterTaskId)` |

### Responsive Behavior
| Breakpoint | Cambios |
|------------|---------|
| Desktop (>1024px) | todas las columnas visibles |
| Tablet (768–1024px) | oculta custom fields; Responsable→avatar sin nombre |
| Mobile (<768px) | colapsa a lista de 1 columna: título + pill + avatar apilados; edición abre bottom-sheet |

### Edge Cases
- **Vacío (proyecto):** ilustración + copy "Aún no hay tareas" + botón primario "Crear tarea".
- **Grupo vacío:** fila tenue "Sin tareas" + `AddTaskRow`.
- **Título largo:** truncar a 1 línea con `text-overflow: ellipsis`; tooltip con el completo.
- **Carga:** skeleton de 6 filas (barras `--gray-100` con shimmer).
- **Error de mutación:** revertir optimista + toast danger "No se pudo guardar. Reintentar".
- **Muchas tareas (500+):** virtualizar filas (`@tanstack/react-virtual`).

### Animation / Motion
| Elemento | Trigger | Animación | Duración | Easing |
|----------|---------|-----------|----------|--------|
| Subtareas | expand | altura auto + fade | `--motion-base` | `--ease` |
| Fila nueva | create | slide-in + highlight brand que se desvanece | `--motion-base` | `--ease` |
| Reorden | drop | reposicionamiento suave | `--motion-fast` | `--ease` |

### Accessibility Notes
- Tabla semántica: `role="grid"`, filas `role="row"`, celdas `role="gridcell"`.
- Orden de foco: checkbox → título → estado → responsable → fecha → acciones.
- Teclado: `↑/↓` navega filas, `Enter` edita celda, `Space` marca completada, `→/←` expande/colapsa.
- Screen reader anuncia: "Tarea {título}, estado {estado}, vence {fecha}, {n} subtareas".

---

## Handoff Spec 2 — Vista Calendario

### Overview
Grilla mensual que ubica cada tarea en su `dueDate`. Sirve para ver carga por día y reprogramar arrastrando. Barras que cruzan de `startDate` a `dueDate` cuando ambas existen.

### Layout
Grilla 7 columnas (Lun–Dom) × 5–6 filas. Toolbar superior: `‹ Julio 2026 ›`, botón "Hoy", toggle Mes/Semana. Cada celda-día: número arriba, hasta 3 chips de tarea + "＋N más".

```
┌ Lun ┬ Mar ┬ Mié ┬ Jue ┬ Vie ┬ Sáb ┬ Dom ┐
│  21 │ 22● │ 23  │ 24  │ 25  │ 26  │ 27  │
│ ▪tarea         │ ▪▪  │     │     │     │
│ +2 más         │     │     │     │     │
```

### Design Tokens Used
| Token | Uso |
|-------|-----|
| `--gray-200` | líneas de la grilla |
| `--gray-50` | días fuera del mes actual |
| `--brand-50` / `--brand-500` | día de hoy (fondo / punto indicador) |
| `--status-*-bg/fg` | color del chip según estado |
| `--space-1` | gap entre chips; `--radius-sm` chip |
| `--text-xs` | número de día y texto de chip |

### Components
| Componente | Variante | Props | Notas |
|-----------|----------|-------|-------|
| `CalendarToolbar` | — | `month, onPrev, onNext, onToday` | |
| `DayCell` | current · outside · today | `date, tasks` | droppable (`useDroppable`, id = ISO date) |
| `TaskChip` | dot · bar | `task` | draggable; bar si `startDate`≠`dueDate` |
| `MorePopover` | — | `date, tasks` | lista completa del día |

### States and Interactions
| Elemento | Estado | Comportamiento |
|----------|--------|----------------|
| Chip | hover | eleva sombra `--shadow-sm`; muestra hora/responsable |
| Chip | drag → otro día | `updateTask(dueDate: nuevoDía)` optimista; si tiene `startDate`, desplaza ambas manteniendo duración |
| Día | hover | botón "＋" para crear tarea con ese `dueDate` |
| "+N más" | click | abre `MorePopover` |
| Toolbar ‹ › | click | cambia mes; prefetch mes adyacente |

### Responsive Behavior
| Breakpoint | Cambios |
|------------|---------|
| Desktop (>1024px) | grilla mensual completa, 3 chips/día |
| Tablet (768–1024px) | 2 chips/día + "más" |
| Mobile (<768px) | cambia a **agenda vertical** (lista por día con fecha sticky); sin drag, tap abre detalle |

### Edge Cases
- **Sin fecha:** las tareas sin `dueDate` no aparecen; banner "N tareas sin fecha →" que abre un panel lateral (arrastrables al calendario).
- **Día sobrecargado (>8):** celda scrollable interna + contador.
- **Barra multi-día que cruza semana:** se corta con indicador de continuación (◗ / ◖).
- **Carga:** grilla con celdas skeleton.
- **Zona horaria:** normalizar a la TZ del workspace; `dueDate` se compara por día local.

### Animation / Motion
| Elemento | Trigger | Animación | Duración | Easing |
|----------|---------|-----------|----------|--------|
| Cambio de mes | prev/next | slide horizontal | `--motion-base` | `--ease` |
| Chip | drop | encaje en la celda | `--motion-fast` | `--ease` |
| Popover | open | fade + scale desde el día | `--motion-fast` | `--ease` |

### Accessibility Notes
- `role="grid"` con `aria-label="Calendario, julio 2026"`; cada día `role="gridcell"` + `aria-selected`.
- Teclado: flechas mueven el día enfocado, `Enter` abre el día, `PageUp/Down` cambia mes.
- Alternativa no-drag: menú contextual "Mover a…" con date picker (drag no es accesible por teclado).
- Chips anuncian "{título}, vence {fecha}, estado {estado}".

---

## Handoff Spec 3 — Vista Cronograma (Gantt)

### Overview
Timeline horizontal: filas = tareas, eje X = tiempo. Cada barra va de `startDate` a `dueDate`. Muestra **dependencias** (flechas blocker→blocked) y permite mover/redimensionar barras. Es la vista más compleja: virtualizar y separar en dos paneles sincronizados.

### Layout
Split: panel izquierdo fijo (lista de tareas/secciones, ~280px) + panel derecho scrollable (timeline). Header de timeline con escala (día/semana/mes). Fila de `36px`. Scroll vertical sincronizado entre ambos paneles.

```
│ Tarea            │ Jul ─────────────────────────────► │
│ ▾ Sección A      │                                    │
│   Diseño API     │   ▓▓▓▓▓▓▓                           │
│   Backend        │        ▓▓▓▓▓▓▓▓▓▓  ◄─dep            │
│   QA             │                  ▓▓▓▓               │
```

### Design Tokens Used
| Token | Uso |
|-------|-----|
| `--brand-500` | barra por defecto; `--brand-600` al hover |
| `--status-blocked-fg` | barra/flecha de tareas bloqueadas |
| `--gray-200` | líneas de grilla vertical (días) y divisor de paneles |
| `--gray-100` | banda de fin de semana |
| `--radius-sm` | esquinas de barra |
| `--shadow-md` | barra en drag |
| `--space-1` | handles de resize |

### Components
| Componente | Variante | Props | Notas |
|-----------|----------|-------|-------|
| `GanttHeader` | day · week · month | `range, scale` | escala configurable |
| `GanttRow` | task · group | `task, pxPerDay` | left/width calculados de fechas |
| `GanttBar` | default · blocked · milestone | `task` | draggable + 2 resize handles |
| `DependencyArrow` | finish-to-start | `from, to` | SVG overlay; roja si genera ciclo |
| `TodayMarker` | — | — | línea vertical `--brand-500` |
| `LeftPane` | — | `groups` | reusa filas estilo Lista |

### States and Interactions
| Elemento | Estado | Comportamiento |
|----------|--------|----------------|
| Barra | hover | resalta + muestra handles ‖…‖ y tooltip de fechas |
| Barra | drag (cuerpo) | mueve `startDate` y `dueDate` juntos → `updateTask` |
| Barra | drag (handle) | redimensiona un extremo → cambia solo `startDate` **o** `dueDate` |
| Barra→Barra | drag desde borde | crea dependencia → `addDependency(blocker, blocked)` |
| Dependencia | crearía ciclo | flecha roja + toast "Dependencia circular no permitida" (backend rechaza) |
| Escala | day/week/month | recalcula `pxPerDay`; mantiene scroll centrado en hoy |

### Responsive Behavior
| Breakpoint | Cambios |
|------------|---------|
| Desktop (>1024px) | split completo con dependencias |
| Tablet (768–1024px) | panel izquierdo colapsable a solo-título |
| Mobile (<768px) | Gantt **no es apto**: redirigir a vista Lista con aviso "El cronograma requiere pantalla más ancha" |

### Edge Cases
- **Sin `startDate`:** barra de 1 día anclada en `dueDate` (estilo hito ◆). Sin ninguna fecha → fila visible en panel izq, sin barra, badge "Sin programar".
- **`dueDate` < `startDate`:** validar en cliente, bloquear el drop, barra roja temporal.
- **Rango enorme (años):** virtualización horizontal (renderizar solo el viewport ± buffer).
- **Muchas dependencias:** atenuar flechas no relacionadas al hover de una tarea (focus mode).
- **Carga:** barras skeleton con ancho aleatorio.
- **Conflicto de versión:** al soltar, si `version` quedó vieja → refetch de la fila y reintento.

### Animation / Motion
| Elemento | Trigger | Animación | Duración | Easing |
|----------|---------|-----------|----------|--------|
| Barra | drop | encaje a la grilla de día | `--motion-fast` | `--ease` |
| Cambio de escala | toggle | interpolación de `pxPerDay` | `--motion-base` | `--ease` |
| Dependencia | crear | flecha se dibuja (stroke-dashoffset) | `--motion-base` | `--ease` |
| Fila | expand grupo | reflow vertical | `--motion-base` | `--ease` |

### Accessibility Notes
- Gantt es intrínsecamente visual: proveer **tabla equivalente** accesible (fechas inicio/fin y "bloquea a / bloqueada por") togglable.
- Barras `role="img"` con `aria-label="{título}: {inicio} a {fin}, bloquea a {N} tareas"`.
- Teclado: seleccionar barra con Tab; `←/→` mueve 1 día, `Shift+←/→` redimensiona; dependencias se gestionan desde un menú "Añadir dependencia" (no solo drag).
- `prefers-reduced-motion`: desactivar interpolaciones de escala y dibujo de flechas.

---

## Resumen de dependencias nuevas a instalar
| Paquete | Para |
|---------|------|
| `@tanstack/react-virtual` | virtualización de filas (Lista, Gantt) |
| `date-fns` | cálculo de rangos y grillas (Calendario, Gantt) |
| `socket.io-client` | tiempo real (patch por `id` en las tres vistas) |

## Orden de implementación sugerido
1. **Lista** (menor riesgo, reusa Row/InlineEdit; base de patrones de edición).
2. **Calendario** (drag ya resuelto con @dnd-kit; introduce `date-fns`).
3. **Gantt** (mayor complejidad: virtualización + dependencias + resize).

Cada vista se monta bajo `src/features/<vista>/` y se enruta en `App.tsx` como `/projects/:projectId/<vista>`, activando su botón en el switcher del `AppShell`.
