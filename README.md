# TestApp_1 – Kundenverwaltung (Microsoft Fabric App)

Eine einfache Web-App zur **Kundenverwaltung**: Kundendatensätze anlegen, anzeigen, bearbeiten und löschen. Die App ist mit **React + Vite** gebaut und läuft auf **Microsoft Fabric** (Anmeldung über dein Microsoft-Organisationskonto, Daten in einer Fabric-SQL-Datenbank).

> **Die Live-App läuft bereits hier:** <https://still-spur-7d33643e65-northeurope.webapp.fabricapps.net>
> Zum Öffnen brauchst du ein berechtigtes Microsoft-Geschäfts-/Schulkonto (Entra ID) im passenden Tenant.

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

Beim ersten Start richtet Rayfin automatisch das Fabric-Backend ein, legt die Datenbank-Tabelle an und erzeugt die nötigen Einstellungen. Das kann ein bis zwei Minuten dauern.

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

Wenn du deine eigene Kopie online stellen möchtest:

```powershell
npm run rayfin:up
```

Rayfin legt (bzw. aktualisiert) das App-Element in deinem Fabric-Workspace an und gibt dir am Ende die Hosting-URL aus. Die ausführliche Anleitung inkl. Vorschau (`npx rayfin up -n`) steht in **[doc/KUNDENVERWALTUNG.md](./doc/KUNDENVERWALTUNG.md)**, Abschnitt 10.

---

## 9. Komplett neu aufsetzen (nach dem Löschen in Fabric)

Möchtest du in Fabric „bei null" anfangen – also die App dort löschen und frisch neu erstellen? Das geht. Es gibt **zwei Fälle**:

- **Frischer Klon** (neuer Ordner oder anderer Rechner, der noch nie deployt hat): Folge einfach den Schritten 2–5 oben – dabei entsteht automatisch ein **neues** Fabric-Element.
- **Dieser Ordner** (hat bereits deployt): Du musst zusätzlich den **lokalen Deployment-Status zurücksetzen**, sonst versucht Rayfin, das bereits gelöschte Element wiederzuverwenden.

**Vorgehen für diesen Ordner:**

1. Im [Fabric-Portal](https://app.fabric.microsoft.com) den Workspace öffnen und die App-Elemente löschen (die zugehörige SQL-Datenbank wird automatisch mitgelöscht).
2. Den lokalen Deployment-Status zurücksetzen: Sicherungen anlegen, `rayfin/.deployments.json` leeren und die item-spezifischen Werte in `rayfin/.env` entfernen.
3. Neu deployen: `npm run rayfin:up`.

Die genaue, Schritt-für-Schritt-Anleitung dazu (inkl. der exakten Befehle zum Zurücksetzen) steht in **[doc/SEMINAR-Workspace-Bereinigung-und-Redeploy.md](./doc/SEMINAR-Workspace-Bereinigung-und-Redeploy.md)**, Abschnitte 4–6.

> ⚠️ **Beachte:** Beim Neuanlegen entsteht ein **neues** Element mit **neuer Hosting-URL**, und **vorhandene Daten gehen verloren**. Willst du URL und Daten behalten, lösche das Element nicht, sondern deploye einfach erneut darauf (`npm run rayfin:up`).

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
