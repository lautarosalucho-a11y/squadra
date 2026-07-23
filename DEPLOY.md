# Squadra — Despliegue (Railway + Vercel)

Arquitectura de producción:

- **Railway** → backend NestJS + **Postgres** + **Redis** (WebSockets y BullMQ funcionan nativamente).
- **Vercel** → frontend Vite/React (estático).

Orden recomendado: **1) Railway** (obtener la URL del backend) → **2) Vercel** (apuntar a esa URL) → **3)** setear `FRONTEND_ORIGIN` en Railway con el dominio de Vercel.

---

## 1. Railway — Backend + Postgres + Redis

1. **New Project** → **Deploy from GitHub repo** (o subí `squadra-backend`).
2. Si el repo contiene backend y frontend juntos: en el servicio, **Settings → Root Directory = `squadra-backend`**.
3. Agregá los datastores al proyecto: **New → Database → Add PostgreSQL** y **New → Database → Add Redis**.
4. En el **servicio del backend**, pestaña **Variables**, definí:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia al plugin) |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | un secreto fuerte (p. ej. `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `15m` |
| `FRONTEND_ORIGIN` | (se completa en el paso 3, con el dominio de Vercel) |

> `PORT` lo inyecta Railway automáticamente; el server ya escucha en `0.0.0.0:$PORT`.

5. **Deploy.** El pipeline (definido en `railway.json` + `package.json`) hace:
   - `npm install` → `postinstall` corre `prisma generate`.
   - `npm run build` (Nixpacks) → compila NestJS.
   - **preDeploy**: `npm run release` → `prisma migrate deploy` (aplica migraciones).
   - **start**: `npm run start:prod` → `node dist/main.js`.
6. **Generá el dominio público:** servicio → **Settings → Networking → Generate Domain**. Anotá la URL, p. ej. `https://squadra-backend-production.up.railway.app`.
7. **Seed (opcional, una vez):** desde tu máquina con la CLI de Railway:
   ```bash
   railway run npm run prisma:seed
   ```
   Imprime credenciales de prueba (`ana@acme.com` / `squadra1234`) y el `projectId`.

---

## 2. Vercel — Frontend

1. **Add New → Project** → importá el repo. Framework: **Vite** (autodetectado).
2. Si el repo es monorepo: **Root Directory = `squadra-frontend`**.
3. **Environment Variables** (Production y Preview):

| Variable | Valor |
|----------|-------|
| `VITE_GRAPHQL_URL` | `https://<tu-dominio-railway>/graphql` |

4. **Deploy.** `vercel.json` ya define el build (`dist`) y los **rewrites SPA** (todas las rutas → `index.html`), necesarios para el router del cliente.
5. El WebSocket se conecta solo: el cliente deriva el host del `VITE_GRAPHQL_URL` (mismo dominio Railway, `wss://`).

---

## 3. Cerrar el CORS

1. Copiá el dominio de Vercel (p. ej. `https://squadra.vercel.app`).
2. En Railway → variable `FRONTEND_ORIGIN` = ese dominio (podés listar varios separados por coma, incl. dominios de preview).
3. Railway redeploya el backend. Listo: el frontend en Vercel ya puede hablar con la API y el WebSocket.

---

## Checklist de verificación

- [ ] `https://<railway>/graphql` abre el **playground** de Apollo.
- [ ] Login con el usuario del seed entra y redirige al primer proyecto (`myProjects`).
- [ ] Abriendo dos pestañas, los cambios (tareas, inbox, comentarios) se ven **en vivo** (WebSocket OK).
- [ ] Recargar en una ruta profunda (p. ej. `/projects/<id>/timeline`) no da 404 (rewrites OK).

## Notas

- **Redis es obligatorio**: lo usan los recordatorios `due_soon` (BullMQ) y el adapter de Socket.IO para broadcast multi-instancia.
- Para **escalar a varias réplicas** del backend, el adapter Redis ya está integrado (se activa con `REDIS_URL` presente).
- **Migraciones nuevas**: al hacer push, el `preDeployCommand` corre `prisma migrate deploy` automáticamente.
- Endurecer para prod (opcional): poner `playground: false` e `introspection: false` en `GraphQLModule`, y restringir el CORS del gateway de WebSocket (`realtime.gateway.ts`, hoy `origin: '*'`) al dominio de Vercel.
