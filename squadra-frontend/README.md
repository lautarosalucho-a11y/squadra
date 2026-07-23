# Squadra — Frontend

Frontend de Squadra (gestor de proyectos tipo Asana). React + TypeScript, construido sobre el design system documentado en [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

## Stack
- **Vite + React 18 + TypeScript** (strict).
- **urql** — cliente GraphQL contra el backend NestJS (auth Bearer + logout automático).
- **TanStack Query** — provider listo para estado async no-GraphQL.
- **@dnd-kit/core** — drag & drop del Tablero.
- **react-router-dom** — ruteo y rutas protegidas.

## Arquitectura (modular por feature)
```
src/
  styles/        tokens.css (fuente de verdad) + global.css
  components/
    ui/          design system: Button, Input, StatusPill, Avatar, Card
    layout/      AppShell (sidebar + switcher de vistas)
  features/
    auth/        LoginPage
    board/        Vista Tablero: BoardView · BoardColumn · TaskCard
  graphql/       operations.ts (queries/mutations tipadas)
  lib/           urql.ts (cliente) · auth.ts (tokens)
  types.ts       modelo compartido (Task, TaskStatus…)
```
Cada vista nueva (Lista, Calendario, Gantt) se agrega bajo `features/` consumiendo `projectTasks` con distinto `groupBy`.

## Puesta en marcha
```bash
npm install
cp .env.example .env      # apuntar VITE_GRAPHQL_URL al backend
npm run dev               # http://localhost:5173
```
Requiere el backend `squadra-backend` corriendo (GraphQL en `:3000/graphql`).

## Cómo probar (end-to-end, local)
1. **Backend** (`squadra-backend/`): `cp .env.example .env` · `npm install` · `npm run db:up` (Postgres + Redis por Docker) · `npm run prisma:generate` · `npm run prisma:migrate` · `npm run prisma:seed` · `npm run start:dev`.
   El seed imprime las credenciales y el `projectId`.
2. **Frontend** (esta carpeta): `npm install` · `cp .env.example .env` · `npm run dev` → abrir `http://localhost:5173`.
3. **Login de prueba (del seed):** `ana@acme.com` / `squadra1234`. Tras entrar, el frontend resuelve tu primer proyecto real (`myProjects`) y te lleva a su Tablero; el sidebar lista tus proyectos.
4. **Tiempo real:** abrí la app en dos pestañas y verás cambios (tareas, inbox, comentarios) reflejarse al instante.

## Scripts
- `npm run dev` — servidor de desarrollo.
- `npm run build` — typecheck + build de producción.
- `npm run typecheck` — solo verificación de tipos.

## Estado
- ✅ Design system (tokens + 5 componentes base con a11y).
- ✅ Auth (login) + rutas protegidas.
- ✅ **Home "Mis tareas"** (`/`): saludo por horario, resumen (finalizadas/asignadas) y tabs **Próximas / Con retraso / Finalizadas** con tus tareas de **todos los proyectos** (`myTasks`), completar inline y chip del proyecto. Estilo Asana.
- ✅ **Página Proyectos** (`/projects`): listado (nombre, vista por defecto, última modificación), **buscador** por nombre y **+ Crear proyecto** (modal → `createProjectForMe` → entra al proyecto nuevo). Link en el sidebar.
- ✅ **Página Portafolios** (`/portfolios`): crear portafolios (`createPortfolioForMe`), proyectos agrupados por portafolio (+ "Sin portafolio"), y **asignar cada proyecto a un portafolio** desde un selector (`setProjectPortfolio`). Link en el sidebar.
- ✅ **Estrategia · Objetivos** (`/goals`): crear objetivos, tarjetas con **estado** (En curso / En riesgo / Desviado / Logrado) y **barra de progreso editable** (slider 0–100), progreso promedio, eliminar. Módulo Goals nuevo en backend (`myGoals`/`createGoal`/`updateGoal`/`deleteGoal`). Link 🎯 en el sidebar.

> **Migración pendiente:** Objetivos agrega la tabla `goals` (schema + migración `20260723000000_goals`). Antes de usarlo, corré en el backend: `npm run prisma:generate` y `npm run prisma:migrate` (o `prisma migrate deploy` en prod).
- ✅ Vista **Tablero** (Kanban) con drag entre secciones y update optimista (`moveTask`).
- ✅ Vista **Lista** tipo planilla (estilo Asana): columnas **configurables** (mostrar/ocultar, persistidas por proyecto), **columnas de campos personalizados** (text/number/dropdown, editables inline vía `setCustomFieldValue`), columna **Descripción**, y **barra Filtrar / Ordenar / Agrupar** (por sección o responsable). Más subtareas anidadas, completar/crear, edición inline de estado/responsable/fecha y **drag para reordenar** (en modo Sección). Bloqueo optimista (`expectedVersion`).
- ✅ **Tiempo real** vía Socket.IO: handshake JWT, room `project:{id}`, evento `taskChanged` → refetch en Lista y Tablero, indicador "En vivo" en el header.
- ✅ **Inbox** de notificaciones: campana con badge de no leídas, panel con lista tipada (assignment, mention, due_soon…), marcar leída/todas, push en vivo por `inboxUpdated`.
- ✅ Vista **Calendario** (mensual): grilla con `date-fns`, chips por `dueDate`, **drag para reprogramar** (preserva duración si hay `startDate`), bandeja "Sin fecha", marcador de hoy, navegación de mes, sincronización en vivo.
- ✅ Vista **Cronograma (Gantt)**: split panel, escala Día/Semana, barras `startDate`→`dueDate` con **drag para mover y resize**, **flechas de dependencias** (blocker→blocked) y creación de dependencias por dos clics, marcador de hoy, bandas de fin de semana, en vivo.
- ✅ **Comentarios por tarea**: panel de detalle lateral (abrible desde Lista y Tablero con 💬), hilo cronológico con **rich text markdown** (negrita/itálica/código/links, renderer seguro) + toolbar, **composer con autocompletado de @menciones**, notifica a mencionados/responsable (Inbox) y **push en vivo** por `commentAdded`.
- ✅ **Gantt virtualizado**: sólo se renderizan las filas visibles según el scroll (ventana + buffer), para proyectos con muchas tareas.
- ⏭️ Próximo (opcional): virtualización de la Lista; edición de comentarios; adjuntos.

> Backend añadido en esta fase: `UpdateTaskInput` con `startDate`/`dueDate`; query `projectDependencies` (Gantt); **módulo Comments** (`taskComments`, `addComment` + evento `commentAdded`); query `projectMembers` (autocompletado de menciones).

## Tiempo real
`src/lib/socket.ts` mantiene un socket singleton autenticado con el `accessToken`. El hook
`useProjectRealtime(projectId, { onChange })` une al room del proyecto, escucha `taskChanged`
(con debounce y supresión de ecos propios) y refresca la vista. `useSocketStatus()` alimenta el
indicador global de conexión. Requiere el gateway del backend activo (y Redis para multi-instancia).
