/* Lyukasora – Datenlader
 * Gehostet (http/https): lädt data/themen.json und data/bausteine.json per fetch.
 * Aus dem Ordner (file://): Browser blockieren fetch, deshalb werden data/themen.js und
 * data/bausteine.js nachgeladen, die dieselben Daten als Skript enthalten
 * (erzeugt mit tools/daten-aktualisieren.py).
 */
window.LYU = window.LYU || {};
window.LYU_DATEN = window.LYU_DATEN || {};

LYU.daten = (function () {
  'use strict';

  function ladeSkript(pfad) {
    return new Promise(function (aufloesen, ablehnen) {
      var s = document.createElement('script');
      s.src = pfad;
      s.onload = function () { aufloesen(); };
      s.onerror = function () { ablehnen(new Error('Skript nicht ladbar: ' + pfad)); };
      document.head.appendChild(s);
    });
  }

  function ladeJson(pfad) {
    return fetch(pfad, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(pfad + ': ' + r.status);
      return r.json();
    });
  }

  function laden() {
    var perFetch = location.protocol === 'http:' || location.protocol === 'https:';
    if (perFetch && typeof fetch === 'function') {
      return Promise.all([ladeJson('data/themen.json'), ladeJson('data/bausteine.json')])
        .then(function (arr) { return { themen: arr[0], bausteine: arr[1] }; })
        .catch(function () { return ladeAlsSkript(); });
    }
    return ladeAlsSkript();
  }

  function ladeAlsSkript() {
    return Promise.all([ladeSkript('data/themen.js'), ladeSkript('data/bausteine.js')]).then(function () {
      if (!window.LYU_DATEN.themen || !window.LYU_DATEN.bausteine) {
        throw new Error('Daten fehlen. data/themen.js und data/bausteine.js mit tools/daten-aktualisieren.py erzeugen.');
      }
      return { themen: window.LYU_DATEN.themen, bausteine: window.LYU_DATEN.bausteine };
    });
  }

  return { laden: laden };
})();
