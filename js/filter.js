/* Lyukasora – Filterlogik
 * Reine Funktionen ohne DOM. Entscheiden datengetrieben, welche Optionen
 * nach der bisherigen Auswahl erlaubt sind. Werden auch vom Sackgassen-Test genutzt.
 */
window.LYU = window.LYU || {};

LYU.filter = (function () {
  'use strict';

  var GRUPPEN_REIHENFOLGE = ['sprachen', 'mint', 'gesellschaft', 'musisch'];
  var FORMATE_MIT_FLAG = { experiment: 'experimente', programmieren: 'programmieren' };

  function band(klasse) {
    klasse = Number(klasse);
    if (klasse <= 6) return '5-6';
    if (klasse <= 8) return '7-8';
    if (klasse <= 10) return '9-10';
    return '11-13';
  }

  function altersband(klasse) {
    klasse = Number(klasse);
    if (klasse <= 7) return '5-7';
    if (klasse <= 10) return '8-10';
    return '11-13';
  }

  function faecherFuerKlasse(daten, klasse) {
    klasse = Number(klasse);
    return daten.faecher
      .filter(function (f) { return f.klassen.indexOf(klasse) !== -1; })
      .sort(function (a, b) {
        var ga = GRUPPEN_REIHENFOLGE.indexOf(a.gruppe), gb = GRUPPEN_REIHENFOLGE.indexOf(b.gruppe);
        if (ga !== gb) return ga - gb;
        return a.name.localeCompare(b.name, 'de');
      });
  }

  function fach(daten, fachId) {
    for (var i = 0; i < daten.faecher.length; i++) {
      if (daten.faecher[i].id === fachId) return daten.faecher[i];
    }
    return null;
  }

  function zeigtNiveau(fachObj, klasse) {
    return !!(fachObj && fachObj.niveaus_oberstufe && Number(klasse) >= 12);
  }

  function themenFuer(daten, fachId, klasse, niveau) {
    klasse = Number(klasse);
    return daten.themen.filter(function (t) {
      if (t.fach !== fachId) return false;
      if (t.klassen.indexOf(klasse) === -1) return false;
      if (niveau === 'gA' && t.kurs === 'eA') return false;
      if (niveau === 'eA' && t.kurs === 'gA') return false;
      return true;
    });
  }

  function thema(daten, themaId) {
    for (var i = 0; i < daten.themen.length; i++) {
      if (daten.themen[i].id === themaId) return daten.themen[i];
    }
    return null;
  }

  /* Formate für Fach + Thema. thema kann null sein ("Anderes Thema"). */
  function formateFuer(bausteine, fachObj, themaObj) {
    var basis = (bausteine.formate_standard || []).slice();
    var reihenfolge = bausteine.formate_reihenfolge || basis;
    if (themaObj) {
      (themaObj.formate_aus || []).forEach(function (id) {
        var i = basis.indexOf(id);
        if (i !== -1) basis.splice(i, 1);
      });
      Object.keys(FORMATE_MIT_FLAG).forEach(function (formatId) {
        if (themaObj[FORMATE_MIT_FLAG[formatId]] === true && basis.indexOf(formatId) === -1) basis.push(formatId);
      });
    } else if (fachObj) {
      /* Anderes Thema: Experimente nur in den Naturwissenschaften, Programmieren nur in Informatik */
      if (fachObj.experimente_moeglich && basis.indexOf('experiment') === -1) basis.push('experiment');
      if (fachObj.programmieren_moeglich && basis.indexOf('programmieren') === -1) basis.push('programmieren');
    }
    return basis
      .filter(function (id) { return bausteine.formate && bausteine.formate[id]; })
      .sort(function (a, b) { return reihenfolge.indexOf(a) - reihenfolge.indexOf(b); });
  }

  function istFremdsprache(fachObj) {
    return !!(fachObj && fachObj.fremdsprache && fachObj.fremdsprache.zielsprache);
  }

  function ger(fachObj, klasse) {
    if (!istFremdsprache(fachObj) || !fachObj.fremdsprache.ger) return null;
    return fachObj.fremdsprache.ger[String(klasse)] || null;
  }

  function platzhalter(fachObj, themaObj, klasse) {
    if (themaObj && themaObj.beispiel) return 'z. B. ' + themaObj.beispiel;
    if (fachObj && fachObj.platzhalter) {
      var b = band(klasse);
      if (fachObj.platzhalter[b]) return fachObj.platzhalter[b];
      var keys = Object.keys(fachObj.platzhalter);
      if (keys.length) return fachObj.platzhalter[keys[0]];
    }
    return 'z. B. Ich möchte verstehen, warum das so ist, und es an einem Beispiel anwenden können.';
  }

  /* Kurzform der KC-Bezeichnung für Prompt und Listen: Teil vor dem ersten Doppelpunkt oder höchstens 70 Zeichen. */
  function kcKurz(kc) {
    kc = (kc || '').trim();
    if (!kc) return '';
    var jg = (kc.match(/\((Jg\.|Jahrgang|Q\d|E-Phase|Einführungsphase|Qualifikationsphase)[^)]*\)\s*$/) || [''])[0];
    var kern = jg ? kc.slice(0, kc.length - jg.length).trim() : kc;
    var i = kern.indexOf(':');
    if (i >= 8 && i <= 70) kern = kern.slice(0, i);
    if (kern.length > 70) {
      kern = kern.slice(0, 70);
      var sp = kern.lastIndexOf(' ');
      if (sp > 40) kern = kern.slice(0, sp);
      kern = kern.replace(/[,;:\s]+$/, '') + ' …';
    }
    return kern;
  }

  /* Schätzt, ob der Freitext ein Stichwort oder ein Lernziel ist. */
  function istNurStichwort(text) {
    var t = (text || '').trim();
    if (!t) return false;
    var woerter = t.split(/\s+/).filter(Boolean).length;
    return woerter < 4 && t.indexOf('?') === -1;
  }

  return {
    band: band,
    altersband: altersband,
    faecherFuerKlasse: faecherFuerKlasse,
    fach: fach,
    zeigtNiveau: zeigtNiveau,
    themenFuer: themenFuer,
    thema: thema,
    formateFuer: formateFuer,
    istFremdsprache: istFremdsprache,
    ger: ger,
    platzhalter: platzhalter,
    kcKurz: kcKurz,
    istNurStichwort: istNurStichwort
  };
})();
