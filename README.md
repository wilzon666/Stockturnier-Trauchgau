# Stocksport Turnierplaner (Stocksport Tournament Planner)

Ein modernes, benutzerfreundliches und funktionsreiches System zur Organisation, Durchführung und Auswertung von Stocksport-Turnieren. Das Programm unterstützt sowohl den klassischen **Teambewerb** als auch den **Zielwettbewerb** (nach offiziellen Richtlinien) und bietet einen innovativen **3-Bahnen Spezial-Modus** für Gruppenphasen mit integrierten Platzierungsspielen.

## Hauptfunktionen (Features)

*   **🏆 Teambewerb (Standard):** Automatische Erstellung von Jeder-gegen-Jeden-Spielplänen (Round Robin) mit wählbarer Kehrenanzahl (Standard: 6 Kehren) und automatischer Bahnzuteilung.
*   **⚡ 3-Bahnen Spezial-Modus (Vorrunde & Platzierungsspiele):**
    *   Teilt Mannschaften in **Gruppe A** und **Gruppe B** auf.
    *   Generiert Vorrundenspiele auf maximal **3 Bahnen** (4 Kehren pro Spiel).
    *   Führt die Spiele kompakt in Durchgängen (Dg.) zusammen.
    *   Erzeugt auf Knopfdruck **Platzierungsspiele** (z. B. Platz 1 vs. Platz 1 um den Turniersieg, Platz 2 vs. Platz 2, usw.) mit 6 Kehren.
    *   Erstellt eine vollautomatische Gesamtwertung, die Vorrunden-Ergebnisse und Platzierungsspiele zu einer offiziellen Endstand-Tabelle vereint.
*   **🎯 Zielwettbewerb:** Verwaltung von Einzelschützen nach offiziellen Vorgaben (4 Durchgänge à 6 Kehren: Massen, Anschießen, Platzieren, Kombinationsspiel) inklusive automatischer Punkteberechnung und Rangliste.
*   **📱 Live-Score-Eingabe (LiveEntry):** Übersichtliche Weboberfläche für Kampfrichter oder Bahnleiter zur schnellen Eingabe von Spielergebnissen in Echtzeit.
*   **📊 Berichte & PDF-Druck:** Generierung von druckfertigen Anschlagtafeln, Schusszetteln, Urkunden und offiziellen Ergebnislisten (getrennt nach Gruppe A/B sowie dem finalen Endstand).
*   **💾 Dateibasierte Persistenz:** Keine schwere SQL-Datenbank notwendig! Turniere werden in einer kompakten JSON-Datenbank gespeichert, was maximale Portabilität bietet.

---

## Voraussetzungen (Prerequisites)

*   **Node.js:** Version `18.x` oder `20.x` (empfohlen: `v20.x`)
*   **Docker:** (Optional, nur für den Container-Betrieb) Docker Engine und Docker Compose.

---

## 🚀 Lokale Installation und Start (Native Node.js)

### 1. Repository klonen & Abhängigkeiten installieren
Navigieren Sie im Terminal in Ihr Projektverzeichnis und installieren Sie die npm-Pakete:
```bash
npm install
```

### 2. Umgebungsvariablen einrichten
Erstellen Sie eine `.env`-Datei basierend auf der `.env.example`:
```bash
cp .env.example .env
```
Füllen Sie bei Bedarf die Variablen aus:
*   `GEMINI_API_KEY`: Ihr Google Gemini API-Schlüssel (falls Sie KI-Funktionen nutzen möchten).
*   `APP_URL`: Die URL der App (standardmäßig `http://localhost:3000`).

### 3. Entwicklungsserver starten (Development Mode)
Der Entwicklungsserver startet sowohl den Express-Backend-Server als auch das Vite-Frontend mit Hot Module Replacement (HMR) auf Port 3000:
```bash
npm run dev
```
Öffnen Sie nun **[http://localhost:3000](http://localhost:3000)** in Ihrem Browser.

### 4. Build für Produktion erstellen
Kompiliert das React-Frontend in hochoptimierte statische Dateien (`dist/`) und bündelt das Express-Backend mit `esbuild` in eine einzelne, schnelle CommonJS-Datei (`dist/server.cjs`):
```bash
npm run build
```

### 5. Produktionsserver starten
Startet das compilierte Full-Stack-System im produktionsoptimierten Modus:
```bash
npm run start
```

---

## 🐳 Container-Betrieb (Docker & Docker Compose)

Für maximale Stabilität, Isolation und einfache Bereitstellung kann die Anwendung vollständig als Docker-Container betrieben werden.

### 1. Starten mit Docker Compose (Empfohlen)
Docker Compose baut das Image automatisch und startet den Container. Es konfiguriert zudem ein Docker-Volume, um die Turnierdaten (`db.json`) persistent auf Ihrem Host-System zu sichern, sodass sie bei Container-Updates nicht verloren gehen.

Führen Sie im Projektverzeichnis aus:
```bash
docker compose up -d --build
```

Die Anwendung ist nun unter **[http://localhost:3000](http://localhost:3000)** erreichbar.

### 2. Nützliche Docker-Befehle
*   **Container stoppen:**
    ```bash
    docker compose down
    ```
*   **Logs anzeigen:**
    ```bash
    docker compose logs -f
    ```
*   **Daten-Backup:** Die Datenbank wird im Docker-Volume gespeichert. Möchten Sie die `db.json` direkt auf Ihrem Host-Dateisystem sichern, befindet sie sich im Container unter `/app/src/data/db.json`.

---

## 🗄️ Datenstruktur & Datenspeicherung (Datenbank)

Die Anwendung nutzt eine extrem schlanke, dateibasierte JSON-Datenbank, die in folgendem Pfad liegt:
`src/data/db.json`

*   Das Verzeichnis und die Datei werden beim ersten Start der Anwendung **automatisch generiert**, falls sie noch nicht vorhanden sind.
*   Bei Verwendung von **Docker Compose** wird dieses Verzeichnis auf das Volume `stocksport-data` gemountet. Das garantiert, dass Ihre Turnierstände, Mannschaften und Ergebnisse dauerhaft auf der Festplatte des Host-Systems gespeichert sind.

---

## 🛠️ Technische Details (Tech Stack)

*   **Frontend:** React 19, TypeScript, Tailwind CSS, Vite, Motion (Animations)
*   **Backend:** Express (Node.js), TypeScript compiler `tsx`
*   **Bundler/Compiler:** Vite (Frontend), Esbuild (Backend)
*   **Icons:** Lucide React
