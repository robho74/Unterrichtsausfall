/* Lyukasora – Aktionen: Kopieren, Direktöffnen, Merken, Dialoge, Hinweise */
window.LYU = window.LYU || {};

LYU.aktionen = (function () {
  'use strict';

  /* Direktöffnen-Dienste. Nur Einträge, die bei der Prüfung am 28.09.2026 den Prompt tatsächlich
   * übernommen haben (siehe README, Abschnitt Deep-Link-Prüfung). {prompt} wird URL-kodiert ersetzt.
   * sendet: true = der Dienst schickt den Prompt sofort ab; false = er steht im Eingabefeld.
   * standard: false = erst in den Einstellungen einschalten.
   * Claude (06.11.2026 ergänzt) ist noch nicht im Browser geprüft. Ohne Anmeldung zeigt claude.ai
   * die Login-Seite und der Prompt geht meist verloren – dann „Prompt kopieren“ nutzen. */
  var ANBIETER = [
    { id: 'claude', name: 'Claude', url: 'https://claude.ai/new?q={prompt}', alter: 'ab 18, Konto nötig', sendet: false, standard: true, maxZeichen: 6000, konto: true },
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/?q={prompt}', alter: 'ab 13, unter 18 mit Erlaubnis der Eltern', sendet: true, standard: true, maxZeichen: 6000, konto: false },
    { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q={prompt}', alter: 'ab 13, unter 18 mit Erlaubnis der Eltern', sendet: true, standard: false, maxZeichen: 6000, konto: false },
    { id: 'duckai', name: 'Duck.ai', url: 'https://duckduckgo.com/?q={prompt}&ia=chat&duckai=1', alter: 'ohne Konto, anonym', sendet: false, standard: false, maxZeichen: 6000, konto: false },
    { id: 'bing', name: 'Copilot-Suche (Bing)', url: 'https://www.bing.com/copilotsearch?q={prompt}', alter: 'ohne Konto', sendet: true, standard: false, maxZeichen: 6000, konto: false },
    { id: 'grok', name: 'Grok', url: 'https://grok.com/?q={prompt}', alter: 'ab 13 mit Eltern, keine Alterskontrolle', sendet: false, standard: false, maxZeichen: 6000, konto: false }
  ];
  var URL_GRENZE = 6000;

  var el = function () { return LYU.ui.el.apply(null, arguments); };
  function $(id) { return document.getElementById(id); }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(text, dauer) {
    var box = $('toast');
    if (!box) return;
    box.textContent = text;
    box.classList.add('sichtbar');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('sichtbar'); }, dauer || 2600);
  }

  /* ---------- Kopieren ---------- */
  function kopieren(text, knopf, okText, fehlerText, fallbackFeld) {
    function erfolg() {
      if (knopf) {
        var alt = knopf.textContent;
        knopf.textContent = okText || 'Kopiert';
        knopf.classList.add('ok');
        setTimeout(function () { knopf.textContent = alt; knopf.classList.remove('ok'); }, 1800);
      }
      toast(okText || 'Kopiert');
    }
    function fallback() {
      var ta = fallbackFeld;
      var temporaer = false;
      if (!ta) {
        ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta);
        temporaer = true;
      } else {
        ta.hidden = false;
      }
      ta.focus(); ta.select();
      try { ta.setSelectionRange(0, ta.value.length); } catch (e) { /* egal */ }
      var ok = false;
      try { ok = document.execCommand && document.execCommand('copy'); } catch (e) { ok = false; }
      if (temporaer) document.body.removeChild(ta);
      if (ok) { erfolg(); if (!temporaer) ta.hidden = true; }
      else { toast(fehlerText || 'Kopieren nicht möglich. Text ist markiert.', 5000); }
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(erfolg, fallback);
    } else {
      fallback();
    }
  }

  /* ---------- Direktöffnen ---------- */
  function anbieterListe() { return ANBIETER.slice(); }

  function anbieterAktiv(a, E) {
    if (E && E.anbieterAn && E.anbieterAn[a.id] !== undefined) return !!E.anbieterAn[a.id];
    return !!a.standard;
  }

  function linkFuer(urlVorlage, text) {
    return urlVorlage.split('{prompt}').join(encodeURIComponent(text));
  }

  function renderOeffnen(container, text, E, L) {
    var T = LYU.T;
    while (container.firstChild) container.removeChild(container.firstChild);
    container.appendChild(el('h3', { class: 'block-titel', text: T('oeffnen_titel', L) }));
    var liste = el('div', { class: 'oeffnen-liste' });
    var zuLang = text.length > URL_GRENZE;

    /* Schul-Chatbot zuerst */
    if (E && E.schulbot && E.schulbot.url && /^https?:\/\//i.test(E.schulbot.url)) {
      var name = E.schulbot.name || T('einst_schulbot_titel', L);
      var hatPlatzhalter = E.schulbot.url.indexOf('{prompt}') !== -1;
      var href = hatPlatzhalter && !zuLang ? linkFuer(E.schulbot.url, text) : E.schulbot.url.split('{prompt}').join('');
      var a = el('a', { class: 'btn btn-oeffnen schulbot', href: href, target: '_blank', rel: 'noopener noreferrer' }, [
        el('span', { class: 'btn-text', text: T('oeffnen_in', L, { name: name }) }),
        el('span', { class: 'btn-sub', text: hatPlatzhalter && !zuLang ? T('oeffnen_hinweis', L).split('.')[0] : T('oeffnen_kopiert_dann', L, { name: name }) })
      ]);
      if (!(hatPlatzhalter && !zuLang)) {
        a.addEventListener('click', function () { kopieren(text, null, T('oeffnen_kopiert_dann', L, { name: name })); });
      }
      liste.appendChild(a);
    }

    /* Eigener Schlüssel: direkt hier ausführen */
    if (E && E.schluessel && E.schluessel.key) {
      liste.appendChild(el('button', { type: 'button', class: 'btn btn-oeffnen schluessel', onclick: function () { LYU.einstellungen.modulLaden('schluessel', function () { LYU.schluessel.oeffnen(E, text); }); } }, [
        el('span', { class: 'btn-text', text: 'Hier im Werkzeug ausführen' }),
        el('span', { class: 'btn-sub', text: 'mit eigenem Schlüssel (' + (E.schluessel.anbieter || '') + ')' })
      ]));
    }

    ANBIETER.forEach(function (a) {
      if (!anbieterAktiv(a, E)) return;
      var passt = text.length <= Math.min(a.maxZeichen || URL_GRENZE, URL_GRENZE);
      if (!passt) return;
      var link = el('a', { class: 'btn btn-oeffnen', href: linkFuer(a.url, text), target: '_blank', rel: 'noopener noreferrer' }, [
        el('span', { class: 'btn-text', text: T('oeffnen_in', L, { name: a.name }) }),
        el('span', { class: 'btn-sub', text: a.alter + (a.sendet ? ' · ' + T('oeffnen_sendet', L) : '') })
      ]);
      liste.appendChild(link);
    });

    container.appendChild(liste);
    var anzahlExtern = liste.querySelectorAll('a:not(.schulbot)').length;
    if (zuLang || anzahlExtern === 0) container.appendChild(el('p', { class: 'hinweis', text: zuLang ? T('oeffnen_zu_lang', L) : T('oeffnen_hinweis', L) }));
    else container.appendChild(el('p', { class: 'hinweis sanft', text: T('oeffnen_hinweis', L) }));
  }

  /* ---------- Dialoge ---------- */
  function dialog(inhaltKinder, klasse) {
    var alt = document.querySelector('dialog.dyn');
    if (alt) { try { alt.close(); } catch (e) { /* egal */ } alt.remove(); }
    var d = el('dialog', { class: 'dialog dyn ' + (klasse || '') }, inhaltKinder);
    document.body.appendChild(d);
    d.addEventListener('close', function () { setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 50); });
    d.addEventListener('click', function (ev) { if (ev.target === d) d.close(); });
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    return d;
  }

  function bestaetigen(text, ja, abbrechen) {
    return new Promise(function (aufloesen) {
      var d;
      d = dialog([
        el('p', { class: 'dialog-text', text: text }),
        el('div', { class: 'dialog-knoepfe' }, [
          el('button', { type: 'button', class: 'btn', text: abbrechen, onclick: function () { aufloesen(false); d.close(); } }),
          el('button', { type: 'button', class: 'btn primaer', text: ja, onclick: function () { aufloesen(true); d.close(); } })
        ])
      ], 'klein');
      d.addEventListener('close', function () { aufloesen(false); });
    });
  }

  /* ---------- Merken ---------- */
  var SCHLUESSEL = 'lyu.gemerkt';
  var MAX = 30;

  function gemerktLaden() {
    try { var raw = localStorage.getItem(SCHLUESSEL); var arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
  }
  function gemerktSpeichern(arr) {
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(arr.slice(0, MAX))); return true; } catch (e) { return false; }
  }
  function merken(titel, ergebnis, meta) {
    var arr = gemerktLaden();
    arr.unshift({ id: String(Date.now()), titel: titel, text: ergebnis.text, anschluss: ergebnis.anschluss, meta: meta, zeit: new Date().toISOString() });
    return gemerktSpeichern(arr);
  }
  function loeschen(id) {
    gemerktSpeichern(gemerktLaden().filter(function (e) { return e.id !== id; }));
  }

  function merkenDialog(vorschlag, ergebnis, meta, L) {
    var T = LYU.T;
    var inp = el('input', { type: 'text', id: 'merken-titel', maxlength: '80', placeholder: T('merken_titel_platzhalter', L) });
    inp.value = vorschlag;
    var d = dialog([
      el('h2', { class: 'dialog-titel', text: T('merken', L) }),
      el('label', { class: 'feld-label', for: 'merken-titel', text: T('merken_titel_label', L) }),
      inp,
      el('p', { class: 'hinweis sanft', text: T('gemerkt_hinweis', L) }),
      el('div', { class: 'dialog-knoepfe' }, [
        el('button', { type: 'button', class: 'btn', text: T('abbrechen', L), onclick: function () { d.close(); } }),
        el('button', { type: 'button', class: 'btn primaer', text: T('merken_speichern', L), onclick: function () {
          var ok = merken(inp.value.trim() || vorschlag || 'Prompt', ergebnis, meta);
          d.close();
          toast(ok ? (L ? T('gemerkt_ok_sie') : T('gemerkt_ok')) : 'Speichern nicht möglich (Speicher gesperrt).');
        } })
      ])
    ]);
    inp.focus(); inp.select();
  }

  function gemerktDialog(L) {
    var T = LYU.T;
    var liste = el('div', { class: 'gemerkt-liste' });
    function fuellen() {
      while (liste.firstChild) liste.removeChild(liste.firstChild);
      var arr = gemerktLaden();
      if (!arr.length) { liste.appendChild(el('p', { class: 'hinweis', text: T('gemerkt_leer', L) })); return; }
      arr.forEach(function (e) {
        var datum = '';
        try { datum = new Date(e.zeit).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (x) { /* egal */ }
        var details = el('details', { class: 'gemerkt-eintrag' }, [
          el('summary', null, [el('span', { class: 'gemerkt-titel', text: e.titel }), el('span', { class: 'gemerkt-meta', text: [e.meta && e.meta.klasse ? 'Klasse ' + e.meta.klasse : '', datum].filter(Boolean).join(' · ') })]),
          el('pre', { class: 'gemerkt-text', text: e.text }),
          el('div', { class: 'dialog-knoepfe links' }, [
            el('button', { type: 'button', class: 'btn primaer', text: T('kopieren', L), onclick: function (ev) { kopieren(e.text, ev.currentTarget, T('kopiert', L), T('kopieren_fehler', L)); } }),
            el('button', { type: 'button', class: 'btn gefahr', text: T('loeschen', L), onclick: function () { loeschen(e.id); fuellen(); } })
          ])
        ]);
        liste.appendChild(details);
      });
    }
    fuellen();
    var d = dialog([
      el('div', { class: 'dialog-kopf' }, [el('h2', { class: 'dialog-titel', text: T('gemerkt_titel', L) }), el('button', { type: 'button', class: 'icon-btn', 'aria-label': T('schliessen', L), html: '&#x2715;', onclick: function () { d.close(); } })]),
      el('p', { class: 'hinweis sanft', text: T('gemerkt_hinweis', L) }),
      liste
    ], 'gross');
  }

  return {
    ANBIETER: ANBIETER, anbieterListe: anbieterListe, anbieterAktiv: anbieterAktiv, linkFuer: linkFuer,
    kopieren: kopieren, toast: toast, renderOeffnen: renderOeffnen, dialog: dialog, bestaetigen: bestaetigen,
    merkenDialog: merkenDialog, gemerktDialog: gemerktDialog, gemerktLaden: gemerktLaden, gemerktSpeichern: gemerktSpeichern
  };
})();
