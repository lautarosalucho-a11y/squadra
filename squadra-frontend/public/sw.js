// Service worker mínimo: su presencia habilita "Instalar / Agregar a inicio".
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// Passthrough: no interceptamos la red (la app necesita el backend en vivo).
self.addEventListener("fetch", () => {});
