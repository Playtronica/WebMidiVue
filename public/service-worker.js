const CACHE_PREFIX = 'playtronica-settings-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.ico'];

async function precacheApp() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(APP_SHELL);
  const response = await fetch('./index.html');
  const html = await response.text();
  const assetPaths = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map((match) => match[1])
    .filter((path) => !path.startsWith('http'));
  await cache.addAll([...new Set(assetPaths)]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheApp());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
