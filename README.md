# Lyukasora

Lyukasora erstellt in fünf Schritten (Klasse, Fach, Thema, Format, Lernverstärker) einen Prompt für Schülerinnen und Schüler am Gymnasium (Klasse 5–13, Niedersachsen). Mit diesem Prompt hilft eine KI beim Lernen, statt nur Antworten zu liefern.

Die App ist eine statische Progressive Web App ohne Build-Schritt und ohne Abhängigkeiten. Sie funktioniert auch offline.

## Starten

- **Direkt aus dem Ordner:** `index.html` im Browser öffnen. Die Daten kommen dann aus `data/*.js`.
- **Lokal gehostet** (für PWA und Service Worker):
  ```sh
  python3 -m http.server 8000
  ```
  Danach http://localhost:8000 öffnen.
- **GitHub Pages:** Unter Settings → Pages den Branch `main` und den Ordner `/ (root)` wählen.

## Struktur

| Pfad | Inhalt |
|---|---|
| `index.html` | Einstiegsseite |
| `css/app.css` | Styles (Hell- und Dunkelmodus) |
| `js/` | App-Logik (`app.js`, `ui.js`, `assembler.js`, `filter.js`, …) |
| `js/module/` | Optionale Module, die erst bei Bedarf geladen werden (eigener API-Schlüssel, Labor) |
| `data/` | Themen und Prompt-Bausteine, jeweils als `.json` (gehostet) und `.js` (Aufruf über `file://`) |
| `fonts/` | Bricolage Grotesque, Lizenz in `fonts/OFL.txt` |
| `icons/` | App-Icons und Screenshots für das Manifest |
| `sw.js`, `manifest.webmanifest` | Offline-Cache und PWA-Manifest |
| `lernverstaerker.pdf` | Handout zu den Lernverstärkern |

## Daten ändern

`data/themen.json` bzw. `data/bausteine.json` und die zugehörige `.js`-Datei müssen inhaltlich gleich bleiben. Nach Änderungen an App-Dateien `VERSION` in `sw.js` erhöhen, damit Nutzer die neue Version bekommen.

## Hinweis zum eigenen API-Schlüssel

Das Modul „Eigener Schlüssel“ schickt Anfragen direkt aus dem Browser an den gewählten Anbieter. Der Schlüssel wird nur im `localStorage` des Geräts gespeichert.
