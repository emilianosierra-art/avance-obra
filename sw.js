// Avance de Obra: guarda la app en el celular para que abra rápido.
// - La app (index.html) y las librerías se sirven de lo guardado y se actualizan por detrás.
// - Si la app cambió, avisa a la página ("Hay una versión nueva") para recargar.
// - Los datos (Supabase) NUNCA se guardan acá: siempre van a la red.
const CACHE = "avance-obra-1";
const LIBS = /(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

async function avisar() {
  for (const c of await self.clients.matchAll({ type: "window" })) c.postMessage({ tipo: "nueva" });
}

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.hostname.endsWith("supabase.co")) return;                 // datos: siempre de la red
  const app = r.mode === "navigate" && u.origin === location.origin;
  const lib = LIBS.test(u.hostname);
  if (!app && !lib && u.origin !== location.origin) return;

  if (app) {
    // la página: se guarda sin el ?local=… (el QR sigue funcionando, lo lee la app)
    const key = u.origin + u.pathname;
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const vieja = await c.match(key);
      const ant = vieja ? await vieja.clone().text() : null;
      const red = fetch(u.href, { cache: "no-cache", credentials: "same-origin" }).then(async resp => {
        if (resp.ok) {
          const nueva = await resp.clone().text();
          if (ant !== nueva) { await c.put(key, resp.clone()); if (ant !== null) avisar(); }
        }
        return resp;
      });
      if (vieja) { e.waitUntil(red.catch(() => {})); return vieja; }
      return red;
    })());
    return;
  }

  // librerías y archivos propios: lo guardado al instante, y se refresca por detrás
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const g = await c.match(r);
    const red = fetch(r).then(resp => { if (resp.ok || resp.type === "opaque") c.put(r, resp.clone()); return resp; });
    if (g) { e.waitUntil(red.catch(() => {})); return g; }
    return red;
  })());
});
