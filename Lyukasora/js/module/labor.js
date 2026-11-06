/* Lyukasora – Experimentierlabor „Modell im Browser“
 * Lädt nur auf Klick. Führt mit WebLLM (MLC) ein kleines offenes Modell direkt im Browser auf der
 * Grafikkarte aus: kein Schlüssel, kein Konto, keine Daten verlassen das Gerät. Braucht WebGPU (Chrome, Edge
 * auf einem halbwegs aktuellen Rechner) und einen einmaligen Download von etwa einem Gigabyte.
 * Die WebLLM-Bibliothek kommt bei Klick von cdn.jsdelivr.net; die Modelldateien von den Servern des
 * MLC-Projekts (Hugging Face). Das ist die einzige Stelle, an der das Werkzeug fremden Code nachlädt,
 * und sie ist als Experiment gekennzeichnet.
 */
window.LYU = window.LYU || {};

LYU.labor = (function () {
  'use strict';

  var el = function () { return LYU.ui.el.apply(null, arguments); };
  var WEBLLM_URL = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm';
  var MODELLE = [
    { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5, 1,5 Mrd. Parameter (etwa 1 GB, schneller, einfachere Antworten)' },
    { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5, 3 Mrd. Parameter (etwa 2 GB, bessere Antworten, braucht mehr Grafikspeicher)' },
    { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2, 3 Mrd. Parameter (etwa 2 GB)' }
  ];
  var engine = null, geladenesModell = null;

  function oeffnen(L) {
    var A = LYU.aktionen;
    var hatWebGPU = !!navigator.gpu;
    var d;
    var status = el('p', { class: 'hinweis sanft', text: hatWebGPU ? 'WebGPU ist verfügbar.' : 'Dieser Browser oder dieses Gerät hat kein WebGPU. Auf Handys klappt es meist nicht; am Rechner Chrome oder Edge verwenden.' });
    var sel = el('select', { id: 'labor-modell' });
    MODELLE.forEach(function (m) { sel.appendChild(el('option', { value: m.id, text: m.name })); });
    var balken = el('div', { class: 'fortschritt' }, [el('div')]);
    var chat = el('div', { class: 'chat', 'aria-live': 'polite' });
    var eingabe = el('textarea', { rows: '3', placeholder: 'Prompt hier einfügen oder eine Frage stellen …' });
    var zustand = LYU.ui.zustand && LYU.ui.zustand();
    var letzter = document.getElementById('prompt-text');
    if (letzter && letzter.value) eingabe.value = letzter.value;
    var senden = el('button', { type: 'button', class: 'btn primaer', text: 'Senden', disabled: true });
    var laden = el('button', { type: 'button', class: 'btn', text: 'Modell laden (Download)', disabled: !hatWebGPU });
    var verlauf = [];

    function zeige(rolle, text) {
      var n = el('div', { class: 'chat-nachricht ' + (rolle === 'user' ? 'ich' : 'ki'), text: text });
      chat.appendChild(n); chat.scrollTop = chat.scrollHeight; return n;
    }

    laden.addEventListener('click', function () {
      laden.disabled = true;
      status.textContent = 'Bibliothek wird geladen …';
      import(WEBLLM_URL).then(function (webllm) {
        status.textContent = 'Modell wird geladen. Beim ersten Mal ist das ein Download von ein bis zwei Gigabyte; danach liegt es im Browser-Cache.';
        return webllm.CreateMLCEngine(sel.value, {
          initProgressCallback: function (p) {
            balken.firstChild.style.width = Math.round((p.progress || 0) * 100) + '%';
            status.textContent = p.text || '';
          }
        });
      }).then(function (e) {
        engine = e; geladenesModell = sel.value;
        status.textContent = 'Modell bereit. Denk daran: Kleine Modelle irren häufiger. Suche die Fehler, das ist die Übung.';
        senden.disabled = false;
        balken.firstChild.style.width = '100%';
      }).catch(function (e) {
        status.textContent = 'Laden fehlgeschlagen: ' + (e && e.message ? e.message : e) + '. Mögliche Ursachen: kein WebGPU, zu wenig Grafikspeicher, keine Verbindung zu den Modellservern.';
        laden.disabled = false;
      });
    });

    function schicken(text) {
      if (!engine || !text.trim()) return;
      verlauf.push({ role: 'user', content: text });
      zeige('user', text.length > 600 ? text.slice(0, 600) + ' …' : text);
      var n = zeige('assistant', '…');
      senden.disabled = true;
      var gesamt = '';
      engine.chat.completions.create({ messages: verlauf, stream: true, max_tokens: 700, temperature: 0.7 }).then(function (stream) {
        function naechster() {
          return stream.next().then(function (r) {
            if (r.done) return;
            var teil = r.value && r.value.choices && r.value.choices[0] && r.value.choices[0].delta ? (r.value.choices[0].delta.content || '') : '';
            gesamt += teil; n.textContent = gesamt; chat.scrollTop = chat.scrollHeight;
            return naechster();
          });
        }
        return naechster();
      }).then(function () {
        verlauf.push({ role: 'assistant', content: gesamt });
        senden.disabled = false;
      }).catch(function (e) { n.textContent = 'Fehler: ' + (e && e.message ? e.message : e); senden.disabled = false; verlauf.pop(); });
    }
    senden.addEventListener('click', function () { var t = eingabe.value; eingabe.value = ''; schicken(t); });

    d = A.dialog([
      el('div', { class: 'dialog-kopf' }, [el('h2', { class: 'dialog-titel', text: 'Experimentierlabor' }), el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Schließen', html: '&#x2715;', onclick: function () { d.close(); } })]),
      el('p', { class: 'hinweis', text: 'Experiment: Ein kleines Sprachmodell läuft direkt in deinem Browser. Es ist deutlich schwächer als ChatGPT oder der Schul-Chatbot und erfindet häufiger Dinge. Genau deshalb eignet es sich zum Üben: Finde die Fehler in seinen Antworten. Nichts, was du hier schreibst, verlässt dein Gerät.' }),
      status,
      el('label', { class: 'feld-label', for: 'labor-modell', text: 'Modell' }), sel,
      el('div', { class: 'chat-knoepfe' }, [laden]),
      balken,
      chat,
      el('div', { class: 'chat-eingabe' }, [eingabe, senden])
    ], 'gross');
  }

  return { oeffnen: oeffnen };
})();
