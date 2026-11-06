/* Lyukasora – Service Worker
 * Speichert die App-Dateien für die Offline-Nutzung. Bei einer neuen Version (VERSION ändern)
 * wird der Cache erneuert; die Seite zeigt einen Hinweis „Neue Version verfügbar“.
 */
var VERSION = 'lyukasora-v1.0.4';
var DATEIEN = [
  './',
  'index.html',
  'css/app.css',
  'js/filter.js', 'js/daten.js', 'js/assembler.js', 'js/texte.js', 'js/ui.js', 'js/aktionen.js', 'js/einstellungen.js', 'js/pwa.js', 'js/app.js',
  'js/module/schluessel.js', 'js/module/labor.js',
  'data/themen.json', 'data/bausteine.json', 'data/themen.js', 'data/bausteine.js',
  'fonts/BricolageGrotesque-latin.woff2', 'fonts/BricolageGrotesque-latin-ext.woff2',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'manifest.webmanifest',
  'lernverstaerker.pdf'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(
    caches.open(VERSION).then(function (cache) {
      /* Einzeln laden, damit eine fehlende Datei nicht die ganze Installation verhindert */
      return Promise.all(DATEIEN.map(function (d) {
        return cache.add(d).catch(function () { /* optional */ });
      }));
    })
  );
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (ev) {
  if (ev.data && ev.data.typ === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (ev) {
  var url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.origin !== self.location.origin) return;
  /* Daten: erst Netz (frische Themen), dann Cache. Alles andere: erst Cache, dann Netz. */
  if (url.pathname.indexOf('/data/') !== -1) {
    ev.respondWith(
      fetch(ev.request).then(function (antwort) {
        var kopie = antwort.clone();
        caches.open(VERSION).then(function (c) { c.put(ev.request, kopie); });
        return antwort;
      }).catch(function () { return caches.match(ev.request); })
    );
    return;
  }
  ev.respondWith(
    caches.match(ev.request, { ignoreSearch: true }).then(function (treffer) {
      if (treffer) return treffer;
      return fetch(ev.request).then(function (antwort) {
        if (antwort && antwort.ok) {
          var kopie = antwort.clone();
          caches.open(VERSION).then(function (c) { c.put(ev.request, kopie); });
        }
        return antwort;
      }).catch(function () {
        if (ev.request.mode === 'navigate') return caches.match('index.html');
        return new Response('', { status: 504 });
      });
    })
  );
});
