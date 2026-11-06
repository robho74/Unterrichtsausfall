/* Lyukasora – Einstellungen (localStorage), Einstellungsdialog, optionale Module */
window.LYU = window.LYU || {};

LYU.einstellungen = (function () {
  'use strict';

  var SCHLUESSEL = 'lyu.einstellungen';
  var el = function () { return LYU.ui.el.apply(null, arguments); };

  function standard() {
    return { lehrkraft: false, schulbot: { name: '', url: '' }, anbieterAn: {}, darstellung: 'auto', schluessel: { anbieter: 'anthropic', key: '', basisUrl: '', modell: '' } };
  }

  function laden() {
    var E = standard();
    try {
      var raw = localStorage.getItem(SCHLUESSEL);
      if (raw) {
        var g = JSON.parse(raw);
        if (g && typeof g === 'object') {
          E.lehrkraft = !!g.lehrkraft;
          if (g.schulbot) { E.schulbot.name = String(g.schulbot.name || ''); E.schulbot.url = String(g.schulbot.url || ''); }
          if (g.anbieterAn && typeof g.anbieterAn === 'object') E.anbieterAn = g.anbieterAn;
          if (g.darstellung) E.darstellung = g.darstellung;
          if (g.schluessel) { Object.keys(E.schluessel).forEach(function (k) { if (g.schluessel[k] !== undefined) E.schluessel[k] = String(g.schluessel[k]); }); }
        }
      }
    } catch (e) { /* Speicher gesperrt: Standard */ }
    return E;
  }

  function speichern(E) {
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(E)); return true; } catch (e) { return false; }
  }

  function darstellungAnwenden(E) {
    var root = document.documentElement;
    if (E.darstellung === 'hell' || E.darstellung === 'dunkel') root.dataset.theme = E.darstellung === 'hell' ? 'light' : 'dark';
    else delete root.dataset.theme;
  }

  function allesLoeschen() {
    try { localStorage.removeItem(SCHLUESSEL); localStorage.removeItem('lyu.gemerkt'); } catch (e) { /* egal */ }
  }

  /* Module laden nur auf Klick */
  var geladen = {};
  function modulLaden(name, dann) {
    if (geladen[name]) { dann(); return; }
    var s = document.createElement('script');
    s.src = 'js/module/' + name + '.js';
    s.onload = function () { geladen[name] = true; dann(); };
    s.onerror = function () { LYU.aktionen.toast('Modul konnte nicht geladen werden.', 4000); };
    document.head.appendChild(s);
  }

  function dialog(E, L, nachSpeichern) {
    var T = LYU.T, A = LYU.aktionen;
    var d;

    /* Schul-Chatbot */
    var nameInp = el('input', { type: 'text', id: 'einst-schulbot-name', maxlength: '60', placeholder: 'z. B. AIS.chat unserer Schule' });
    nameInp.value = E.schulbot.name;
    var urlInp = el('input', { type: 'url', id: 'einst-schulbot-url', placeholder: 'https://…', inputmode: 'url' });
    urlInp.value = E.schulbot.url;

    /* Anbieter */
    var anbieterBox = el('div', { class: 'einst-liste' });
    A.ANBIETER.forEach(function (a) {
      var id = 'einst-anbieter-' + a.id;
      var cb = el('input', { type: 'checkbox', id: id, class: 'schalter-input' });
      cb.checked = A.anbieterAktiv(a, E);
      cb.dataset.anbieter = a.id;
      anbieterBox.appendChild(el('label', { class: 'schalter', for: id }, [cb, el('span', { class: 'schalter-knopf', 'aria-hidden': 'true' }), el('span', { class: 'schalter-text' }, [el('span', { class: 'prinzip-name', text: a.name }), el('span', { class: 'prinzip-satz', text: a.alter + (a.sendet ? ' · ' + T('oeffnen_sendet', L) : '') + (a.standard ? '' : ' · standardmäßig aus') })])]));
    });

    /* Lehrkraft */
    var lk = el('input', { type: 'checkbox', id: 'einst-lehrkraft', class: 'schalter-input' });
    lk.checked = !!E.lehrkraft;

    /* Darstellung */
    var darst = el('div', { class: 'segment', role: 'radiogroup' });
    var darstWert = E.darstellung;
    [['auto', T('darstellung_auto', L)], ['hell', T('darstellung_hell', L)], ['dunkel', T('darstellung_dunkel', L)]].forEach(function (p) {
      var b = el('button', { type: 'button', role: 'radio', class: 'segment-btn' + (darstWert === p[0] ? ' aktiv' : ''), 'aria-checked': darstWert === p[0] ? 'true' : 'false', text: p[1], onclick: function () {
        darstWert = p[0];
        Array.prototype.forEach.call(darst.children, function (c) { c.classList.toggle('aktiv', c === b); c.setAttribute('aria-checked', c === b ? 'true' : 'false'); });
        E.darstellung = darstWert; darstellungAnwenden(E);
      } });
      darst.appendChild(b);
    });

    function speichernKlick() {
      E.schulbot.name = nameInp.value.trim();
      E.schulbot.url = urlInp.value.trim();
      if (E.schulbot.url && !/^https?:\/\//i.test(E.schulbot.url)) E.schulbot.url = 'https://' + E.schulbot.url;
      Array.prototype.forEach.call(anbieterBox.querySelectorAll('input[data-anbieter]'), function (cb) { E.anbieterAn[cb.dataset.anbieter] = cb.checked; });
      E.lehrkraft = lk.checked;
      E.darstellung = darstWert;
      speichern(E);
      darstellungAnwenden(E);
      d.close();
      A.toast(T('gespeichert', L));
      if (nachSpeichern) nachSpeichern(E);
    }

    d = A.dialog([
      el('div', { class: 'dialog-kopf' }, [el('h2', { class: 'dialog-titel', text: T('einstellungen', L) }), el('button', { type: 'button', class: 'icon-btn', 'aria-label': T('schliessen', L), html: '&#x2715;', onclick: function () { d.close(); } })]),

      el('section', { class: 'einst-block' }, [
        el('h3', { class: 'block-titel', text: T('einst_schulbot_titel', L) }),
        el('p', { class: 'hinweis sanft', text: T('einst_schulbot_hilfe', L) }),
        el('label', { class: 'feld-label', for: 'einst-schulbot-name', text: T('einst_schulbot_name', L) }), nameInp,
        el('label', { class: 'feld-label', for: 'einst-schulbot-url', text: T('einst_schulbot_url', L) }), urlInp
      ]),

      el('section', { class: 'einst-block' }, [
        el('h3', { class: 'block-titel', text: T('einst_anbieter_titel', L) }),
        el('p', { class: 'hinweis sanft', text: T('einst_anbieter_hilfe', L) }),
        anbieterBox
      ]),

      el('section', { class: 'einst-block' }, [
        el('h3', { class: 'block-titel', text: T('einst_lehrkraft_titel', L) }),
        el('label', { class: 'schalter', for: 'einst-lehrkraft' }, [lk, el('span', { class: 'schalter-knopf', 'aria-hidden': 'true' }), el('span', { class: 'schalter-text' }, [el('span', { class: 'prinzip-name', text: T('lehrkraft_schalter', L) }), el('span', { class: 'prinzip-satz', text: T('lehrkraft_hilfe', L) })])])
      ]),

      el('section', { class: 'einst-block' }, [
        el('h3', { class: 'block-titel', text: T('einst_darstellung_titel', L) }),
        darst
      ]),

      el('section', { class: 'einst-block' }, [
        el('h3', { class: 'block-titel', text: T('einst_schluessel_titel', L) }),
        el('p', { class: 'hinweis sanft', text: T('einst_schluessel_hilfe', L) }),
        el('button', { type: 'button', class: 'btn', text: T('einst_schluessel_oeffnen', L) + (E.schluessel.key ? ' (eingerichtet)' : ''), onclick: function () {
          speichernKlick();
          modulLaden('schluessel', function () { LYU.schluessel.einrichten(E, L); });
        } })
      ]),

      el('section', { class: 'einst-block' }, [
        el('h3', { class: 'block-titel', text: T('einst_labor_titel', L) }),
        el('p', { class: 'hinweis sanft', text: T('einst_labor_hilfe', L) }),
        el('button', { type: 'button', class: 'btn', text: T('einst_labor_oeffnen', L), onclick: function () {
          d.close();
          modulLaden('labor', function () { LYU.labor.oeffnen(L); });
        } })
      ]),

      el('section', { class: 'einst-block' }, [
        el('button', { type: 'button', class: 'btn gefahr', text: T('einst_zuruecksetzen', L), onclick: function () {
          A.bestaetigen(T('einst_zuruecksetzen_bestaetigen', L), T('ja', L), T('abbrechen', L)).then(function (ok) {
            if (!ok) return;
            allesLoeschen();
            location.reload();
          });
        } })
      ]),

      el('div', { class: 'dialog-knoepfe' }, [
        el('button', { type: 'button', class: 'btn', text: T('abbrechen', L), onclick: function () { darstellungAnwenden(laden()); d.close(); } }),
        el('button', { type: 'button', class: 'btn primaer', text: T('speichern', L), onclick: speichernKlick })
      ])
    ], 'gross');
  }

  return { laden: laden, speichern: speichern, standard: standard, darstellungAnwenden: darstellungAnwenden, dialog: dialog, modulLaden: modulLaden, allesLoeschen: allesLoeschen };
})();
