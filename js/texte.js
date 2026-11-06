/* Lyukasora – Texte der Oberfläche
 * Du-Form für Schüler, Sie-Form im Lehrkraft-Modus. Strings ohne Objekt gelten für beide.
 */
window.LYU = window.LYU || {};

LYU.texte = {
  untertitel: { du: 'Prompts, die dich zum Denken bringen', sie: 'Prompts, die Schüler zum Denken bringen' },
  einleitung: { du: 'In fünf Schritten zu einem Prompt, mit dem dir eine KI beim Lernen hilft, statt dir nur Antworten zu liefern.', sie: 'In fünf Schritten zu einem Prompt für Unterrichtsvorbereitung oder Schülerarbeit, mit den Lernverstärker-Prinzipien eingebaut.' },

  schritt_klasse: { du: 'Ich bin in Klasse …', sie: 'Klassenstufe' },
  schritt_fach: { du: 'Mein Fach', sie: 'Fach' },
  schritt_thema: { du: 'Mein Thema', sie: 'Thema' },
  schritt_genauer: 'Worum geht es genau?',
  schritt_format: 'Was soll entstehen?',
  schritt_prinzipien: { du: 'Wie soll die KI mit mir arbeiten?', sie: 'Wie soll die KI mit den Schülern arbeiten?' },
  schritt_fein: 'Feinheiten',
  fein_hinweis: { du: 'Sprache, Länge, Ton, Lernziel. Die Voreinstellung passt meistens.', sie: 'Sprache, Länge, Ton, Lernzielebene, Lehrkraft-Modus.' },

  klasse_kurz: 'Klasse {n}',
  niveau_frage: { du: 'Mein Kurs läuft auf …', sie: 'Anforderungsniveau des Kurses' },
  niveau_gA: 'grundlegendem Niveau',
  niveau_eA: 'erhöhtem Niveau',
  niveau_egal: 'egal / weiß nicht',
  nawi_hinweis: 'In Klasse 5 und 6 gehört das zum Naturwissenschaftsunterricht.',

  anderes_thema: 'Anderes Thema',
  anderes_thema_hilfe: { du: 'Steht dein Thema nicht dabei? Schreib es hier hin.', sie: 'Thema aus dem schulinternen Curriculum eintragen.' },
  anderes_thema_platzhalter: { du: 'Wie heißt dein Thema?', sie: 'Bezeichnung des Themas' },
  kc_praefix: 'Im Kerncurriculum: ',

  genauer_label: { du: 'Unterthema oder Lernziel', sie: 'Schwerpunkt oder Lernziel' },
  genauer_hilfe: { du: 'Ein Satz reicht. Was willst du verstehen oder können?', sie: 'Ein Satz: Was sollen die Schüler am Ende verstehen oder können?' },
  stichwort_hinweis: { du: 'Das sieht nach einem Stichwort aus. Ein Satz mehr macht den Prompt deutlich besser: Was genau willst du verstehen oder können?', sie: 'Das sieht nach einem Stichwort aus. Ein Satz mehr macht den Prompt deutlich besser: Was genau sollen die Schüler verstehen oder können?' },
  vorwissen_label: { du: 'Was weiß ich schon?', sie: 'Vorwissen der Klasse' },
  vorwissen_platzhalter: { du: 'optional, z. B. Die Grundbegriffe aus der letzten Stunde kenne ich', sie: 'optional, z. B. Grundbegriffe aus der Vorstunde sind bekannt' },
  huerde_label: { du: 'Wo hänge ich?', sie: 'Bekannte Schwierigkeiten' },
  huerde_platzhalter: { du: 'optional, z. B. Sobald die Aufgabe anders formuliert ist, weiß ich nicht mehr weiter', sie: 'optional, z. B. Begriffe werden verwechselt, sobald die Aufgabe anders formuliert ist' },
  weiter: 'Weiter',

  format_option_titel: { du: 'Einstellungen dazu', sie: 'Einstellungen dazu' },
  feedback_pflicht: { du: 'Für Feedback brauchst du deinen Text: Füge ihn oben ein.', sie: 'Für Feedback wird der Schülertext benötigt.' },
  taeuschung_hinweis: { du: 'Das Werkzeug schreibt keine Hausaufgaben fertig. Es hilft dir, deinen eigenen Text besser zu machen.', sie: 'Das Werkzeug erzeugt keine fertigen Schülertexte; Textformate sind als Feedback und gemeinsames Überarbeiten angelegt.' },

  immer_dabei: 'immer dabei',
  verstaerken: 'Verstärken',
  prinzipien_hinweis: { du: 'Zwei Prinzipien sind immer drin. Die anderen wählst du, die Voreinstellung passt zum Format.', sie: 'Zwei Prinzipien sind immer enthalten, die anderen sind je Format vorbelegt und frei wählbar.' },

  sprache_label: 'Sprache der Antwort',
  laenge_label: 'Länge',
  ton_label: 'Ton',
  bloom_label: { du: 'Was will ich damit können?', sie: 'Lernzielebene' },
  lehrkraft_schalter: 'Ich bin Lehrkraft',
  lehrkraft_hilfe: 'Schaltet auf Unterrichtsplanung, Differenzierung und Erwartungshorizont um. Die Oberfläche wechselt in die Sie-Form.',

  ergebnis_titel: { du: 'Dein Prompt', sie: 'Ihr Prompt' },
  ergebnis_hinweis: { du: 'Lies ihn kurz durch: So sieht ein guter Prompt aus.', sie: 'Der Prompt ist so formuliert, dass Schüler ihn lesen und verstehen können.' },
  kopieren: 'Prompt kopieren',
  kopiert: 'Kopiert',
  kopieren_fehler: { du: 'Kopieren hat nicht geklappt. Der Text ist markiert, kopiere ihn von Hand.', sie: 'Kopieren hat nicht geklappt. Der Text ist markiert, bitte von Hand kopieren.' },
  oeffnen_titel: 'Direkt öffnen',
  oeffnen_hinweis: { du: 'Am besten im Chatbot deiner Schule. Bei den anderen gelten Altersregeln der Anbieter.', sie: 'Am besten im Chatbot der Schule. Bei den anderen gelten die Altersregeln der Anbieter.' },
  oeffnen_zu_lang: { du: 'Der Prompt ist zu lang für die Adresszeile. Kopieren und einfügen klappt immer.', sie: 'Der Prompt ist zu lang für die Adresszeile. Kopieren und Einfügen klappt immer.' },
  oeffnen_in: 'In {name} öffnen',
  oeffnen_sendet: 'schickt sofort ab',
  oeffnen_kopiert_dann: { du: 'Prompt kopiert. Jetzt in {name} einfügen.', sie: 'Prompt kopiert. Jetzt in {name} einfügen.' },
  weiter_titel: { du: 'So machst du weiter', sie: 'So geht es weiter' },
  weiter_hinweis: { du: 'Schick eine dieser Nachrichten hinterher, wenn die erste Antwort da ist.', sie: 'Anschlussfragen für den weiteren Chat, einzeln kopierbar.' },
  anschluss_kopieren: 'Kopieren',
  merken: 'Prompt merken',
  merken_titel_label: 'Titel',
  merken_titel_platzhalter: 'z. B. Chemie Säuren Quiz',
  merken_speichern: 'Merken',
  gemerkt_ok: 'Gemerkt. Du findest ihn oben unter „Gemerkte Prompts“.',
  gemerkt_ok_sie: 'Gemerkt. Sie finden ihn oben unter „Gemerkte Prompts“.',
  gemerkt_titel: 'Gemerkte Prompts',
  gemerkt_leer: { du: 'Noch nichts gemerkt. Unter jedem fertigen Prompt gibt es „Prompt merken“.', sie: 'Noch nichts gemerkt. Unter jedem fertigen Prompt gibt es „Prompt merken“.' },
  gemerkt_hinweis: 'Bleibt nur auf diesem Gerät gespeichert, höchstens 30 Einträge.',
  loeschen: 'Löschen',
  neu: 'Neu anfangen',
  neu_bestaetigen: { du: 'Alles zurücksetzen und neu anfangen?', sie: 'Alles zurücksetzen und neu anfangen?' },
  ja: 'Ja',
  abbrechen: 'Abbrechen',
  schliessen: 'Schließen',
  aendern: 'Ändern',
  zum_prompt: { du: 'Zu deinem Prompt', sie: 'Zum Prompt' },
  zeichen: '{n} Zeichen',

  einstellungen: 'Einstellungen',
  einst_schulbot_titel: 'Unser Schul-Chatbot',
  einst_schulbot_hilfe: 'Hat die Schule einen eigenen KI-Chatbot (AIS.chat, fobizz, schulKI oder ein anderer)? Name und Link eintragen, dann erscheint er als erster Button. Enthält der Link {prompt}, wird der Prompt dort eingesetzt; sonst wird er kopiert und die Seite geöffnet.',
  einst_schulbot_name: 'Name',
  einst_schulbot_url: 'Link (https://…)',
  einst_anbieter_titel: 'Direktöffnen-Buttons',
  einst_anbieter_hilfe: 'Welche Dienste als Button angeboten werden. Die Schule kann hier ausblenden, was sie nicht möchte.',
  einst_lehrkraft_titel: 'Lehrkraft-Modus',
  einst_darstellung_titel: 'Darstellung',
  darstellung_auto: 'Wie das System',
  darstellung_hell: 'Hell',
  darstellung_dunkel: 'Dunkel',
  einst_schluessel_titel: 'Eigener Schlüssel (optional)',
  einst_schluessel_hilfe: 'Wer einen API-Schlüssel hat (Lehrkraft, Schule, Elternhaus), kann den Prompt direkt hier laufen lassen. Der Schlüssel bleibt auf diesem Gerät. Nicht auf geteilten Rechnern eintragen.',
  einst_schluessel_oeffnen: 'Schlüssel-Modul öffnen',
  einst_labor_titel: 'Experimentierlabor: Modell im Browser',
  einst_labor_hilfe: 'Ein kleines Sprachmodell läuft direkt im Browser, ohne Konto und ohne dass Daten das Gerät verlassen. Braucht einen Rechner mit WebGPU und einen einmaligen Download von etwa einem Gigabyte. Die Antworten sind schwächer als bei großen Modellen und eignen sich zum Üben: Fehler finden.',
  einst_labor_oeffnen: 'Labor öffnen',
  einst_zuruecksetzen: 'Alle Einstellungen und gemerkten Prompts löschen',
  einst_zuruecksetzen_bestaetigen: 'Wirklich alles auf diesem Gerät löschen?',
  speichern: 'Speichern',
  gespeichert: 'Gespeichert',

  datenschutz: 'Datenschutz',
  ueber: 'Über dieses Werkzeug',
  blatt: 'Lernverstärker-Blatt (PDF)',
  offline_bereit: 'Für die Offline-Nutzung gespeichert.',
  update_bereit: 'Neue Version verfügbar.',
  neu_laden: 'Neu laden',
  installieren: 'Auf dem Handy installieren',
  fehler_daten: 'Die Daten konnten nicht geladen werden. Bitte die Seite neu laden.'
};

LYU.T = function (key, lehrkraft, werte) {
  var t = LYU.texte[key];
  if (t === undefined) return key;
  if (typeof t === 'object') t = lehrkraft ? t.sie : t.du;
  if (werte) {
    Object.keys(werte).forEach(function (k) { t = t.split('{' + k + '}').join(String(werte[k])); });
  }
  return t;
};
