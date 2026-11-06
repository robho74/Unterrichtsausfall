/* Lyukasora – PWA: Service Worker registrieren, Update-Hinweis, Installationshinweis.
 * Nur gehostet (http/https). Aus dem Ordner (file://) passiert hier nichts.
 */
window.LYU = window.LYU || {};

LYU.pwa = (function () {
  'use strict';

  var installEreignis = null;
  var aktualisierungAngefordert = false;

  function start() {
    if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('sw.js').then(function (reg) {
      if (reg.waiting) zeigeUpdate(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var neu = reg.installing;
        if (!neu) return;
        neu.addEventListener('statechange', function () {
          if (neu.state === 'installed') {
            if (navigator.serviceWorker.controller) zeigeUpdate(neu);
            else if (LYU.aktionen) LYU.aktionen.toast(LYU.T('offline_bereit'));
          }
        });
      });
    }).catch(function (e) { if (window.console) console.info('Service Worker nicht registriert:', e && e.message); });

    /* Neu laden nur, wenn der Nutzer „Neu laden“ gedrückt hat. Beim allerersten Besuch übernimmt der
     * Service Worker die Seite per clients.claim(); das darf die Seite nicht neu laden. */
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!aktualisierungAngefordert) return;
      aktualisierungAngefordert = false;
      location.reload();
    });

    window.addEventListener('beforeinstallprompt', function (ev) {
      ev.preventDefault();
      installEreignis = ev;
      zeigeInstallHinweis();
    });
  }

  function zeigeUpdate(worker) {
    var el = LYU.ui.el;
    var box = document.getElementById('toast');
    if (!box) return;
    while (box.firstChild) box.removeChild(box.firstChild);
    box.appendChild(el('span', { text: LYU.T('update_bereit') + ' ' }));
    box.appendChild(el('button', { type: 'button', class: 'link-btn', style: 'color: var(--marker); min-height: auto; padding: 0 0.25rem;', text: LYU.T('neu_laden'), onclick: function () { aktualisierungAngefordert = true; worker.postMessage({ typ: 'SKIP_WAITING' }); } }));
    box.classList.add('sichtbar');
    box.style.pointerEvents = 'auto';
  }

  function zeigeInstallHinweis() {
    var fuss = document.querySelector('.fuss');
    if (!fuss || document.getElementById('btn-installieren')) return;
    var b = LYU.ui.el('button', { type: 'button', id: 'btn-installieren', text: LYU.T('installieren'), onclick: function () {
      if (!installEreignis) return;
      installEreignis.prompt();
      installEreignis.userChoice.then(function () { installEreignis = null; b.remove(); });
    } });
    fuss.insertBefore(b, fuss.firstChild);
  }

  return { start: start };
})();
