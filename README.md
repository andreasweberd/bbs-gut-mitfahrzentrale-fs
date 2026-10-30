# BBS GuT Rideshare (Mitfahrzentrale)

[![Build Deployable Artifact (MySQL)](https://github.com/OWNER/REPO/actions/workflows/build-deploy.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/build-deploy.yml)

Produktionsreifes, modernes Web-Portal für die **Schul-Mitfahrzentrale der Berufsbildenden Schule Gestaltung und Technik (BBS GuT Trier)**.

Das System ermöglicht Schülerinnen und Schülern das datenschutzkonforme Anbieten und Suchen von Fahrgemeinschaften über personalisierte Schülertoken – ohne Passwörter, ohne Tracking und mit vollständiger MySQL-Datenbankanbindung.

---

## 📑 Inhaltsverzeichnis

1. [Systemarchitektur](#-systemarchitektur)
2. [Schnellstart mit Docker Compose (Empfohlen)](#-schnellstart-mit-docker-compose-empfohlen)
3. [Manuelle Installation mit eigenem MySQL-Server](#-manuelle-installation-mit-eigenem-mysql-server)
4. [GitHub Actions: Bau & Download des fertigen Artefakts](#-github-actions-bau--download-des-fertigen-artefakts)
5. [Bereitstellung des Artefakts auf einem Produktiv-Server](#-bereitstellung-des-artefakts-auf-einem-produktiv-server)
6. [Umgebungsvariablen (.env)](#-umgebungsvariablen-env)
7. [MySQL-Datenbankschema & Tabellen](#-mysql-datenbankschema--tabellen)
8. [Standard-Zugangsdaten (Test-Tokens)](#-standard-zugangsdaten-test-tokens)
9. [API-Endpunkte & Healthcheck](#-api-endpunkte--healthcheck)

---

## 🏛️ Systemarchitektur

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js & Express (TypeScript, kompiliert mit `esbuild` zu einer performanten Single-File-Server-Datei `dist/server.cjs`)
- **Datenbank**: MySQL 8.0 / MariaDB (via `mysql2/promise` Connection-Pool)
- **Fallback**: Automatischer Graceful-Fallback auf In-Memory-Speicher, falls keine Datenbank konfiguriert oder erreichbar ist (Anwendung stürzt niemals ab)
- **Containerisierung**: Multi-Stage `Dockerfile` und `docker-compose.yml`
- **CI/CD**: GitHub Actions Workflow mit automatischer Schema-Validierung und Artefakt-Generierung

---

## 🐳 Schnellstart mit Docker Compose (Empfohlen)

Die einfachste Möglichkeit, die Anwendung inklusive MySQL-Datenbank mit einem einzigen Befehl lokal oder auf einem Server zu starten:

```bash
# 1. Repository klonen
git clone https://github.com/<DEIN-USER>/<DEIN-REPO>.git
cd <DEIN-REPO>

# 2. Container und MySQL im Hintergrund starten
docker compose up -d --build

# 3. Status überprüfen
docker compose ps
```

Die Anwendung ist sofort unter **`http://localhost:3000`** erreichbar. Die MySQL-Datenbank wird automatisch initialisiert und mit den Standard-Testdaten der BBS GuT befüllt.

Zum Stoppen:
```bash
docker compose down
```

---

## 🛠️ Manuelle Installation mit eigenem MySQL-Server

Falls Sie MySQL oder MariaDB bereits nativ auf Ihrem Linux-/Windows-Server installiert haben:

### 1. MySQL-Datenbank und Nutzer anlegen

Melden Sie sich als Root in Ihrer MySQL-Konsole an:

```bash
mysql -u root -p
```

Führen Sie folgende SQL-Befehle aus:

```sql
CREATE DATABASE IF NOT EXISTS bbs_mitfahrzentrale CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'bbs_user'@'localhost' IDENTIFIED BY 'IhrSicheresPasswort123!';
GRANT ALL PRIVILEGES ON bbs_mitfahrzentrale.* TO 'bbs_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Schema importieren (optional)

> **Hinweis:** Der Node.js-Server prüft beim Start automatisch, ob die Tabellen existieren, legt sie bei Bedarf an und initialisiert sie. Sie können das Schema aber auch manuell importieren:

```bash
mysql -u bbs_user -pIhrSicheresPasswort123! bbs_mitfahrzentrale < schema.sql
```

### 3. Repository konfigurieren

Erstellen Sie eine `.env`-Datei im Projektstamm:

```bash
cp .env.example .env
```

Passen Sie die Zugangsdaten in `.env` an:
```env
PORT=3000
ADMIN_TOKEN=Wulli

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=bbs_user
MYSQL_PASSWORD=IhrSicheresPasswort123!
MYSQL_DATABASE=bbs_mitfahrzentrale
```

### 4. Abhängigkeiten installieren & starten

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (mit Hot-Reload)
npm run dev

# ODER für den Produktivbetrieb kompilieren und starten:
npm run build
npm start
```

---

## 🤖 GitHub Actions: Bau & Download des fertigen Artefakts

Im Repository ist unter `.github/workflows/build-deploy.yml` eine vollautomatische CI/CD-Pipeline eingerichtet:

### Was macht der Workflow?
1. Startet einen echten **MySQL 8.0 Test-Container**.
2. Führt **Linting** und **TypeScript-Typechecking** aus (`npm run lint`).
3. Importiert und validiert `schema.sql` gegen die MySQL-Instanz.
4. Baut Frontend und Backend (`npm run build`).
5. Schnürt ein vollständiges, auslieferungsfähiges Paket (`bbs-gut-rideshare-deployable-artifact`).

### Wie laden Sie das fertige Artefakt herunter?
1. Öffnen Sie Ihr GitHub-Repository im Browser.
2. Klicken Sie oben auf den Reiter **Actions**.
3. Wählen Sie den Workflow **"Build Deployable Artifact (MySQL)"** aus.
4. Klicken Sie auf den obersten erfolgreichen Durchlauf (grünes Häkchen).
5. Scrollen Sie nach unten zum Abschnitt **Artifacts**.
6. Klicken Sie auf **`bbs-gut-rideshare-deployable-artifact`** zum Herunterladen der ZIP-Datei.

---

## 📦 Bereitstellung des Artefakts auf einem Produktiv-Server

Das heruntergeladene Artefakt enthält bereits alle kompilierten Dateien (`dist/`), das Datenbankschema (`schema.sql`), `Dockerfile`, `docker-compose.yml` und Konfigurationsvorlagen. Es benötigt **keine** Entwickler-Tools (wie TypeScript oder Vite) auf dem Server!

### Schritt-für-Schritt-Anleitung:

1. **Artefakt auf den Server kopieren und entpacken:**
   ```bash
   mkdir -p /opt/bbs-rideshare
   unzip bbs-gut-rideshare-deployable-artifact.zip -d /opt/bbs-rideshare
   cd /opt/bbs-rideshare
   ```

2. **Produktions-Abhängigkeiten installieren:**
   ```bash
   npm ci --omit=dev
   ```

3. **Umgebungskonfiguration anlegen:**
   ```bash
   cp .env.example .env
   nano .env
   # Tragen Sie hier Ihre MySQL-Verbindungsdaten und Ihr gewünschtes ADMIN_TOKEN ein.
   ```

4. **Anwendung als Systemd-Dienst einrichten (Linux/Debian/Ubuntu):**
   Erstellen Sie `/etc/systemd/system/bbs-rideshare.service`:
   ```ini
   [Unit]
   Description=BBS GuT Rideshare Service
   After=network.target mysql.service

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/opt/bbs-rideshare
   ExecStart=/usr/bin/node dist/server.cjs
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

   Aktivieren und starten:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now bbs-rideshare
   sudo systemctl status bbs-rideshare
   ```

---

## ⚙️ Umgebungsvariablen (.env)

| Variable | Beschreibung | Standardwert | Pflicht? |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP-Port des Webservers | `3000` | Nein |
| `ADMIN_TOKEN` | Master-Token für den Administrator-Bereich | `Wulli` | Ja |
| `MYSQL_HOST` | Hostname / IP des MySQL-Servers | `localhost` | Ja (für MySQL) |
| `MYSQL_PORT` | Port des MySQL-Servers | `3306` | Nein |
| `MYSQL_USER` | MySQL-Benutzername | `bbs_user` | Ja (für MySQL) |
| `MYSQL_PASSWORD` | MySQL-Passwort | - | Ja (für MySQL) |
| `MYSQL_DATABASE` | Name der MySQL-Datenbank | `bbs_mitfahrzentrale` | Ja (für MySQL) |
| `DATABASE_URL` | Alternative vollständige Connection-URI (`mysql://...`) | - | Optional |
| `GEMINI_API_KEY` | Optionaler API-Key für KI-Sicherheitsscans | - | Optional |

---

## 🗄️ MySQL-Datenbankschema & Tabellen

### 1. Tabelle `schueler`
Speichert Benutzerkonten und Authentifizierungs-Token:
- `id` (INT, Primary Key, Auto-Increment)
- `nachname` (VARCHAR 100)
- `email` (VARCHAR 191, UNIQUE)
- `token` (VARCHAR 100, UNIQUE, INDEX)
- `status` (ENUM: `'aktiv'`, `'inaktiv'`, INDEX)
- `created_at` (TIMESTAMP)

### 2. Tabelle `eintraege`
Speichert Fahrtangebote und Mitfahrgesuche:
- `id` (INT, Primary Key, Auto-Increment)
- `titel` (VARCHAR 255)
- `nachricht` (TEXT)
- `typ` (ENUM: `'Angebot'`, `'Gesuch'`, INDEX)
- `sitzplaetze` (INT NULL, Pflicht bei Angeboten > 0)
- `schueler_id` (INT, Fremdschlüssel auf `schueler.id` mit `ON DELETE CASCADE`)
- `erstellungsdatum` (TIMESTAMP, INDEX)

---

## 🔑 Standard-Zugangsdaten (Test-Tokens)

Für Test- und Demonstrationszwecke sind folgende Tokens vorab hinterlegt:

- **Admin-Token**: `Wulli` (Zugang zum Admin-Dashboard mit Nutzerverwaltung, Audit-Tools und Statistiken)
- **Schüler-Token 1**: `TOKEN-2026-001` (Senior Weber, aktiv)
- **Schüler-Token 2**: `TOKEN-2026-002` (M. Müller, aktiv)
- **Schüler-Token 3**: `TOKEN-2026-003` (L. Schmidt, aktiv)
- **Schüler-Token 4**: `TOKEN-2026-004` (P. Schneider, inaktiv)

---

## 🩺 API-Endpunkte & Healthcheck

- `GET /api/v1/health` - Liefert Server-Status, Uptime und aktiven Datenspeicher (`"database": "mysql"` oder `"in-memory"`).
- `POST /api/v1/anmelden` - Token-Validierung für Schüler & Administratoren.
- `GET /api/v1/me` - Aktuelle Sitzungsinformationen prüfen.
- `GET /api/v1/eintraege` - Liste aller aktiven Angebote und Gesuche.
- `POST /api/v1/eintraege` - Neues Angebot oder Gesuch einstellen.
- `GET /api/v1/eintraege/:id/kontakt` - Kontaktdaten (Name, E-Mail) des Verfassers abrufen.
- `DELETE /api/v1/eintraege/:id` - Eigenen Eintrag löschen (oder als Admin).
- `GET /api/v1/admin/*` - Administrations-Endpunkte (Nutzer- und Eintragsverwaltung, Systemstatistiken).

---

## 📄 Lizenz & Impressum

Entwickelt für die **Berufsbildende Schule Gestaltung und Technik Trier (BBS GuT)**.
Open-Source zur internen und schulischen Nutzung.
