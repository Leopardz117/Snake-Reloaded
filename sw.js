// Snake Reloaded XR - offline cache. The page itself is fetched network-first (so a re-upload shows up at once); other files are stale-while-revalidate.
const CACHE = 'snake-reloaded-xr-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const page = req.mode === 'navigate' || url.pathname.endsWith('/index.html');
  e.respondWith(caches.open(CACHE).then(async cache => {
    if (page) {
      try { const res = await fetch(req, { cache: 'no-store' }); if (res && res.ok) cache.put(req, res.clone()); return res; }
      catch (_) { return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./index.html')) || Response.error(); }
    }
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  }));
});
