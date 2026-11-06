/* Lyukasora – Oberfläche
 * Schritte untereinander, jeder erscheint, sobald der vorherige beantwortet ist.
 * Zustand liegt in Z; render() zeichnet alles aus dem Zustand.
 */
window.LYU = window.LYU || {};

LYU.ui = (function () {
  'use strict';

  var F = LYU.filter, AS = LYU.assembler, T = LYU.T;
  var D = null, B = null, E = null; /* Daten, Bausteine, Einstellungen */
  var Z = null;
  var ANDERES = 'ANDERES';
  var offen = {}; /* Schritte, die trotz Fertigstellung aufgeklappt sind */
  var reduziert = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function leererZustand() {
    return {
      klasse: null, niveau: null, fachId: null, themaId: null, themaFrei: '',
      genauer: '', vorwissen: '', huerde: '',
      format: null, optionen: {}, prinzipien: [], verstaerkt: [], prinzipienManuell: false,
      fein: { sprache: 'deutsch', laenge: 'normal', ton: 'sachlich', bloom: null, lehrkraft: false }
    };
  }

  /* ---------- DOM-Helfer ---------- */
  function el(tag, attrs, kinder) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.keys(v).forEach(function (d) { e.dataset[d] = v[d]; });
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    });
    (kinder || []).forEach(function (kind) {
      if (kind === null || kind === undefined || kind === false) return;
      e.appendChild(typeof kind === 'string' ? document.createTextNode(kind) : kind);
    });
    return e;
  }
  function $(id) { return document.getElementById(id); }
  function leeren(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }
  function L() { return !!Z.fein.lehrkraft; }
  function t(key, werte) { return T(key, L(), werte); }

  function scrollZu(node) {
    if (!node) return;
    window.requestAnimationFrame(function () {
      node.scrollIntoView({ behavior: reduziert ? 'auto' : 'smooth', block: 'start' });
    });
  }

  function fokusErstes(node) {
    var f = node && node.querySelector('button, input, textarea, select, [tabindex="0"]');
    if (f) f.focus({ preventScroll: true });
  }

  /* ---------- Abgeleitete Werte ---------- */
  function fach() { return Z.fachId ? F.fach(D, Z.fachId) : null; }
  function thema() { return Z.themaId && Z.themaId !== ANDERES ? F.thema(D, Z.themaId) : null; }
  function themaGewaehlt() { return Z.themaId === ANDERES ? Z.themaFrei.trim().length > 0 : !!Z.themaId; }
  function formatObj() { return Z.format ? B.formate[Z.format] : null; }
  function formatFertig() {
    var f = formatObj();
    if (!f) return false;
    var ok = true;
    Object.keys(f.optionen || {}).forEach(function (k) {
      var o = f.optionen[k];
      if (o.pflicht && !(Z.optionen[k] && String(Z.optionen[k]).trim())) ok = false;
    });
    return ok;
  }
  function komplett() {
    return Z.klasse && Z.fachId && themaGewaehlt() && Z.genauer.trim() && Z.format && formatFertig();
  }
  function auswahlFuerAssembler() {
    return {
      klasse: Z.klasse, niveau: Z.niveau, fach: fach(), thema: thema(), themaFrei: Z.themaFrei,
      genauer: Z.genauer, vorwissen: Z.vorwissen, huerde: Z.huerde,
      format: Z.format, optionen: Z.optionen, prinzipien: Z.prinzipien, verstaerkt: Z.verstaerkt, fein: Z.fein
    };
  }

  /* ---------- Zustandsänderungen ---------- */
  function setzeKlasse(k) {
    var vorher = Z.klasse;
    Z.klasse = Number(k);
    if (vorher !== Z.klasse) {
      var f = fach();
      if (!f || f.klassen.indexOf(Z.klasse) === -1) { Z.fachId = null; Z.themaId = null; Z.themaFrei = ''; Z.format = null; }
      else {
        var th = thema();
        if (th && th.klassen.indexOf(Z.klasse) === -1) { Z.themaId = null; Z.format = null; }
      }
      if (!F.zeigtNiveau(fach(), Z.klasse)) Z.niveau = null;
      offen = {};
    }
    render();
    if (!Z.fachId) { scrollZu($('schritt-fach')); fokusErstes($('schritt-fach')); }
  }

  function setzeNiveau(n) {
    Z.niveau = n || null;
    var th = thema();
    if (th && ((Z.niveau === 'gA' && th.kurs === 'eA') || (Z.niveau === 'eA' && th.kurs === 'gA'))) { Z.themaId = null; Z.format = null; }
    render();
  }

  function setzeFach(id) {
    var vorher = Z.fachId;
    Z.fachId = id;
    if (vorher !== id) {
      Z.themaId = null; Z.themaFrei = ''; Z.format = null; Z.fein.bloom = null; Z.fein.sprache = 'deutsch';
      if (!F.zeigtNiveau(fach(), Z.klasse)) Z.niveau = null;
      delete offen.fach;
    }
    render();
    scrollZu($('schritt-thema')); fokusErstes($('schritt-thema'));
  }

  function setzeThema(id) {
    var vorher = Z.themaId;
    Z.themaId = id;
    if (vorher !== id) {
      Z.fein.bloom = null;
      var f = formatObj();
      if (f && F.formateFuer(B, fach(), thema()).indexOf(Z.format) === -1) Z.format = null;
      if (!Z.prinzipienManuell && Z.format) Z.prinzipien = AS.voreinstellung(Z.format, thema(), B).prinzipien;
      delete offen.thema;
    }
    render();
    if (id !== ANDERES) { scrollZu($('schritt-genauer')); fokusErstes($('schritt-genauer')); }
    else { var i = $('thema-frei'); if (i) i.focus(); }
  }

  function setzeFormat(id) {
    var vorher = Z.format;
    Z.format = id;
    if (vorher !== id) {
      var vor = AS.voreinstellung(id, thema(), B);
      Z.prinzipien = vor.prinzipien;
      Z.prinzipienManuell = false;
      Z.optionen = {};
      var f = formatObj();
      Object.keys(f.optionen || {}).forEach(function (k) { if (f.optionen[k].standard !== undefined) Z.optionen[k] = f.optionen[k].standard; });
      delete offen.format;
    }
    render();
    var ziel = formatFertig() ? $('schritt-prinzipien') : $('schritt-format');
    if (formatFertig()) { scrollZu(ziel); }
  }

  function togglePrinzip(id) {
    var i = Z.prinzipien.indexOf(id);
    if (i === -1) Z.prinzipien.push(id); else Z.prinzipien.splice(i, 1);
    Z.prinzipienManuell = true;
    render();
  }
  function toggleVerstaerkt(id) {
    var i = Z.verstaerkt.indexOf(id);
    if (i === -1) Z.verstaerkt.push(id); else Z.verstaerkt.splice(i, 1);
    render();
  }

  function setzeLehrkraft(an) {
    Z.fein.lehrkraft = !!an;
    E.lehrkraft = Z.fein.lehrkraft;
    LYU.einstellungen.speichern(E);
    document.documentElement.dataset.modus = Z.fein.lehrkraft ? 'lehrkraft' : 'schueler';
    render();
  }

  function neuAnfangen() {
    var lehrkraft = Z.fein.lehrkraft;
    Z = leererZustand();
    Z.fein.lehrkraft = lehrkraft;
    offen = {};
    render();
    scrollZu($('schritt-klasse'));
  }

  /* ---------- Rendering ---------- */
  function radioButton(text, sub, aktiv, onclick, extraKlasse) {
    var b = el('button', { type: 'button', role: 'radio', 'aria-checked': aktiv ? 'true' : 'false', 'aria-label': sub ? text + ', ' + sub : text, class: 'wahl' + (aktiv ? ' aktiv' : '') + (extraKlasse ? ' ' + extraKlasse : ''), onclick: onclick }, [
      el('span', { class: 'wahl-text', text: text }),
      sub ? el('span', { class: 'wahl-sub', text: sub }) : null
    ]);
    return b;
  }

  function schrittZustand(id, fertig, sichtbar, zusammenfassung) {
    var sec = $('schritt-' + id);
    if (!sec) return;
    sec.hidden = !sichtbar;
    var istOffen = !fertig || offen[id];
    sec.classList.toggle('fertig', fertig && !istOffen);
    var inhalt = sec.querySelector('.schritt-inhalt');
    var zf = sec.querySelector('.schritt-zusammenfassung');
    if (inhalt) inhalt.hidden = !istOffen;
    if (zf) {
      zf.hidden = istOffen;
      leeren(zf);
      if (!istOffen) {
        zf.appendChild(el('span', { class: 'zf-text', text: zusammenfassung || '' }));
        zf.appendChild(el('button', { type: 'button', class: 'link-btn', text: t('aendern'), onclick: function () { offen[id] = true; render(); fokusErstes(sec); } }));
      }
    }
  }

  function renderKopf() {
    $('untertitel').textContent = t('untertitel');
    $('einleitung').textContent = t('einleitung');
    var titel = { klasse: 'schritt_klasse', fach: 'schritt_fach', thema: 'schritt_thema', genauer: 'schritt_genauer', format: 'schritt_format', prinzipien: 'schritt_prinzipien', fein: 'schritt_fein' };
    Object.keys(titel).forEach(function (id) {
      var h = document.querySelector('#schritt-' + id + ' .schritt-titel-text');
      if (h) h.textContent = t(titel[id]);
    });
    $('btn-einstellungen').setAttribute('aria-label', t('einstellungen'));
    $('btn-gemerkt').setAttribute('aria-label', t('gemerkt_titel'));
  }

  function renderPfad() {
    var ol = leeren($('pfad-liste'));
    var f = fach(), th = thema(), fo = formatObj();
    var chips = [];
    if (Z.klasse) chips.push({ id: 'klasse', text: t('klasse_kurz', { n: Z.klasse }) + (Z.niveau ? ' · ' + Z.niveau : '') });
    if (f) chips.push({ id: 'fach', text: f.name });
    if (themaGewaehlt()) chips.push({ id: 'thema', text: th ? th.name : Z.themaFrei.trim() });
    if (fo) chips.push({ id: 'format', text: (L() && fo.name_sie) || fo.name });
    $('pfad').hidden = chips.length === 0;
    chips.forEach(function (c) {
      ol.appendChild(el('li', null, [el('button', { type: 'button', class: 'chip', text: c.text, onclick: function () {
        offen[c.id] = true; render(); scrollZu($('schritt-' + c.id)); fokusErstes($('schritt-' + c.id));
      } })]));
    });
  }

  function renderKlasse() {
    var box = leeren($('klassen'));
    for (var k = 5; k <= 13; k++) {
      (function (k) {
        box.appendChild(radioButton(String(k), k === 11 ? 'E-Phase' : (k >= 12 ? 'Q-Phase' : null), Z.klasse === k, function () { setzeKlasse(k); }, 'wahl-klasse'));
      })(k);
    }
    schrittZustand('klasse', !!Z.klasse, true, t('klasse_kurz', { n: Z.klasse }));
  }

  function renderFach() {
    var sichtbar = !!Z.klasse;
    var box = leeren($('faecher'));
    if (sichtbar) {
      var liste = F.faecherFuerKlasse(D, Z.klasse);
      var gruppe = null;
      liste.forEach(function (f) {
        if (f.gruppe !== gruppe) { gruppe = f.gruppe; box.appendChild(el('div', { class: 'gruppe-titel', text: gruppenName(gruppe) })); }
        var sub = null;
        if (f.experimente_moeglich && Z.klasse <= 6) sub = 'in 5/6: Naturwissenschaften';
        box.appendChild(radioButton(f.name, sub, Z.fachId === f.id, function () { setzeFach(f.id); }));
      });
    }
    var f = fach();
    var nivBox = $('niveau');
    var zeigt = sichtbar && F.zeigtNiveau(f, Z.klasse);
    nivBox.hidden = !zeigt;
    if (zeigt) {
      leeren(nivBox);
      nivBox.appendChild(el('p', { class: 'feld-label', text: t('niveau_frage') }));
      var grp = el('div', { class: 'segment', role: 'radiogroup' });
      [['gA', t('niveau_gA')], ['eA', t('niveau_eA')], [null, t('niveau_egal')]].forEach(function (p) {
        grp.appendChild(el('button', { type: 'button', role: 'radio', 'aria-checked': Z.niveau === p[0] ? 'true' : 'false', class: 'segment-btn' + (Z.niveau === p[0] ? ' aktiv' : ''), text: p[1], onclick: function () { setzeNiveau(p[0]); } }));
      });
      nivBox.appendChild(grp);
    }
    var zf = f ? f.name + (zeigt && Z.niveau ? ' · ' + (Z.niveau === 'gA' ? t('niveau_gA') : t('niveau_eA')) : '') : '';
    schrittZustand('fach', !!Z.fachId, sichtbar, zf);
  }

  function gruppenName(g) {
    return { sprachen: 'Sprachen', mint: 'Mathematik, Naturwissenschaften, Informatik', gesellschaft: 'Gesellschaft', musisch: 'Kunst, Musik, Sport' }[g] || '';
  }

  function renderThema() {
    var sichtbar = !!Z.fachId;
    var box = leeren($('themen'));
    var f = fach();
    if (sichtbar) {
      var liste = F.themenFuer(D, Z.fachId, Z.klasse, Z.niveau);
      liste.forEach(function (th) {
        var sub = th.kc ? t('kc_praefix') + F.kcKurz(th.kc) : null;
        if (th.kurs) sub = (sub ? sub + ' · ' : '') + 'nur ' + th.kurs;
        if (th.bereich && th.bereich !== 'beide') sub = (sub ? sub + ' · ' : '') + (th.bereich === 'religion' ? 'Religion' : 'Werte und Normen');
        box.appendChild(radioButton(th.name, sub, Z.themaId === th.id, function () { setzeThema(th.id); }, 'wahl-zeile'));
      });
      var anderes = radioButton(t('anderes_thema'), t('anderes_thema_hilfe'), Z.themaId === ANDERES, function () { setzeThema(ANDERES); }, 'wahl-zeile wahl-anderes');
      box.appendChild(anderes);
      var frei = $('thema-frei-box');
      frei.hidden = Z.themaId !== ANDERES;
      var inp = $('thema-frei');
      inp.placeholder = t('anderes_thema_platzhalter');
      if (inp.value !== Z.themaFrei) inp.value = Z.themaFrei;
    }
    var th = thema();
    schrittZustand('thema', themaGewaehlt(), sichtbar, th ? th.name : Z.themaFrei.trim());
  }

  function renderGenauer() {
    var sichtbar = !!Z.fachId && themaGewaehlt();
    var sec = $('schritt-genauer');
    sec.hidden = !sichtbar;
    if (!sichtbar) return;
    var ta = $('genauer');
    ta.placeholder = F.platzhalter(fach(), thema(), Z.klasse);
    if (ta.value !== Z.genauer) ta.value = Z.genauer;
    $('genauer-label').textContent = t('genauer_label');
    $('genauer-hilfe').textContent = t('genauer_hilfe');
    $('vorwissen-label').textContent = t('vorwissen_label');
    $('huerde-label').textContent = t('huerde_label');
    $('vorwissen').placeholder = t('vorwissen_platzhalter');
    $('huerde').placeholder = t('huerde_platzhalter');
    if ($('vorwissen').value !== Z.vorwissen) $('vorwissen').value = Z.vorwissen;
    if ($('huerde').value !== Z.huerde) $('huerde').value = Z.huerde;
    var hinweis = $('genauer-hinweis');
    var stichwort = F.istNurStichwort(Z.genauer);
    hinweis.hidden = !stichwort;
    hinweis.textContent = stichwort ? t('stichwort_hinweis') : '';
    $('btn-weiter-genauer').textContent = t('weiter');
    $('btn-weiter-genauer').disabled = !Z.genauer.trim();
  }

  function renderFormat() {
    var sichtbar = !!Z.fachId && themaGewaehlt() && !!Z.genauer.trim();
    var box = leeren($('formate'));
    var f = fach(), th = thema();
    if (sichtbar) {
      var ids = F.formateFuer(B, f, th);
      if (ids.indexOf(Z.format) === -1) Z.format = null;
      ids.forEach(function (id) {
        var fo = B.formate[id];
        var name = (L() && fo.name_sie) || fo.name;
        var kurz = (L() && fo.kurz_sie) || fo.kurz;
        box.appendChild(radioButton(name, kurz, Z.format === id, function () { setzeFormat(id); }, 'wahl-kachel'));
      });
    }
    renderFormatOptionen();
    var fo = formatObj();
    var zf = '';
    if (fo) {
      zf = (L() && fo.name_sie) || fo.name;
      Object.keys(fo.optionen || {}).forEach(function (k) {
        var o = fo.optionen[k], v = Z.optionen[k];
        if (o.art === 'auswahl' && v !== undefined) zf += ' · ' + ((o.beschriftung && o.beschriftung[v]) || v);
        if (o.art === 'schalter' && v) zf += ' · ' + ((L() && o.name_sie) || o.name);
      });
    }
    schrittZustand('format', !!Z.format && formatFertig(), sichtbar, zf);
  }

  function renderFormatOptionen() {
    var box = leeren($('format-optionen'));
    var fo = formatObj();
    if (!fo || !fo.optionen || !Object.keys(fo.optionen).length) { box.hidden = true; return; }
    box.hidden = false;
    Object.keys(fo.optionen).forEach(function (key) {
      var o = fo.optionen[key];
      var name = (L() && o.name_sie) || o.name;
      var feld = el('div', { class: 'feld' });
      if (o.art === 'auswahl') {
        feld.appendChild(el('p', { class: 'feld-label', text: name }));
        var grp = el('div', { class: 'segment segment-umbruch', role: 'radiogroup' });
        o.werte.forEach(function (w) {
          var aktiv = String(Z.optionen[key]) === String(w);
          grp.appendChild(el('button', { type: 'button', role: 'radio', 'aria-checked': aktiv ? 'true' : 'false', class: 'segment-btn' + (aktiv ? ' aktiv' : ''), text: (o.beschriftung && o.beschriftung[w]) || w, onclick: function () { Z.optionen[key] = w; render(); } }));
        });
        feld.appendChild(grp);
      } else if (o.art === 'schalter') {
        var id = 'opt-' + key;
        var cb = el('input', { type: 'checkbox', id: id, class: 'schalter-input' });
        cb.checked = !!Z.optionen[key];
        cb.addEventListener('change', function () { Z.optionen[key] = cb.checked; render(); });
        feld.appendChild(el('label', { class: 'schalter', for: id }, [cb, el('span', { class: 'schalter-knopf', 'aria-hidden': 'true' }), el('span', { class: 'schalter-text', text: name })]));
      } else if (o.art === 'text') {
        var tid = 'opt-' + key;
        feld.appendChild(el('label', { class: 'feld-label', for: tid, text: name }));
        var ta = el('textarea', { id: tid, rows: '6', placeholder: (L() && o.platzhalter_sie) || o.platzhalter || '' });
        ta.value = Z.optionen[key] || '';
        ta.addEventListener('input', function () { Z.optionen[key] = ta.value; renderErgebnis(); renderPfad(); aktualisiereFertig(); });
        feld.appendChild(ta);
        if (fo.hinweis_ui) feld.appendChild(el('p', { class: 'hinweis sanft', text: t('taeuschung_hinweis') }));
        if (o.pflicht && !(Z.optionen[key] && String(Z.optionen[key]).trim())) feld.appendChild(el('p', { class: 'hinweis', text: t('feedback_pflicht') }));
      }
      box.appendChild(feld);
    });
  }

  function aktualisiereFertig() {
    var fo = formatObj();
    var sec = $('schritt-prinzipien');
    var sichtbar = !!fo && formatFertig();
    sec.hidden = !sichtbar;
    $('schritt-fein').hidden = !sichtbar;
  }

  function renderPrinzipien() {
    var sichtbar = !!Z.format && formatFertig();
    $('schritt-prinzipien').hidden = !sichtbar;
    var box = leeren($('prinzipien'));
    $('prinzipien-hinweis').textContent = t('prinzipien_hinweis');
    if (!sichtbar) return;
    var reihenfolge = B.prinzipien_reihenfolge || Object.keys(B.prinzipien);
    reihenfolge.forEach(function (id) {
      var p = B.prinzipien[id];
      var name = (L() && p.name_sie) || p.name;
      var satz = (L() && p.satz_sie) || p.satz;
      var an = p.immer || Z.prinzipien.indexOf(id) !== -1;
      var cbId = 'prinzip-' + id;
      var cb = el('input', { type: 'checkbox', id: cbId, class: 'schalter-input' });
      cb.checked = an;
      cb.disabled = !!p.immer;
      cb.addEventListener('change', function () { togglePrinzip(id); });
      var karte = el('div', { class: 'prinzip' + (an ? ' an' : '') + (p.immer ? ' immer' : '') });
      karte.appendChild(el('label', { class: 'schalter schalter-prinzip', for: cbId }, [
        cb, el('span', { class: 'schalter-knopf', 'aria-hidden': 'true' }),
        el('span', { class: 'schalter-text' }, [
          el('span', { class: 'prinzip-name', text: name }),
          p.immer ? el('span', { class: 'tag', text: t('immer_dabei') }) : null,
          el('span', { class: 'prinzip-satz', text: satz })
        ])
      ]));
      if (p.immer && p.verstaerken && (!p.verstaerken_ab_klasse || Z.klasse >= p.verstaerken_ab_klasse || L())) {
        var vId = 'verstaerkt-' + id;
        var vcb = el('input', { type: 'checkbox', id: vId, class: 'schalter-input' });
        vcb.checked = Z.verstaerkt.indexOf(id) !== -1;
        vcb.addEventListener('change', function () { toggleVerstaerkt(id); });
        karte.appendChild(el('label', { class: 'schalter schalter-klein', for: vId }, [vcb, el('span', { class: 'schalter-knopf', 'aria-hidden': 'true' }), el('span', { class: 'schalter-text', text: (L() && p.verstaerken_sie) || p.verstaerken })]));
      }
      box.appendChild(karte);
    });
  }

  function renderFein() {
    var sichtbar = !!Z.format && formatFertig();
    $('schritt-fein').hidden = !sichtbar;
    $('fein-hinweis').textContent = t('fein_hinweis');
    var box = leeren($('fein'));
    if (!sichtbar) return;
    var f = fach();
    function segment(label, werte, aktuell, onwahl) {
      var feld = el('div', { class: 'feld' }, [el('p', { class: 'feld-label', text: label })]);
      var grp = el('div', { class: 'segment segment-umbruch', role: 'radiogroup' });
      werte.forEach(function (w) {
        var aktiv = aktuell === w.id;
        grp.appendChild(el('button', { type: 'button', role: 'radio', 'aria-checked': aktiv ? 'true' : 'false', class: 'segment-btn' + (aktiv ? ' aktiv' : ''), text: w.name, onclick: function () { onwahl(w.id); render(); } }));
      });
      feld.appendChild(grp);
      return feld;
    }
    if (F.istFremdsprache(f)) {
      var ziel = f.fremdsprache.zielsprache;
      box.appendChild(segment(t('sprache_label'), [
        { id: 'deutsch', name: B.sprache.deutsch.name }, { id: 'ziel', name: ziel }, { id: 'zweisprachig', name: B.sprache.zweisprachig.name }
      ], Z.fein.sprache, function (v) { Z.fein.sprache = v; }));
    }
    box.appendChild(segment(t('laenge_label'), ['kurz', 'normal', 'ausfuehrlich'].map(function (id) { return { id: id, name: B.laenge[id].name }; }), Z.fein.laenge, function (v) { Z.fein.laenge = v; }));
    box.appendChild(segment(t('ton_label'), ['sachlich', 'locker', 'humor'].map(function (id) { return { id: id, name: B.ton[id].name }; }), Z.fein.ton, function (v) { Z.fein.ton = v; }));
    var th = thema();
    var bloomAktuell = Z.fein.bloom || (th && th.bloom && th.bloom[0]) || (B.bloom_standard && B.bloom_standard[F.altersband(Z.klasse)]) || 'verstehen';
    box.appendChild(segment(t('bloom_label'), ['verstehen', 'anwenden', 'analysieren', 'bewerten', 'erschaffen'].map(function (id) { return { id: id, name: B.bloom[id].name }; }), bloomAktuell, function (v) { Z.fein.bloom = v; }));
    /* Lehrkraft */
    var lid = 'fein-lehrkraft';
    var cb = el('input', { type: 'checkbox', id: lid, class: 'schalter-input' });
    cb.checked = L();
    cb.addEventListener('change', function () { setzeLehrkraft(cb.checked); });
    box.appendChild(el('div', { class: 'feld' }, [
      el('label', { class: 'schalter', for: lid }, [cb, el('span', { class: 'schalter-knopf', 'aria-hidden': 'true' }), el('span', { class: 'schalter-text' }, [el('span', { class: 'prinzip-name', text: t('lehrkraft_schalter') }), el('span', { class: 'prinzip-satz', text: t('lehrkraft_hilfe') })])])
    ]));
  }

  var letztesErgebnis = null;

  function renderErgebnis() {
    var sec = $('ergebnis');
    var fertig = komplett();
    sec.hidden = !fertig;
    $('btn-zum-prompt').hidden = !fertig;
    if (!fertig) { letztesErgebnis = null; return; }
    var erg = AS.bauen(auswahlFuerAssembler(), B);
    letztesErgebnis = erg;
    $('ergebnis-titel').textContent = t('ergebnis_titel');
    $('ergebnis-hinweis').textContent = t('ergebnis_hinweis');
    $('einsteiger').textContent = AS.variante(B.einsteiger, L());
    $('btn-kopieren').textContent = t('kopieren');
    $('btn-zum-prompt').textContent = t('zum_prompt');
    $('prompt-zeichen').textContent = t('zeichen', { n: erg.zeichen });

    var box = leeren($('prompt-anzeige'));
    erg.abschnitte.forEach(function (ab) {
      var zeilen = ab.zeilen.filter(function (z) { return z && String(z).trim(); });
      if (!zeilen.length) return;
      var teil = el('section', { class: 'prompt-abschnitt' }, [el('h3', { class: 'prompt-h', text: ab.titel })]);
      if (ab.liste) teil.appendChild(el('ul', null, zeilen.map(function (z) { return el('li', { text: z }); })));
      else zeilen.forEach(function (z) { teil.appendChild(el('p', { text: z })); });
      box.appendChild(teil);
    });
    $('prompt-text').value = erg.text;

    LYU.aktionen.renderOeffnen($('oeffnen'), erg.text, E, L());
    $('weiter-titel').textContent = t('weiter_titel');
    $('weiter-hinweis').textContent = t('weiter_hinweis');
    var ul = leeren($('anschluss'));
    erg.anschluss.forEach(function (s) {
      var li = el('li', { class: 'anschluss-zeile' }, [
        el('span', { class: 'anschluss-text', text: s }),
        el('button', { type: 'button', class: 'btn klein', text: t('anschluss_kopieren'), onclick: function (ev) { LYU.aktionen.kopieren(s, ev.currentTarget, t('kopiert'), t('kopieren_fehler')); } })
      ]);
      ul.appendChild(li);
    });
    $('btn-merken').textContent = t('merken');
    $('btn-neu').textContent = t('neu');
    if (erg.warnungen.length && window.console) console.info('Prompt-Hinweise:', erg.warnungen);
  }

  function render() {
    document.documentElement.dataset.modus = L() ? 'lehrkraft' : 'schueler';
    renderKopf();
    renderPfad();
    renderKlasse();
    renderFach();
    renderThema();
    renderGenauer();
    renderFormat();
    renderPrinzipien();
    renderFein();
    renderErgebnis();
  }

  /* ---------- Ereignisse, die nicht neu gezeichnet werden müssen ---------- */
  function bindeFelder() {
    $('thema-frei').addEventListener('input', function (ev) {
      Z.themaFrei = ev.target.value;
      renderPfad(); renderGenauer(); renderFormat(); renderPrinzipien(); renderFein(); renderErgebnis();
      schrittZustand('thema', themaGewaehlt() && false, true, '');
    });
    $('thema-frei').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); if (Z.themaFrei.trim()) { render(); scrollZu($('schritt-genauer')); fokusErstes($('schritt-genauer')); } }
    });
    $('genauer').addEventListener('input', function (ev) {
      Z.genauer = ev.target.value;
      var hinweis = $('genauer-hinweis');
      var stichwort = F.istNurStichwort(Z.genauer);
      hinweis.hidden = !stichwort;
      hinweis.textContent = stichwort ? t('stichwort_hinweis') : '';
      $('btn-weiter-genauer').disabled = !Z.genauer.trim();
      renderFormat(); renderPrinzipien(); renderFein(); renderErgebnis();
    });
    $('vorwissen').addEventListener('input', function (ev) { Z.vorwissen = ev.target.value; renderErgebnis(); });
    $('huerde').addEventListener('input', function (ev) { Z.huerde = ev.target.value; renderErgebnis(); });
    $('btn-weiter-genauer').addEventListener('click', function () {
      render();
      scrollZu($('schritt-format')); fokusErstes($('schritt-format'));
    });
    $('btn-kopieren').addEventListener('click', function (ev) {
      if (!letztesErgebnis) return;
      LYU.aktionen.kopieren(letztesErgebnis.text, ev.currentTarget, t('kopiert'), t('kopieren_fehler'), $('prompt-text'));
    });
    $('btn-zum-prompt').addEventListener('click', function () { scrollZu($('ergebnis')); });
    $('btn-neu').addEventListener('click', function () {
      LYU.aktionen.bestaetigen(t('neu_bestaetigen'), t('ja'), t('abbrechen')).then(function (ok) { if (ok) neuAnfangen(); });
    });
    $('btn-merken').addEventListener('click', function () {
      if (!letztesErgebnis) return;
      var f = fach(), th = thema(), fo = formatObj();
      var vorschlag = [f ? f.name : '', th ? th.name : Z.themaFrei.trim(), fo ? ((L() && fo.name_sie) || fo.name) : ''].filter(Boolean).join(' · ');
      LYU.aktionen.merkenDialog(vorschlag, letztesErgebnis, { klasse: Z.klasse, fach: f ? f.name : '', thema: th ? th.name : Z.themaFrei.trim(), format: fo ? fo.name : '' }, L());
    });
    /* Sichtbarkeit des schwebenden Knopfs */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (eintraege) {
        eintraege.forEach(function (e) { document.body.classList.toggle('ergebnis-sichtbar', e.isIntersecting); });
      }, { threshold: 0.05 });
      io.observe($('ergebnis'));
    }
  }

  function start(daten, bausteine, einstellungen) {
    D = daten; B = bausteine; E = einstellungen;
    Z = leererZustand();
    Z.fein.lehrkraft = !!E.lehrkraft;
    bindeFelder();
    render();
  }

  return { start: start, render: render, zustand: function () { return Z; }, setzeLehrkraft: setzeLehrkraft, el: el, T: t };
})();
