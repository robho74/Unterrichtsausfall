/* Lyukasora – Prompt-Assembler
 * Baut aus der Auswahl und den Bausteinen (data/bausteine.json) den fertigen Prompt.
 * Reine Funktionen ohne DOM; wird auch vom Qualitätslauf genutzt.
 *
 * Eingabe (auswahl):
 *   klasse (Zahl), niveau (null|'gA'|'eA'), fach (Objekt), thema (Objekt|null), themaFrei (Text),
 *   genauer, vorwissen, huerde (Text), format (Id), optionen (Objekt), prinzipien (Array von Ids),
 *   verstaerkt (Array von Ids der immer aktiven Prinzipien, die verstärkt werden),
 *   fein: { sprache: 'deutsch'|'ziel'|'zweisprachig', laenge, ton, bloom, lehrkraft (bool) }
 * Ausgabe: { text, abschnitte, anschluss, zeichen, warnungen }
 */
window.LYU = window.LYU || {};

LYU.assembler = (function () {
  'use strict';

  var F = LYU.filter;

  function variante(obj, lehrkraft) {
    if (obj === null || obj === undefined) return '';
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return obj;
    if (lehrkraft && obj.lehrkraft !== undefined) return obj.lehrkraft;
    if (obj.schueler !== undefined) return obj.schueler;
    return '';
  }

  function fuellen(text, werte) {
    if (!text) return '';
    return String(text).replace(/\{([a-z_]+)\}/g, function (m, key) {
      return werte[key] !== undefined && werte[key] !== null ? String(werte[key]) : '';
    });
  }

  function alsListe(x) {
    if (!x) return [];
    return Array.isArray(x) ? x.slice() : [x];
  }

  /* Deterministische Auswahl aus einer Liste, damit gleiche Eingaben gleichen Prompt ergeben. */
  function waehle(liste, schluessel) {
    if (!liste || !liste.length) return '';
    var h = 0;
    for (var i = 0; i < schluessel.length; i++) h = (h * 31 + schluessel.charCodeAt(i)) >>> 0;
    return liste[h % liste.length];
  }

  function satzende(s) {
    s = (s || '').trim();
    if (!s) return '';
    return /[.!?“"…]$/.test(s) ? s : s + '.';
  }

  function optionswert(format, optionen, key) {
    var def = format.optionen && format.optionen[key];
    if (optionen && optionen[key] !== undefined && optionen[key] !== null && optionen[key] !== '') return optionen[key];
    return def ? def.standard : '';
  }

  function optionstext(format, optionen, key) {
    var def = format.optionen && format.optionen[key];
    var wert = optionswert(format, optionen, key);
    if (def && def.texte && def.texte[wert] !== undefined) return def.texte[wert];
    return wert;
  }

  function bauen(auswahl, bausteine) {
    var L = !!(auswahl.fein && auswahl.fein.lehrkraft);
    var fach = auswahl.fach || {};
    var thema = auswahl.thema || null;
    var klasse = Number(auswahl.klasse);
    var band = F.altersband(klasse);
    var format = bausteine.formate[auswahl.format];
    var warnungen = [];
    if (!format) return { text: '', abschnitte: [], anschluss: [], zeichen: 0, warnungen: ['Format unbekannt: ' + auswahl.format] };

    var fremdsprache = F.istFremdsprache(fach);
    var ger = F.ger(fach, klasse) || '';
    var themaName = thema ? thema.name : (auswahl.themaFrei || '').trim();

    var werte = {
      klasse: klasse,
      fach: fach.name || '',
      thema: themaName,
      kc: thema ? F.kcKurz(thema.kc) : '',
      genauer: (auswahl.genauer || '').trim(),
      vorwissen: (auswahl.vorwissen || '').trim(),
      huerde: (auswahl.huerde || '').trim(),
      zielsprache: fremdsprache ? fach.fremdsprache.zielsprache : '',
      ger: ger,
      schueler_in: bausteine.rolle.schueler_in,
      niveau_satz: (auswahl.niveau && bausteine.rolle.niveau[auswahl.niveau]) || '',
      fach_hinweise: fach.hinweise || ''
    };
    Object.keys(format.optionen || {}).forEach(function (key) {
      werte[key] = optionstext(format, auswahl.optionen, key);
    });
    if (format.optionen && format.optionen.moderation) {
      var mod = optionswert(format, auswahl.optionen, 'moderation');
      werte.moderation = (mod === true || mod === 'true') ? variante(format.moderation, L) : '';
    }

    var abschnitte = [];

    /* 1. Rolle */
    abschnitte.push({ titel: bausteine.rolle.titel, zeilen: [fuellen(L ? bausteine.rolle.lehrkraft : bausteine.rolle.schueler, werte)] });

    /* 2. Ausgangslage */
    var A = bausteine.ausgangslage;
    var lage = [];
    if (thema) lage.push(fuellen(thema.kc ? A.thema_kc : A.thema, werte));
    else lage.push(fuellen(A.thema_frei, werte));
    if (werte.genauer) lage.push(satzende(fuellen(variante(A.genauer, L), werte)));
    if (werte.vorwissen) lage.push(satzende(fuellen(variante(A.vorwissen, L), werte)));
    if (werte.huerde) lage.push(satzende(fuellen(variante(A.huerde, L), werte)));
    if (fremdsprache && ger) lage.push(fuellen(variante(A.fremdsprache, L), werte));
    var bloomId = (auswahl.fein && auswahl.fein.bloom) || (thema && thema.bloom && thema.bloom[0]) || (bausteine.bloom_standard && bausteine.bloom_standard[band]) || 'verstehen';
    if (bloomId && bausteine.bloom[bloomId]) {
      werte.bloom_satz = variante(bausteine.bloom[bloomId], L);
      lage.push(fuellen(variante(A.bloom, L), werte));
    }
    abschnitte.push({ titel: variante(A.titel, L), zeilen: lage });

    /* 3. Auftrag */
    var auftrag = alsListe(variante(format.auftrag, L)).map(function (z) { return fuellen(z, werte); });
    var laengeId = (auswahl.fein && auswahl.fein.laenge) || 'normal';
    var laengeText = bausteine.laenge[laengeId] ? variante(bausteine.laenge[laengeId], L) : '';
    if (laengeText) auftrag.push(laengeText);
    var tonId = (auswahl.fein && auswahl.fein.ton) || 'sachlich';
    if (bausteine.ton[tonId] && bausteine.ton[tonId].text) auftrag.push(bausteine.ton[tonId].text);
    if (fremdsprache) {
      var sprId = (auswahl.fein && auswahl.fein.sprache) || 'deutsch';
      var spr = bausteine.sprache[sprId] || bausteine.sprache.deutsch;
      if (spr && spr.text) auftrag.push(fuellen(spr.text, werte));
    }
    abschnitte.push({ titel: format.titel || 'Dein Auftrag', zeilen: auftrag });

    /* 4. Didaktik */
    var D = bausteine.didaktik;
    var did = alsListe(variante(D.immer, L)).slice();
    if (D.band[band]) did = did.concat(alsListe(variante(D.band[band], L)));
    var alltag = thema && thema.alltag ? thema.alltag.slice(0, 3) : [];
    if (alltag.length) {
      werte.alltag = alltag.join(', ');
      did.push(fuellen(variante(D.alltag, L), werte));
    } else if (!L && D.alltag_standard && D.alltag_standard[band]) {
      did.push(D.alltag_standard[band]);
    }
    var fehl = thema && thema.fehlvorstellungen ? thema.fehlvorstellungen.slice(0, 2) : [];
    if (fehl.length) {
      werte.fehlvorstellungen = fehl.map(function (s) { return '„' + s.replace(/\.$/, '') + '“'; }).join('; ') + '.';
      did.push(fuellen(variante(D.fehlvorstellungen, L), werte));
    }
    if (werte.fach_hinweise) did.push(fuellen(variante(D.fach, L), werte));
    abschnitte.push({ titel: variante(D.titel, L), zeilen: did, liste: true });

    /* 5. Prinzipien */
    var reihenfolge = bausteine.prinzipien_reihenfolge || Object.keys(bausteine.prinzipien);
    var gewaehlt = (auswahl.prinzipien || []).slice();
    var verstaerkt = auswahl.verstaerkt || [];
    var prinzZeilen = [];
    /* Formate, die auf einmal geliefert werden (Stunde, Fakten, Feedback), bekommen die Prinzipien als
     * Bauanleitung für das Ergebnis (einmalig) statt als Gesprächsregeln. Im Lehrkraft-Modus sind die
     * Anweisungen ohnehin auf das Material bezogen. */
    var einmalig = format.einmalig === true && !L;
    reihenfolge.forEach(function (id) {
      var p = bausteine.prinzipien[id];
      if (!p) return;
      var aktiv = p.immer ? verstaerkt.indexOf(id) !== -1 : gewaehlt.indexOf(id) !== -1;
      if (!aktiv) return;
      var text = einmalig && !p.immer ? (p.einmalig || '') : variante(p.anweisung, L);
      if (text) prinzZeilen.push(fuellen(text, werte));
    });
    if (prinzZeilen.length) abschnitte.push({ titel: variante(bausteine.prinzipien_titel, L), zeilen: prinzZeilen, liste: true });

    /* 6. Sicherheit und Grenzen */
    var S = bausteine.sicherheit;
    var grenzen = alsListe(variante(S.allgemein, L)).slice();
    (fach.regeln || []).forEach(function (r) {
      if (S.regeln[r]) {
        var t = variante(S.regeln[r], L);
        if (t) grenzen.push(fuellen(t, werte));
      }
    });
    if (auswahl.format === 'programmieren' && S.regeln.code && (fach.regeln || []).indexOf('code') === -1) grenzen.push(variante(S.regeln.code, L));
    if (auswahl.format === 'feedback') grenzen.push(variante(S.feedback, L));
    if (fremdsprache && !L && S.fremdsprache) {
      var fs = variante(S.fremdsprache, L);
      if (fs) grenzen.push(fuellen(fs, werte));
    }
    var experimentBlock = null;
    if (auswahl.format === 'experiment') {
      var regeln = S.experiment.regeln.slice();
      if (!L && klasse < S.experiment.begleitung_ab_klasse) regeln.push(fuellen(S.experiment.begleitung, werte));
      regeln.push(S.experiment.ablehnen);
      experimentBlock = { titel: S.experiment.einleitung, zeilen: regeln, liste: true };
    }
    abschnitte.push({ titel: S.titel, zeilen: grenzen, liste: true });
    if (experimentBlock) abschnitte.push(experimentBlock);

    /* 7. Interaktion */
    if (format.interaktion !== false) {
      abschnitte.push({ titel: bausteine.interaktion.titel, zeilen: [variante(bausteine.interaktion, L)] });
    }

    /* 8. Abschluss: Reflexionsfrage und die beiden immer aktiven Bausteine (kurz) */
    var ende = [];
    if (L) ende.push(bausteine.abschluss.lehrkraft);
    else ende.push(waehle(bausteine.abschluss.reflexion[band], (thema ? thema.id : themaName) + auswahl.format));
    reihenfolge.forEach(function (id) {
      var p = bausteine.prinzipien[id];
      if (p && p.immer && verstaerkt.indexOf(id) === -1) ende.push(fuellen(variante(p.kurz, L), werte));
    });
    abschnitte.push({ titel: bausteine.abschluss.titel, zeilen: ende });

    /* Text zusammensetzen */
    var text = abschnitte.map(function (ab) {
      var zeilen = ab.zeilen.filter(function (z) { return z && String(z).trim(); });
      if (!zeilen.length) return '';
      var body = ab.liste ? zeilen.map(function (z) { return '- ' + z; }).join('\n') : zeilen.join('\n');
      return ab.titel + '\n' + body;
    }).filter(Boolean).join('\n\n');

    /* Prüfungen */
    if (/\{[a-z_]+\}/.test(text)) warnungen.push('Platzhalter nicht ersetzt: ' + (text.match(/\{[a-z_]+\}/g) || []).join(', '));
    var eigenerText = (auswahl.optionen && auswahl.optionen.eigener_text) ? String(auswahl.optionen.eigener_text).length : 0;
    var nutzertext = eigenerText + werte.genauer.length + werte.vorwissen.length + werte.huerde.length;
    var netto = text.length - nutzertext;
    /* „etwa“: zehn Prozent Spielraum; im Lehrkraft-Modus das Anderthalbfache */
    var grenze = Math.round((format.max_zeichen || 2500) * (L ? 1.5 : 1.1));
    if (netto > grenze) warnungen.push('Prompt länger als vorgesehen: ' + netto + ' > ' + grenze + ' Zeichen');

    /* Anschlussfragen: 3 bis 5, erst Format, dann gewählte Prinzipien, dann allgemein */
    var anschluss = [];
    function add(s) { if (s && anschluss.indexOf(s) === -1 && anschluss.length < 5) anschluss.push(s); }
    alsListe(format.anschluss).forEach(add);
    reihenfolge.forEach(function (id) {
      var p = bausteine.prinzipien[id];
      if (!p) return;
      if ((p.immer && verstaerkt.indexOf(id) !== -1) || (!p.immer && gewaehlt.indexOf(id) !== -1)) add(p.anschluss);
    });
    if (bausteine.prinzipien.gegenargumente && gewaehlt.indexOf('gegenargumente') === -1 && ['erklaerung', 'fakten', 'stunde'].indexOf(auswahl.format) !== -1) add(bausteine.prinzipien.gegenargumente.anschluss);
    alsListe(variante(bausteine.anschluss_allgemein, L)).forEach(function (s) { if (anschluss.length < 4) add(s); });
    if (bausteine.prinzipien.halluzination) add(bausteine.prinzipien.halluzination.anschluss);

    return { text: text, abschnitte: abschnitte, anschluss: anschluss, zeichen: text.length, nutzertext: nutzertext, warnungen: warnungen };
  }

  /* Voreinstellungen je Format (Prinzipien, Bloom) */
  function voreinstellung(formatId, thema, bausteine) {
    var f = bausteine.formate[formatId];
    return {
      prinzipien: f && f.prinzipien ? f.prinzipien.slice() : [],
      bloom: thema && thema.bloom && thema.bloom.length ? thema.bloom[0] : null
    };
  }

  return { bauen: bauen, voreinstellung: voreinstellung, fuellen: fuellen, variante: variante };
})();
