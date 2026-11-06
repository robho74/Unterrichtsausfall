/* Lyukasora – Start */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function bindeKopfUndFuss(E) {
    $('btn-einstellungen').addEventListener('click', function () {
      LYU.einstellungen.dialog(E, !!E.lehrkraft, function (neu) {
        LYU.ui.setzeLehrkraft(!!neu.lehrkraft);
      });
    });
    $('btn-gemerkt').addEventListener('click', function () { LYU.aktionen.gemerktDialog(!!E.lehrkraft); });
    $('marke').addEventListener('click', function (ev) { ev.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

    ['dlg-datenschutz', 'dlg-ueber'].forEach(function (id) {
      var d = $(id);
      d.quererySelector = null;
      d.querySelector('.dlg-schliessen').addEventListener('click', function () { d.close(); });
      d.addEventListener('click', function (ev) { if (ev.target === d) d.close(); });
    });
    $('btn-datenschutz').addEventListener('click', function () { $('dlg-datenschutz').showModal(); });
    $('btn-ueber').addEventListener('click', function () { $('dlg-ueber').showModal(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var E = LYU.einstellungen.laden();
    LYU.einstellungen.darstellungAnwenden(E);
    LYU.daten.laden().then(function (d) {
      LYU.ui.start(d.themen, d.bausteine, E);
      bindeKopfUndFuss(E);
      var v = $('version-hinweis');
      if (v && d.themen.stand) v.textContent = 'Themenstand ' + d.themen.stand;
      if (LYU.pwa) LYU.pwa.start();
    }).catch(function (fehler) {
      var main = $('hauptinhalt');
      var p = document.createElement('p');
      p.className = 'hinweis';
      p.textContent = LYU.T('fehler_daten') + ' (' + (fehler && fehler.message ? fehler.message : fehler) + ')';
      main.insertBefore(p, main.firstChild);
      if (window.console) console.error(fehler);
    });
  });
})();
