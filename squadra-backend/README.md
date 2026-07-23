# Proyecto Squadra — Backend

Backend del sistema de gestión de proyectos colaborativa. Cubre el **modelo de datos (Prisma) con adaptaciones para clientes móviles**, su migración inicial verificada contra PostgreSQL, y la **aplicación NestJS con el módulo Tasks (GraphQL) de punta a punta**.

## Requisitos

- Node.js ≥ 18
- Docker (para PostgreSQL + Redis locales)

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Levantar PostgreSQL + Redis
docker compose up -d

# 3. Instalar dependencias
npm install

# 4. Aplicar la migración inicial
npx prisma migrate deploy      # aplica prisma/migrations
npx prisma generate            # genera el client tipado

# 5. (Opcional) datos de ejemplo
npm run prisma:seed

# 6. Levantar la API (GraphQL playground en http://localhost:3000/graphql)
npm run start:dev

# Explorar la BD
npx prisma studio
```

> Durante el desarrollo del schema usar `npx prisma migrate dev` (crea y aplica migraciones a partir de cambios en `schema.prisma`).

## Adaptaciones para móvil (offline-first)

El modelo está preparado para sincronización con apps móviles:

| Mecanismo | Implementación | Uso en el cliente |
|---|---|---|
| Delta-sync | `updatedAt` + índice `(workspaceId, updatedAt)` | pedir solo cambios: `WHERE updatedAt > lastSync` |
| Borrados sincronizables | `deletedAt` (soft-delete) | tombstones: el cliente sabe qué eliminar localmente |
| Conflictos offline | `version` (Int) | optimistic concurrency al reconciliar ediciones |
| Creación sin conexión | PK UUID | el cliente genera el ID antes de sincronizar |
| Push | tabla `devices` (FCM/APNs) | registro de token por dispositivo/plataforma |
| Checkpoint | tabla `sync_cursors` | punto de sync por dispositivo + workspace |

## Estructura

```
squadra-backend/
├── docker-compose.yml          # PostgreSQL 16 + Redis 7
├── .env.example
├── nest-cli.json · tsconfig.json · package.json
├── prisma/
│   ├── schema.prisma           # 20 modelos, 5 enums
│   ├── seed.js
│   └── migrations/20260722000000_init/migration.sql
└── src/
    ├── main.ts                 # bootstrap NestJS + ValidationPipe
    ├── app.module.ts           # GraphQL (Apollo, code-first) + módulos
    ├── prisma/                 # PrismaModule + PrismaService (global)
    ├── common/                 # ordering (posición fraccional), scalars
    └── modules/tasks/          # módulo Tasks de punta a punta
        ├── models/task.model.ts        # ObjectType + enum TaskStatus
        ├── dto/                        # Create / Update / Move / Filter inputs
        ├── tasks.service.ts            # lógica: CRUD, move, deps, delta-sync
        ├── tasks.resolver.ts           # queries + mutations + subtasks
        └── tasks.module.ts
```

## Módulo Tasks — operaciones GraphQL

| Operación | Tipo | Nota |
|---|---|---|
| `task(id)` | query | tarea por id |
| `projectTasks(projectId, filter, groupBy)` | query | fuente única de las 4 vistas; `groupBy: SECTION` = Kanban |
| `createTask(input)` | mutation | acepta `id` UUID generado en el móvil (offline) |
| `updateTask(id, input)` | mutation | `expectedVersion` → control de concurrencia optimista |
| `moveTask(input)` | mutation | reordena con posición fraccional entre vecinos |
| `deleteTask(id)` | mutation | soft-delete (tombstone) |
| `addDependency(blockerId, blockedId)` | mutation | dependencia entre tareas |

El filtro `updatedSince` habilita el **delta-sync**: devuelve solo cambios posteriores e **incluye tombstones** para que el cliente elimine localmente. Todas las operaciones de Tasks requieren token (guard JWT); el actor se toma del token.

## Módulo Auth (JWT)

| Operación | Tipo | Nota |
|---|---|---|
| `register(input)` | mutation | crea usuario (bcrypt) y emite tokens |
| `login(input)` | mutation | valida credenciales, emite tokens |
| `refresh(refreshToken)` | mutation | rotación: revoca el usado y emite uno nuevo |
| `logout(refreshToken)` | mutation | revoca el refresh token |
| `me` | query | protegido; devuelve el usuario del token |

`AuthPayload = { accessToken, refreshToken, user }`. El access token es JWT de vida corta (`JWT_EXPIRES_IN`, def. 15m); el refresh dura 30 días, se guarda **hasheado** (SHA-256) en `refresh_tokens` y es revocable — apto para sesiones móviles multi-dispositivo. Configurar `JWT_SECRET` en `.env`.

Para llamar a operaciones protegidas: header `Authorization: Bearer <accessToken>`.

## Módulo Projects (+ Sections)

| Operación | Tipo | Nota |
|---|---|---|
| `projects(workspaceId, includeArchived)` | query | proyectos del workspace |
| `project(id)` | query | proyecto por id |
| `sections(projectId)` | query | columnas del tablero, ordenadas |
| `createProject` / `updateProject` / `deleteProject` | mutation | CRUD; delete = soft-delete, update controla `archived` y `defaultView` |
| `createSection` / `moveSection` / `deleteSection` | mutation | secciones con orden fraccional (drag de columnas) |

## Módulo CustomFields

| Operación | Tipo | Nota |
|---|---|---|
| `projectCustomFields(projectId)` | query | definiciones de campos del proyecto |
| `taskCustomFieldValues(taskId)` | query | valores de una tarea |
| `createCustomField` | mutation | `text` / `number` / `dropdown` (dropdown exige `options`) |
| `deleteCustomField` | mutation | soft-delete de la definición |
| `setCustomFieldValue` | mutation | upsert del valor, **validado contra el tipo** del campo |

Los valores se guardan como JSON tipado: `{ text }`, `{ number }` o `{ optionId }`.

## Tiempo real (WebSocket)

Gateway Socket.IO desacoplado del dominio vía bus de eventos (EventEmitter2):

```
mutación (TasksService) → emit('task.changed')
        → RealtimeGateway (@OnEvent) → server.to('project:{id}').emit('taskChanged')
        → [adapter Redis] → todas las instancias → sockets del room
```

- **Autenticación:** el handshake exige el mismo JWT que la API (`auth: { token }` o `?token=`); sin token válido, se rechaza la conexión.
- **Rooms:** el cliente emite `joinProject`/`leaveProject` con el `projectId`; los eventos se acotan a ese room.
- **Escalado horizontal:** con `REDIS_URL` se activa `@socket.io/redis-adapter` → el broadcast llega a los sockets de todas las instancias. Sin Redis, funciona en modo single-instance (dev).
- **Evento emitido:** `taskChanged { type: created|updated|moved|deleted, projectId, taskId, actorId, task?, at }`.

Ejemplo de cliente:

```js
const socket = io('http://localhost:3000', { auth: { token: accessToken } });
socket.emit('joinProject', projectId);
socket.on('taskChanged', (ev) => applyChange(ev)); // reconciliar caché local
```

## Verificación realizada

- **Base de datos:** las 2 migraciones (init + auth) se aplican en orden contra un PostgreSQL real, sin errores. Init: 20 tablas, 5 enums, 38 FKs, 56 índices. Auth: `users.passwordHash` + tabla `refresh_tokens`. Smoke tests OK (jerarquía, delta-sync, soft-delete, CTE recursivo, FKs, alta de refresh token).
- **Backend:** `tsc --noEmit` pasa sin errores sobre toda la app NestJS (Auth, Projects, CustomFields, Tasks, Realtime; guard JWT global; bus de eventos).
- **Tiempo real:** test runtime del gateway (server + clientes Socket.IO) → el broadcast llega solo al room del proyecto suscrito (0 fugas a clientes fuera del room).

## Módulos Notifications y Automations

Ambos se suscriben a `task.changed` vía EventEmitter2 (sin acoplarse a Tasks):

- **Notifications:** crea filas en `notifications` para el responsable y los seguidores (nunca al propio actor), emite `notification.created` → el gateway hace push al room personal `user:{id}` (`inboxUpdated`). Queries `inbox`, `markNotificationRead`, `markAllNotificationsRead`. Push a `devices` (FCM/APNs) queda como TODO.
- **Automations (motor de reglas):** evalúa `trigger → conditions → actions` sobre las reglas activas del proyecto. Acciones: `reassign`, `move_to_section`, `set_status`, `add_comment`. Los cambios que aplica se reemiten con `source: 'automation'` para **no reprocesarse** (anti-bucle). CRUD: `projectRules`, `createRule`, `setRuleEnabled`, `deleteRule`.
- **Reminders (BullMQ):** job repetible (cada hora, `jobId` idempotente) que escanea tareas con vencimiento dentro de 24h (no completadas, con responsable) y crea notificaciones `due_soon`, con dedup para no repetir el aviso. Usa `REDIS_URL`.

## Vista previa

`squadra-preview.html` (en la raíz de la carpeta) es un prototipo visual navegable del producto: tablero Kanban con secciones, campos personalizados, Inbox y una simulación del pipeline de tiempo real + la automatización. Se abre en el navegador, sin servidor.

## Estado del backend

Núcleo completo y con typecheck limpio (9 módulos): **Auth · Projects · Sections · CustomFields · Tasks · Realtime · Notifications · Automations · Reminders**. Cubre jerarquía, motor de tareas (subtareas, dependencias, custom fields), 4 vistas, colaboración/auditoría, sync móvil, tiempo real, inbox, reglas y recordatorios.

## Próximo paso

**Frontend React** (Vite + TS + TanStack Query + urql) consumiendo estos contratos GraphQL + WebSocket, empezando por la vista Tablero.
