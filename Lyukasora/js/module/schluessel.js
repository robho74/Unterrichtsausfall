/* Lyukasora – Modul „Eigener Schlüssel“
 * Lädt nur auf Klick aus den Einstellungen. Der Prompt läuft direkt gegen den Anbieter,
 * die Antwort erscheint in einer Chatansicht mit Anschlussfragen-Knöpfen.
 * Unterstützt: Anthropic (Browserzugriff mit Header anthropic-dangerous-direct-browser-access),
 * OpenAI-kompatible Endpunkte (Basis-URL frei, also auch Schul-Proxys oder Ollama), Google Gemini.
 * Der Schlüssel bleibt im localStorage dieses Geräts.
 */
window.LYU = window.LYU || {};

LYU.schluessel = (function () {
  'use strict';

  var el = function () { return LYU.ui.el.apply(null, arguments); };
  var T = function (k, L, w) { return LYU.T(k, L, w); };

  var ANBIETER = {
    anthropic: { name: 'Anthropic (Claude)', modell: 'claude-sonnet-5', basis: 'https://api.anthropic.com', hilfe: 'Schlüssel unter console.anthropic.com. Der Browserzugriff muss in der Konsole für den Schlüssel erlaubt sein.' },
    openai: { name: 'OpenAI-kompatibel (OpenAI, Schul-Proxy, Ollama, Mistral …)', modell: 'gpt-4o-mini', basis: 'https://api.openai.com/v1', hilfe: 'Basis-URL z. B. https://api.openai.com/v1, http://localhost:11434/v1 für Ollama oder die Adresse des Schul-Proxys.' },
    gemini: { name: 'Google Gemini', modell: 'gemini-2.5-flash', basis: 'https://generativelanguage.googleapis.com/v1beta', hilfe: 'Kostenloses Kontingent gegen Anmeldung unter aistudio.google.com. Für Schüler nicht geeignet (Konto ab 16 in Deutschland).' }
  };

  /* ---------- Einrichtung ---------- */
  function einrichten(E, L) {
    var A = LYU.aktionen;
    var S = E.schluessel || (E.schluessel = { anbieter: 'anthropic', key: '', basisUrl: '', modell: '' });
    var sel = el('select', { id: 'sk-anbieter' });
    Object.keys(ANBIETER).forEach(function (id) { var o = el('option', { value: id, text: ANBIETER[id].name }); if (S.anbieter === id) o.selected = true; sel.appendChild(o); });
    var key = el('input', { type: 'password', id: 'sk-key', autocomplete: 'off', placeholder: 'API-Schlüssel' });
    key.value = S.key || '';
    var basis = el('input', { type: 'url', id: 'sk-basis', placeholder: ANBIETER[S.anbieter || 'anthropic'].basis });
    basis.value = S.basisUrl || '';
    var modell = el('input', { type: 'text', id: 'sk-modell', placeholder: ANBIETER[S.anbieter || 'anthropic'].modell });
    modell.value = S.modell || '';
    var hilfe = el('p', { class: 'hinweis sanft', text: ANBIETER[S.anbieter || 'anthropic'].hilfe });
    sel.addEventListener('change', function () { basis.placeholder = ANBIETER[sel.value].basis; modell.placeholder = ANBIETER[sel.value].modell; hilfe.textContent = ANBIETER[sel.value].hilfe; });
    var status = el('p', { class: 'hinweis sanft', text: '' });
    var d;
    function speichern() {
      S.anbieter = sel.value; S.key = key.value.trim(); S.basisUrl = basis.value.trim(); S.modell = modell.value.trim();
      LYU.einstellungen.speichern(E);
    }
    d = A.dialog([
      el('div', { class: 'dialog-kopf' }, [el('h2', { class: 'dialog-titel', text: T('einst_schluessel_titel', L) }), el('button', { type: 'button', class: 'icon-btn', 'aria-label': T('schliessen', L), html: '&#x2715;', onclick: function () { d.close(); } })]),
      el('p', { class: 'hinweis', text: 'Der Schlüssel wird nur auf diesem Gerät gespeichert und direkt an den gewählten Anbieter gesendet. Auf gemeinsam genutzten Rechnern nicht eintragen. Kosten entstehen beim Anbieter.' }),
      el('label', { class: 'feld-label', for: 'sk-anbieter', text: 'Anbieter' }), sel, hilfe,
      el('label', { class: 'feld-label', for: 'sk-key', text: 'Schlüssel' }), key,
      el('label', { class: 'feld-label', for: 'sk-basis', text: 'Basis-URL (optional)' }), basis,
      el('label', { class: 'feld-label', for: 'sk-modell', text: 'Modell (optional)' }), modell,
      status,
      el('div', { class: 'dialog-knoepfe' }, [
        el('button', { type: 'button', class: 'btn gefahr', text: 'Schlüssel löschen', onclick: function () { key.value = ''; speichern(); A.toast('Schlüssel gelöscht'); d.close(); } }),
        el('button', { type: 'button', class: 'btn', text: 'Verbindung testen', onclick: function () {
          speichern(); status.textContent = 'Teste …';
          anfrage(S, [{ rolle: 'user', text: 'Antworte nur mit dem Wort: bereit' }]).then(function (a) { status.textContent = 'Antwort: ' + a.slice(0, 60); }, function (e) { status.textContent = 'Fehler: ' + e.message; });
        } }),
        el('button', { type: 'button', class: 'btn primaer', text: T('speichern', L), onclick: function () { speichern(); A.toast(T('gespeichert', L)); d.close(); LYU.ui.render(); } })
      ])
    ], 'gross');
  }

  /* ---------- Anfragen ---------- */
  function anfrage(S, verlauf) {
    var anbieter = S.anbieter || 'anthropic';
    var basis = (S.basisUrl || ANBIETER[anbieter].basis).replace(/\/$/, '');
    var modell = S.modell || ANBIETER[anbieter].modell;
    if (!S.key) return Promise.reject(new Error('Kein Schlüssel eingetragen.'));
    if (anbieter === 'anthropic') {
      return fetch(basis + '/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': S.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: modell, max_tokens: 2048, messages: verlauf.map(function (m) { return { role: m.rolle, content: m.text }; }) })
      }).then(pruefeAntwort).then(function (j) { return (j.content || []).map(function (c) { return c.text || ''; }).join(''); });
    }
    if (anbieter === 'gemini') {
      return fetch(basis + '/models/' + encodeURIComponent(modell) + ':generateContent?key=' + encodeURIComponent(S.key), {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: verlauf.map(function (m) { return { role: m.rolle === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }; }) })
      }).then(pruefeAntwort).then(function (j) {
        var k = j.candidates && j.candidates[0];
        return k && k.content && k.content.parts ? k.content.parts.map(function (p) { return p.text || ''; }).join('') : '';
      });
    }
    return fetch(basis + '/chat/completions', {
      method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + S.key },
      body: JSON.stringify({ model: modell, messages: verlauf.map(function (m) { return { role: m.rolle, content: m.text }; }) })
    }).then(pruefeAntwort).then(function (j) { return j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content || '' : ''; });
  }

  function pruefeAntwort(r) {
    if (r.ok) return r.json();
    return r.text().then(function (t) { throw new Error(r.status + ' ' + (t || r.statusText).slice(0, 200)); });
  }

  /* ---------- Chatansicht ---------- */
  function oeffnen(E, prompt) {
    var A = LYU.aktionen, L = !!E.lehrkraft;
    var verlauf = [];
    var chat = el('div', { class: 'chat', 'aria-live': 'polite' });
    var eingabe = el('textarea', { rows: '2', placeholder: 'Weiterfragen …' });
    var senden = el('button', { type: 'button', class: 'btn primaer', text: 'Senden' });
    var knoepfe = el('div', { class: 'chat-knoepfe' });
    ['Was spricht dagegen?', 'Frag mich ab, eine Frage nach der anderen.', 'Erklär es einfacher.', 'Nenne drei Aussagen, die ich nachprüfen sollte.'].forEach(function (f) {
      knoepfe.appendChild(el('button', { type: 'button', class: 'btn klein', text: f, onclick: function () { schicken(f); } }));
    });
    var d;
    function zeige(rolle, text) {
      var n = el('div', { class: 'chat-nachricht ' + (rolle === 'user' ? 'ich' : 'ki'), text: text });
      chat.appendChild(n); chat.scrollTop = chat.scrollHeight;
      return n;
    }
    function schicken(text) {
      if (!text.trim()) return;
      verlauf.push({ rolle: 'user', text: text });
      zeige('user', text.length > 600 ? text.slice(0, 600) + ' …' : text);
      var warten = zeige('assistant', '…');
      senden.disabled = true;
      anfrage(E.schluessel, verlauf).then(function (a) {
        warten.textContent = a || '(leere Antwort)';
        verlauf.push({ rolle: 'assistant', text: a });
      }, function (e) {
        warten.textContent = 'Fehler: ' + e.message;
        verlauf.pop();
      }).then(function () { senden.disabled = false; });
    }
    senden.addEventListener('click', function () { var t = eingabe.value; eingabe.value = ''; schicken(t); });
    eingabe.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); senden.click(); } });
    d = A.dialog([
      el('div', { class: 'dialog-kopf' }, [el('h2', { class: 'dialog-titel', text: 'Direkt im Werkzeug' }), el('button', { type: 'button', class: 'icon-btn', 'aria-label': T('schliessen', L), html: '&#x2715;', onclick: function () { d.close(); } })]),
      el('p', { class: 'hinweis sanft', text: 'Antworten kommen von ' + (ANBIETER[E.schluessel.anbieter] || {}).name + '. Prüfe sie wie jede KI-Antwort.' }),
      chat, knoepfe,
      el('div', { class: 'chat-eingabe' }, [eingabe, senden])
    ], 'gross');
    schicken(prompt);
  }

  return { einrichten: einrichten, oeffnen: oeffnen, anfrage: anfrage };
})();
