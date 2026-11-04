/* Service worker voor installeerbaarheid. Bewaart bewust NIETS in de cache:
   persoonlijke gegevens blijven zo uitsluitend op de server en verdwijnen niet op een gedeeld toestel. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => e.request.mode === 'navigate'
    ? new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui;background:#0e0e0e;color:#f5f1ea;display:grid;place-items:center;height:100vh;margin:0;text-align:center"><p>Geen verbinding.<br>Probeer het zo opnieuw.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    : Response.error()));
});
