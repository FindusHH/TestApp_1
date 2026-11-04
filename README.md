# TestApp_1 – Kundenverwaltung (Microsoft Fabric App)

Eine einfache Web-App zur **Kundenverwaltung**: Kundendatensätze anlegen, anzeigen, bearbeiten und löschen. Die App ist mit **React + Vite** gebaut und läuft auf **Microsoft Fabric** (Anmeldung über dein Microsoft-Organisationskonto, Daten in einer Fabric-SQL-Datenbank).

> Diese App wird **nicht zentral gehostet**. Du installierst und startest sie selbst (lokal, Abschnitt 5) bzw. veröffentlichst sie in **deinem eigenen** Fabric-Workspace (Abschnitt 8). Deine persönliche Hosting-URL bekommst du dann beim Veröffentlichen angezeigt.

Diese README führt dich **Schritt für Schritt** durch Installation und Start – auch ganz ohne Vorkenntnisse zu Rayfin oder Fabric. Folge den Abschnitten einfach von oben nach unten.

---

## 1. Was du brauchst (einmalig)

Du brauchst **zwei** Dinge:

### a) Node.js auf deinem Rechner

1. Lade Node.js (Version **20, 22 oder 24**) herunter und installiere es: <https://nodejs.org/en/download>
2. Prüfe danach in einer **PowerShell** (Windows) bzw. einem Terminal, ob es funktioniert:

   ```powershell
   node -v
   npm -v
   ```

   Es sollten zwei Versionsnummern erscheinen (z. B. `v22.x.x` und `11.x.x`). Wenn ja, ist dieser Schritt erledigt.

> `npm` wird zusammen mit Node.js installiert – du musst es **nicht** separat installieren.
> Die Fabric-Werkzeuge (Rayfin CLI) sind im Projekt enthalten und werden automatisch über `npx` genutzt – **keine** globale Installation nötig.

### b) Ein Microsoft-Fabric-Zugang

Die App speichert Daten in **Microsoft Fabric** und meldet dich dort an. Dafür brauchst du:

- ein **Microsoft-Geschäfts-/Schulkonto** (Entra ID),
- einen **Fabric-Workspace mit zugewiesener Kapazität** (Trial genügt),
- die aktivierte Vorschau-Funktion **„Fabric Apps"** (durch eine*n Fabric-Administrator*in),
- mindestens die Rolle **Contributor** in diesem Workspace.

> Hast du das noch nicht? Die genauen Voraussetzungen und wie du sie einrichtest, stehen ausführlich in **[doc/KUNDENVERWALTUNG.md](./doc/KUNDENVERWALTUNG.md)**, Abschnitt 2.
> **Ohne Fabric-Zugang kann die App ihre Daten nicht speichern** – dieser Punkt ist leider unvermeidbar.

---

## 2. Projekt herunterladen

Variante A – mit Git (empfohlen):

```powershell
git clone https://github.com/FindusHH/TestApp_1.git
cd TestApp_1
```

Variante B – ohne Git: Auf GitHub oben rechts auf **Code → Download ZIP**, das ZIP entpacken und in den entpackten Ordner wechseln.

> Alle folgenden Befehle werden **im Projekt-Hauptordner** (dort, wo diese `README.md` liegt) ausgeführt.

---

## 3. Abhängigkeiten installieren

```powershell
npm install
```

Das lädt einmalig alle benötigten Pakete herunter. Bitte **nur hier im Hauptordner** ausführen – nicht in den Unterordnern.

---

## 4. Bei Microsoft Fabric anmelden

```powershell
npx rayfin login
```

Es öffnet sich ein Browserfenster für die Microsoft-Anmeldung. Danach kannst du prüfen, ob du angemeldet bist:

```powershell
npx rayfin login status
```

Es sollte „Signed in" mit deinem Konto erscheinen.

---

## 5. App starten

```powershell
npm run dev
```

Beim ersten Start richtet Rayfin automatisch das Fabric-Backend ein, legt die Datenbank-Tabelle an und erzeugt die nötigen Einstellungen. Das kann ein bis zwei Minuten dauern. **Folge dabei etwaigen Rückfragen im Terminal** (z. B. zur Auswahl deines Workspace).

Öffne anschließend im Browser:

**<http://localhost:5173>**

Nach kurzer Zeit erscheint – automatisch angemeldet – die **Kundenverwaltung**.

> **Beenden:** Im Terminal `Strg + C` drücken.

---

## 6. App benutzen

- **Neuer Kunde:** Button oben rechts → Formular ausfüllen → **Speichern**.
- **Bearbeiten / Löschen:** über die Schaltflächen in der jeweiligen Tabellenzeile (Löschen muss bestätigt werden).
- **Suchen / Filtern:** Suchfeld und Status-Auswahl über der Tabelle.
- **Hell-/Dunkelmodus:** Mond-/Sonnen-Symbol oben rechts.
- **Abmelden:** Button „Abmelden" oben rechts (mit Sicherheitsabfrage).

Lege testweise einen Kunden an und drücke **F5** – der Kunde bleibt erhalten (die Daten liegen in der Fabric-Datenbank).

---

## 7. Wenn etwas nicht klappt

| Problem | Lösung |
|---|---|
| `node` oder `npm` wird nicht gefunden | Node.js neu installieren und PowerShell **neu öffnen** (Schritt 1a). |
| `npx rayfin login` schlägt fehl | Richtiges Microsoft-Organisationskonto verwenden; ggf. `npx rayfin login --select`. |
| Nach dem Start keine Daten / Fehler | Kurz warten, dann `npx rayfin up db apply` ausführen. |
| „Dialect is required" / Deployment-Fehler | Details und weitere Fälle in **[doc/KUNDENVERWALTUNG.md](./doc/KUNDENVERWALTUNG.md)**, Abschnitt 12. |

---

## 8. Optional: Eine eigene Version nach Fabric veröffentlichen

Mit **einem** Befehl veröffentlichst du die App. Dabei werden **App und zugehörige SQL-Datenbank zusammen in denselben Fabric-Workspace** deployt – die Datenbank gehört zur App (ohne sie ist die App funktionslos).

Du hast die **Wahl** zwischen zwei Wegen:

**A) In einen bestehenden Workspace deployen** (z. B. wenn du schon einen Workspace mit zugewiesener Kapazität hast):

```powershell
npx rayfin up --workspace "DEIN-WORKSPACE-NAME"
```

**B) Einen neuen Workspace automatisch anlegen lassen:**

```powershell
npm run rayfin:up
```

In beiden Fällen legt Rayfin das App-Element **und** die SQL-Datenbank (Tabelle `Kunde`) **im selben Workspace** an und gibt am Ende die Hosting-URL aus.

Vorschau ohne Änderungen (nichts wird angelegt):

```powershell
npx rayfin up -n --workspace "DEIN-WORKSPACE-NAME"
```

Die ausführliche Anleitung steht in **[doc/KUNDENVERWALTUNG.md](./doc/KUNDENVERWALTUNG.md)**, Abschnitt 10.

---

## 9. Komplett neu aufsetzen (nach dem Löschen in Fabric)

Möchtest du in Fabric „bei null" anfangen – die App dort löschen und frisch neu erstellen? Das geht **komplett mit Befehlen**. Wichtig: `npm run rayfin:up` erstellt **alles** neu – App-Element, **SQL-Datenbank** (inkl. Tabelle `Kunde`) und Frontend. Die Datenbank musst du **nicht** separat anlegen.

Es gibt zwei Fälle:

- **Frischer Klon** (neuer Ordner oder anderer Rechner, der noch nie deployt hat): Folge einfach den Schritten 2–5 oben. `npm run rayfin:up` legt dabei automatisch alles an.
- **Dieser Ordner** (hat bereits deployt): Lösche zusätzlich die zwei lokalen Status-Dateien, damit Rayfin nicht das bereits gelöschte Element wiederzuverwenden versucht.

**Vorgehen für diesen Ordner:**

1. Im [Fabric-Portal](https://app.fabric.microsoft.com) den Workspace öffnen und die App-Elemente löschen (die zugehörige SQL-Datenbank wird automatisch mitgelöscht).
2. Die zwei lokalen Status-Dateien löschen – **ein Befehl** (Rayfin legt sie beim nächsten Schritt neu an):

   ```powershell
   Remove-Item rayfin\.deployments.json, rayfin\.env
   ```

3. Alles neu erstellen – **ein Befehl** legt **App und SQL-Datenbank zusammen in denselben Workspace** (plus das Frontend). Wähle einen der beiden Wege:

   **A) Bestehenden Workspace nutzen:**

   ```powershell
   npx rayfin up --workspace "DEIN-WORKSPACE-NAME"
   ```

   **B) Neuen Workspace automatisch anlegen lassen:**

   ```powershell
   npm run rayfin:up
   ```

> ⚠️ **Beachte:** Beim Neuanlegen entstehen ein **neues** Element und eine **leere** Datenbank mit **neuer Hosting-URL**; vorhandene Daten gehen verloren. Willst du URL und Daten behalten, lösche das Element nicht, sondern deploye einfach erneut darauf (`npm run rayfin:up`).

Mehr Details (inkl. Workspace aufräumen) stehen in **[doc/SEMINAR-Workspace-Bereinigung-und-Redeploy.md](./doc/SEMINAR-Workspace-Bereinigung-und-Redeploy.md)**, Abschnitte 4–6.

---

## 10. Projektstruktur (kurz)

```text
.
├── package.json          # Projekt-Befehle (dev, build, test, …)
├── rayfin/rayfin.yml      # Fabric-Dienste (Auth, Datenbank, Hosting)
├── doc/                   # Ausführliche Dokumentation (siehe unten)
└── packages/
    ├── frontend/          # Die React-App (Oberfläche)
    ├── data/              # Datenmodell „Kunde" (Datenbank-Tabelle)
    └── shared/            # Gemeinsame Typen für Frontend und Daten
```

---

## 11. Nützliche Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | App lokal starten (Backend + Frontend). |
| `npm run dev:frontend` | Nur das Frontend starten (ohne Backend-Abgleich). |
| `npm run build` | App bauen. |
| `npm run typecheck` | Typprüfung. |
| `npm run lint` | Code-Prüfung (Frontend). |
| `npm test` | Tests ausführen. |
| `npm run rayfin:up` | Eigene Version nach Fabric veröffentlichen/aktualisieren. |

---

## 12. Weiterführende Dokumentation

- **[doc/KUNDENVERWALTUNG.md](./doc/KUNDENVERWALTUNG.md)** – vollständige Schritt-für-Schritt-Anleitung (Datenmodell, Oberfläche, Deployment, Fehlerbehebung).
- **[doc/UMSETZUNG-KUNDENVERWALTUNG.md](./doc/UMSETZUNG-KUNDENVERWALTUNG.md)** – welche Dateien die App ausmachen, je Datei erklärt.
- **[doc/SEMINAR-Workspace-Bereinigung-und-Redeploy.md](./doc/SEMINAR-Workspace-Bereinigung-und-Redeploy.md)** – Trainingsbeispiel: Fabric-Workspace bereinigen und sauber neu deployen.
