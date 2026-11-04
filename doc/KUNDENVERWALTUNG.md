# Kundenverwaltung mit Fabric Apps (Rayfin) – Schritt-für-Schritt-Anleitung

Diese Anleitung beschreibt, wie die bestehende App **TestApp_1** um eine **eigene SQL-Datenbank** und ein **Formular zur Kundendatenverwaltung** (Anlegen, Anzeigen, Bearbeiten, Löschen) erweitert wird.

**Festgelegte Entscheidungen**

| Thema | Entscheidung |
|---|---|
| Datenquelle | Neue, app-eigene Datenbank (*SQL database in Fabric*, wird von Fabric Apps verwaltet) |
| Sichtbarkeit | Das ganze Team: **alle angemeldeten Benutzer sehen und bearbeiten alle Kunden** |
| Anmeldung | Unverändert: Fabric SSO (Microsoft Entra ID), Passwort-Login bleibt deaktiviert |
| Hosting | Unverändert: `assetAccess: protected` |

---

## Inhaltsverzeichnis

1. [Architekturüberblick](#1-architekturüberblick)
2. [Voraussetzungen](#2-voraussetzungen)
3. [Installation und Einrichtung der Entwicklungsumgebung](#3-installation-und-einrichtung-der-entwicklungsumgebung)
4. [Datenbank-Dienst aktivieren](#4-datenbank-dienst-aktivieren)
5. [Datenmodell „Kunde“ definieren](#5-datenmodell-kunde-definieren)
6. [Entity registrieren (Schema)](#6-entity-registrieren-schema)
7. [Benutzeroberfläche: Liste und Formular](#7-benutzeroberfläche-liste-und-formular)
8. [Lokal starten und testen](#8-lokal-starten-und-testen)
9. [Qualitätsprüfung](#9-qualitätsprüfung)
10. [Deployment nach Microsoft Fabric](#10-deployment-nach-microsoft-fabric)
11. [Kontrolle im Fabric-Portal](#11-kontrolle-im-fabric-portal)
12. [Fehlerbehebung](#12-fehlerbehebung)
13. [Weiterführende Links](#13-weiterführende-links)

---

## 1. Architekturüberblick

```text
Browser (React + Vite)                         Microsoft Fabric
┌──────────────────────────┐                  ┌───────────────────────────────────┐
│ AuthGate (Fabric SSO)    │  ── Login ──▶    │ Authentication (Entra ID)         │
│ KundenListe              │                  │                                   │
│ KundenFormular           │  ── GraphQL ──▶  │ Data API (/api/graphql)           │
│ useCrud + RayfinClient   │                  │        │                          │
└──────────────────────────┘                  │        ▼                          │
                                              │ SQL database in Fabric (Tabelle   │
                                              │ „Kunde“, Schema aus TypeScript)   │
                                              │ Static Content (gebautes Frontend)│
                                              └───────────────────────────────────┘
```

Fabric Apps erzeugt aus einer dekorierten TypeScript-Klasse (`@entity`) automatisch die Datenbanktabelle und eine typisierte GraphQL-API. Beim Deployment legt Fabric eine **SQL database in Fabric** als untergeordnetes Element der App an. Die Datenbank ist im Portal schreibgeschützt; Schemaänderungen erfolgen ausschließlich über den Code.

Quellen: [What is Fabric Apps?](https://learn.microsoft.com/fabric/apps/overview) · [Programming model](https://learn.microsoft.com/fabric/apps/programming-model)

### Projektstruktur (relevant für diese Erweiterung)

```text
TestApp_1/
├─ package.json                       # Root-Befehle (dev, build, typecheck, pack:add, …)
├─ rayfin/rayfin.yml                  # Fabric-Dienste (auth, data, staticHosting, …)
├─ rayfin/.deployments.json           # Bestehendes Deployment (Workspace „ws-rayfin-start“)
└─ packages/
   ├─ data/src/                       # Entities mit Decorators  → Kunde.ts (neu)
   ├─ shared/src/index.ts             # Browser-sichere Typen    → KundeRecord (neu)
   └─ frontend/src/                   # React-App                → Liste + Formular (neu)
```

Quelle: [Fabric Apps project structure](https://learn.microsoft.com/fabric/apps/project-structure)

---

## 2. Voraussetzungen

### 2.1 Software auf dem Entwicklungsrechner

| Software | Version | Prüfen mit | Hinweis |
|---|---|---|---|
| Node.js | 20, 22 oder 24 (aktuell installiert: 24.x) | `node -v` | [Download](https://nodejs.org/en/download) |
| npm | wird mit Node.js geliefert (aktuell 11.x) | `npm -v` | |
| Rayfin CLI | im Projekt installiert (`@microsoft/rayfin-cli`, aktuell 1.36.x) | `npx rayfin --version` | Keine globale Installation nötig |
| Visual Studio Code | aktuell | – | Empfohlener Editor |
| Docker Desktop | optional | `docker --version` | Nur für den lokalen Docker-Entwicklungsmodus nötig |

### 2.2 Microsoft Fabric

| Voraussetzung | Beschreibung |
|---|---|
| Fabric-Kapazität | Der Ziel-Workspace benötigt eine zugewiesene Fabric-Kapazität (auch Trial möglich). |
| Tenant-Einstellung | Ein Fabric-Administrator muss im [Admin-Portal](https://app.fabric.microsoft.com/admin-portal) unter **Tenant settings → Fabric Apps (preview)** die Funktion aktivieren. |
| Workspace-Rolle | Mindestens **Contributor** im Ziel-Workspace, um Elemente anzulegen bzw. zu aktualisieren. |
| Microsoft-Konto | Organisationskonto (Entra ID) mit Zugriff auf den Tenant. |

Quellen: [Fabric Apps – Prerequisites](https://learn.microsoft.com/fabric/apps/overview#prerequisites) · [Roles in workspaces](https://learn.microsoft.com/fabric/fundamentals/roles-workspaces) · [Region availability](https://learn.microsoft.com/fabric/admin/region-availability)

> **Hinweis:** Fabric Apps ist derzeit eine **Preview-Funktion**. Siehe [Preview-Hinweise](https://learn.microsoft.com/fabric/fundamentals/preview).

---

## 3. Installation und Einrichtung der Entwicklungsumgebung

Alle Befehle werden im **Projektstammverzeichnis** `C:\Users\stefa\source\rayfin_sql_test\TestApp_1` in einer PowerShell ausgeführt.

### 3.1 Abhängigkeiten installieren

```powershell
cd C:\Users\stefa\source\rayfin_sql_test\TestApp_1
npm install
```

> Nur im Stammverzeichnis installieren. Keine `npm install`-Aufrufe in den Unterpaketen (`packages/*`) und keine zusätzlichen Lockfiles anlegen – das Projekt ist ein npm-Workspace.

### 3.2 Rayfin CLI prüfen

```powershell
npx rayfin --version
npx rayfin --help
```

### 3.3 Bei Fabric anmelden

```powershell
npx rayfin login            # interaktive Anmeldung im Browser
npx rayfin login status     # angemeldetes Konto/Tenant anzeigen
npx rayfin login --select   # optional: anderes Konto wählen
```

Die lokale Entwicklung meldet sich automatisch mit der CLI-Sitzung an (`autoLogin` in `vite.config.ts`).

### 3.4 Ausgangszustand prüfen (optional)

```powershell
npm run dev
```

Die App startet und zeigt nach der Anmeldung die leere Startseite. Mit `Strg + C` beenden.

Quellen: [Create a Fabric app with the Rayfin CLI](https://learn.microsoft.com/fabric/apps/create-app-with-cli) · [Rayfin CLI reference](https://learn.microsoft.com/fabric/apps/cli-reference)

---

## 4. Datenbank-Dienst aktivieren

Der Datenbank-Dienst ist in der Vorlage ausgeschaltet (`data.enabled: false`). Er wird über das Capability-Pack **data-modeling** aktiviert:

```powershell
npm run pack:add -- data-modeling
```

**Was der Befehl macht**

| Änderung | Datei |
|---|---|
| `data.enabled: true` und `dialect: mssql` setzen | `rayfin/rayfin.yml` |
| Beispiel-Entity `Item` anlegen | `packages/data/src/Item.ts` |
| `Item` registrieren | `packages/data/src/index.ts` |
| Typ-Vertrag für `Item` anlegen | `packages/shared/src/index.ts` |
| Abhängigkeiten installieren | Workspace-Root |

**Erwartetes Ergebnis in `rayfin/rayfin.yml`:**

```yaml
  data:
    enabled: true
    dialect: mssql
    path: packages/data
    buildCommand: npm run build
```

> **Wichtig:** Meldet das Pack eine „preserved file“ (bestehende Datei wurde nicht überschrieben), anhalten und prüfen. `--force-seeds` nur bewusst verwenden – es überschreibt eigene Änderungen.
>
> Ohne `dialect` schlägt das Deployment mit *„Dialect is required when Data module is enabled“* fehl.

Quelle: [Apply and verify schema changes – dialect](https://learn.microsoft.com/fabric/apps/apply-schema-changes)

---

## 5. Datenmodell „Kunde“ definieren

### 5.1 Neue Datei `packages/data/src/Kunde.ts`

Die Beispiel-Entity `Item.ts` wird durch `Kunde.ts` ersetzt (Datei `Item.ts` danach löschen).

```ts
import { date, email, entity, role, set, text, uuid } from '@microsoft/rayfin-core';

/**
 * Teamweite Kundendaten: Jeder angemeldete Benutzer darf alle Kunden lesen,
 * anlegen, ändern und löschen. Anonymer Zugriff ist nicht erlaubt.
 */
@entity()
@role('authenticated', '*')
export class Kunde {
  @uuid() id!: string;
  @text({ min: 1, max: 100 }) firma!: string;
  @text({ min: 1, max: 100 }) ansprechpartner!: string;
  @email({ max: 254 }) email!: string;
  @text({ optional: true, max: 30 }) telefon?: string;
  @text({ optional: true, max: 200 }) strasse?: string;
  @text({ optional: true, max: 10 }) plz?: string;
  @text({ optional: true, max: 100 }) ort?: string;
  @set('lead', 'aktiv', 'inaktiv') status!: 'lead' | 'aktiv' | 'inaktiv';
  @text({ optional: true, max: 2000 }) notizen?: string;
  @date() erstelltAm!: Date;
  @date() geaendertAm!: Date;
}
```

### 5.2 Designentscheidungen

| Punkt | Begründung |
|---|---|
| `@role('authenticated', '*')` | Muster „Full access for authenticated users“: Das ganze Team sieht alle Kunden. Die Prüfung erfolgt **serverseitig** bei jeder API-Anfrage. |
| Kein `owner_id` | Wird nur für „jeder sieht nur seine eigenen Daten“ benötigt. |
| `max` an **jedem** Textfeld | Ohne `max` erzeugt SQL Server `NVARCHAR(MAX)`; das kann die GraphQL-Schemaerzeugung brechen („Internal server error“ nach dem Deployment). Falls `@email` die Option `max` nicht akzeptiert, stattdessen `@text({ max: 254 })` verwenden und das E-Mail-Format im Formular prüfen. |
| `{ optional: true }` | Macht die Spalte nullable. Das `?` in TypeScript allein reicht **nicht**. |
| `@uuid() id` | Primärschlüssel; wird beim Anlegen vom Server erzeugt. |
| `@set(...)` | Feste Statuswerte; das Formular verwendet `lead` als Vorgabe. |

### 5.3 Spätere Erweiterung: Admin-Rechte (optional)

Soll später nur eine Admin-Rolle löschen dürfen:

```ts
@role('authenticated', ['create', 'read', 'update'])
@role('authenticated', 'delete', { policy: (claims) => claims.role.eq('admin') })
```

Quellen: [Define data models](https://learn.microsoft.com/fabric/apps/data-models) · [Define data permissions](https://learn.microsoft.com/fabric/apps/data-permissions) · [Troubleshoot – data model issues](https://learn.microsoft.com/fabric/apps/troubleshooting#data-model-issues)

---

## 6. Entity registrieren (Schema)

Jede Entity muss an **zwei** Stellen eingetragen werden – sonst ist sie zur Laufzeit erreichbar, aber für den TypeScript-Compiler unsichtbar (oder umgekehrt).

### 6.1 `packages/shared/src/index.ts` – browser-sicherer Vertrag

```ts
export type KundeStatus = 'lead' | 'aktiv' | 'inaktiv';

export interface KundeRecord {
  id: string;
  firma: string;
  ansprechpartner: string;
  email: string;
  telefon?: string | null;
  strasse?: string | null;
  plz?: string | null;
  ort?: string | null;
  status: KundeStatus;
  notizen?: string | null;
  erstelltAm: Date | string;
  geaendertAm: Date | string;
}

export type UniversalAppSchema = {
  Kunde: KundeRecord;
};
```

### 6.2 `packages/data/src/index.ts` – Laufzeit-Registrierung

```ts
import { Kunde } from './Kunde.js';

export { Kunde };
export type { UniversalAppSchema } from '@rayfin-app/shared';

export const schema = [Kunde];
```

> Die `Item`-Registrierung und den `Item`-Typ vollständig entfernen.
> Das Frontend importiert **nie** die dekorierte Klasse `Kunde`, sondern nur `KundeRecord` aus `@rayfin-app/shared`.

### 6.3 Typprüfung

```powershell
npm run typecheck
```

> Immer `npm run typecheck` (`tsc -b`) verwenden, nicht `tsc --noEmit` – letzteres meldet bei referenzierten Projekten fälschlich `TS6305`.

---

## 7. Benutzeroberfläche: Liste und Formular

### 7.1 Bausteine übernehmen

Das Projekt liefert erprobte Bausteine für CRUD-Oberflächen mit:

```powershell
Copy-Item .agents\skills\crud-ui\kit\components\useCrud.ts  packages\frontend\src\components\useCrud.ts
Copy-Item .agents\skills\crud-ui\kit\components\states.tsx  packages\frontend\src\components\states.tsx
```

| Baustein | Aufgabe |
|---|---|
| `useCrud` | Laden, Anlegen, Ändern, Löschen mit **optimistischen Updates** und automatischem Rollback bei Serverfehlern |
| `LoadingState`, `EmptyState`, `ErrorState` | Einheitliche Lade-, Leer- und Fehlerzustände |
| `ConfirmDelete` | Löschbestätigung mit Nennung des Datensatzes |

### 7.2 Neue Dateien im Frontend

| Datei | Inhalt |
|---|---|
| `packages/frontend/src/features/kunden/kunden.api.ts` | Datenzugriff über `await getRayfinClient()` |
| `packages/frontend/src/features/kunden/KundenFormular.tsx` | Formular zum Anlegen/Bearbeiten |
| `packages/frontend/src/features/kunden/KundenListe.tsx` | Tabelle mit Suche, Statusfilter, Bearbeiten, Löschen |
| `packages/frontend/src/features/kunden/KundenSeite.tsx` | Seitenlayout (Kopfzeile, Liste, Formular-Dialog) |
| `packages/frontend/src/App.tsx` | Platzhalter `EmptyStatePreview` durch `KundenSeite` ersetzen |

### 7.3 Datenzugriff (`kunden.api.ts`)

```ts
import type { KundeRecord } from '@rayfin-app/shared';
import { getRayfinClient } from '@/lib/rayfin-client';

const FELDER = [
  'id', 'firma', 'ansprechpartner', 'email', 'telefon', 'strasse',
  'plz', 'ort', 'status', 'notizen', 'erstelltAm', 'geaendertAm',
] as const;

export const kundenApi = {
  list: async () =>
    (await getRayfinClient()).data.Kunde
      .select([...FELDER])
      .orderBy({ firma: 'asc' })
      .execute(),
  create: async (input: Omit<KundeRecord, 'id'>) =>
    (await getRayfinClient()).data.Kunde.create(input),
  update: async (id: string, patch: Partial<KundeRecord>) =>
    (await getRayfinClient()).data.Kunde.update({ id }, { ...patch, geaendertAm: new Date() }),
  remove: async (id: string) => {
    await (await getRayfinClient()).data.Kunde.delete({ id });
  },
};
```

> Eine Abfrage liefert standardmäßig nur **eine Seite (100 Datensätze)**. Für größere Kundenbestände `.first(n).executePaginated()` mit `.after(endCursor)` verwenden. `count()` gibt es nicht – stattdessen `items.length`.

### 7.4 Formularfelder und Validierung

Die Client-Validierung muss **exakt** den Server-Constraints entsprechen.

| Feld | Eingabe | Pflicht | Validierung (`maxLength` = Schema-`max`) |
|---|---|---|---|
| Firma | Text | ja | 1–100 Zeichen, getrimmt |
| Ansprechpartner | Text | ja | 1–100 Zeichen |
| E-Mail | `type="email"` | ja | gültiges Format, max. 254 |
| Telefon | `type="tel"` | nein | max. 30 |
| Straße | Text | nein | max. 200 |
| PLZ | Text | nein | max. 10 |
| Ort | Text | nein | max. 100 |
| Status | Auswahl | ja | `lead` (Vorgabe), `aktiv`, `inaktiv` |
| Notizen | Textarea | nein | max. 2000 |

**Verhalten des Formulars**

- Jedes Feld hat ein sichtbares `<label>`; Fehlermeldungen stehen direkt am Feld.
- „Speichern“ ist deaktiviert, solange Pflichtfelder fehlen oder gespeichert wird (`crud.pending`).
- Beim Anlegen werden `erstelltAm` und `geaendertAm` auf `new Date()` gesetzt.
- Leere optionale Felder werden nicht als leerer String, sondern weggelassen bzw. als `null` gesendet.
- Das Formular wird erst nach erfolgreichem Speichern geleert/geschlossen; bei Fehler bleiben die Eingaben erhalten und `crud.error` wird angezeigt.

### 7.5 Kundenliste

- Tabelle mit Firma, Ansprechpartner, E-Mail, Ort, Status (Badge) und Aktionen.
- Clientseitige Suche nach Firma/Ansprechpartner/Ort und Filter nach Status (bei > 100 Datensätzen serverseitig mit `where({ firma: { contains: … } })`).
- „Bearbeiten“ öffnet das Formular vorbefüllt, „Löschen“ zeigt `ConfirmDelete` mit Firmenname.
- Leerzustand mit Hinweis „Noch keine Kunden – lege den ersten an“.
- Optionaler Knopf „Beispielkunden anlegen“ im Leerzustand; so erzeugte Datensätze sind sichtbar als **Beispieldaten** gekennzeichnet.
- Datumswerte werden explizit formatiert (`Intl.DateTimeFormat('de-DE')`), nie als rohes `Date`-Objekt gerendert.

### 7.6 Gestaltung

- Tailwind-v4-Design-Tokens aus `packages/frontend/src/global.css` verwenden (Hell-/Dunkelmodus funktioniert automatisch).
- Anmeldung (`AuthGate`) und Auth-Provider bleiben unverändert – App-Inhalte erscheinen erst nach erfolgreicher Anmeldung.

Quellen: [Read and write data with GraphQL](https://learn.microsoft.com/fabric/apps/read-write-data-graphql) · [Rayfin SDK (JavaScript) overview](https://learn.microsoft.com/javascript/api/fabric-apps-sdk-javascript/rayfin-overview)

### 7.7 Umgesetzte Dateien

Die konkret angelegten bzw. geänderten Dateien (Frontend-Feature `kunden`
sowie die Verdrahtung in `shared`/`data`) sind in
[UMSETZUNG-KUNDENVERWALTUNG.md](./UMSETZUNG-KUNDENVERWALTUNG.md) je Datei mit
Zweck, Exporten/Props und Hinweisen dokumentiert.

---

## 8. Lokal starten und testen

```powershell
npm run dev
```

`npm run dev` startet `rayfin dev`: Es stellt das Fabric-Backend bereit bzw. verwendet es wieder, **wendet das Datenbankschema an**, erzeugt die Umgebungsvariablen und startet das Frontend unter <http://localhost:5173>.

Nur das Frontend (ohne Backend-Abgleich):

```powershell
npm run dev:frontend
```

Falls die Tabelle `Kunde` nach dem Start noch nicht abfragbar ist, Schema explizit anwenden:

```powershell
npx rayfin up db apply
```

### Manuelle Testcheckliste

| # | Test | Erwartung |
|---|---|---|
| 1 | App öffnen | Anmeldung erfolgt automatisch, Kundenseite mit Leerzustand erscheint |
| 2 | Kunde anlegen (alle Pflichtfelder) | Erscheint sofort in der Liste |
| 3 | Seite neu laden (F5) | Kunde ist weiterhin vorhanden (**Persistenz**) |
| 4 | Pflichtfeld leer lassen / ungültige E-Mail | Speichern nicht möglich, Feldfehler sichtbar |
| 5 | Kunde bearbeiten (z. B. Status → aktiv) | Änderung sichtbar, nach Reload erhalten |
| 6 | Kunde löschen | Bestätigung erscheint; nach Bestätigung entfernt, nach Reload weiterhin entfernt |
| 7 | Zweiter Benutzer aus dem Team meldet sich an | Sieht dieselben Kunden (**teamweite Sichtbarkeit**) |
| 8 | Hell-/Dunkelmodus | Alles gut lesbar |

---

## 9. Qualitätsprüfung

Nacheinander (nicht parallel) im Stammverzeichnis ausführen:

```powershell
npm run typecheck   # Typprüfung aller Pakete (tsc -b)
npm run build       # Build von shared, data und frontend
npm run lint        # ESLint für das Frontend
npm test            # Vitest-Tests des Frontends
```

> `npm run build` nutzt `tsc -b --noCheck` und ersetzt **nicht** die Typprüfung. Schlägt ein Schritt fehl: Ursache beheben und diesen sowie die nachfolgenden Schritte erneut ausführen.

---

## 10. Deployment nach Microsoft Fabric

Die App ist bereits einmal deployt. `rayfin/.deployments.json` enthält das aktive Ziel:

| Eigenschaft | Wert |
|---|---|
| Deployment-Profil | `ws-rayfin-start` |
| Fabric-Element | `testapp-1` (Item-ID `4d71422e-80a1-4f23-aec3-ee11d1f982fc`) |
| Hosting-URL | <https://still-spur-7d33643e65-northeurope.webapp.fabricapps.net> |

Ein erneutes `rayfin up` **aktualisiert dasselbe Element** – es wird nichts doppelt angelegt.

### 10.1 Anmeldung prüfen

```powershell
npx rayfin login status
```

### 10.2 Vorschau ohne Änderungen (Dry Run)

```powershell
npx rayfin up -n --workspace-id <workspace-guid>
```

Zeigt, was angelegt/geändert würde, ohne Ressourcen zu verändern. Die Workspace-ID steht in `rayfin/.deployments.json` (`fabricWorkspaceId`).

### 10.3 Deployment ausführen

```powershell
npm run rayfin:up
```

`rayfin up` führt nacheinander aus:

1. Rayfin-Element im Workspace anlegen bzw. wiederverwenden
2. Publishable Key abrufen
3. Laufzeiteinstellungen aus `rayfin.yml` synchronisieren (u. a. Data-Dienst aktivieren)
4. **Datenbankschema anwenden** (Tabelle `Kunde` wird in der SQL database in Fabric erstellt)
5. Frontend bauen (`build:fabric`) und als statischen Inhalt hochladen
6. Deployment-Details in `rayfin/.deployments.json` und `rayfin/.env` speichern

### 10.4 Status prüfen

```powershell
npx rayfin up status
```

Ein erfolgreiches `rayfin up` garantiert nicht, dass die neue Entity sofort abfragbar ist. Erst wenn der Status gesund ist, die App testen. Liefert die Entity weiterhin GraphQL-Fehler:

```powershell
npx rayfin up db apply
```

> `--force` nur verwenden, wenn die CLI eine **destruktive Änderung** (z. B. Spalte löschen) meldet **und** der Datenverlust geprüft und akzeptiert wurde.

### 10.5 Teilaktualisierungen

| Befehl | Aktualisiert |
|---|---|
| `npx rayfin up` | Alles: Einstellungen, Datenbank, statische Inhalte |
| `npx rayfin up db apply` | Nur das Datenbankschema |
| `npx rayfin up staticapp deploy` | Nur das Frontend |

Quellen: [Deploy a Fabric app to Fabric](https://learn.microsoft.com/fabric/apps/deploy-app) · [Apply and verify schema changes](https://learn.microsoft.com/fabric/apps/apply-schema-changes) · [Dev- und Prod-Umgebungen](https://learn.microsoft.com/fabric/apps/dev-prod-workflow)

---

## 11. Kontrolle im Fabric-Portal

1. [Fabric-Portal](https://app.fabric.microsoft.com) öffnen → Workspace **ws-rayfin-start** → Element **testapp-1**.
2. Unter den untergeordneten Elementen erscheint jetzt **SQL database in Fabric**.
3. Datenbank öffnen → Objekt-Explorer → Tabelle `Kunde` prüfen.
4. Im Abfrage-Editor lesend prüfen, z. B.:

   ```sql
   SELECT TOP (20) * FROM [Kunde] ORDER BY [firma];
   ```

5. **Keine Schemaänderungen im Portal vornehmen** – das führt zu Konflikten mit dem Code. Änderungen immer in `packages/data/src/Kunde.ts` und anschließend `npm run rayfin:up`.
6. App über die Hosting-URL oder direkt im Fabric-Portal öffnen und die Testcheckliste aus Abschnitt 8 wiederholen.

Quellen: [Fabric Apps – Management in the Fabric portal](https://learn.microsoft.com/fabric/apps/overview) · [SQL database in Microsoft Fabric](https://learn.microsoft.com/fabric/database/sql/overview)

---

## 12. Fehlerbehebung

| Symptom | Ursache | Lösung |
|---|---|---|
| HTTP 400 „Dialect is required when Data module is enabled“ | `dialect` fehlt in `rayfin.yml` | `dialect: mssql` unter `services.data` ergänzen |
| GraphQL „Internal server error“ nach Deployment | Textfeld ohne `max` (`NVARCHAR(MAX)`) | `max` an allen Textfeldern setzen, `npx rayfin up db apply` (ggf. `--force` nach Prüfung) |
| Entity `Kunde` nicht abfragbar direkt nach Deployment | Deployment noch nicht gesund / Schema nicht angewendet | `npx rayfin up status`, danach `npx rayfin up db apply` |
| 401 / 403 beim Deployment | Sitzung abgelaufen oder fehlende Workspace-Rechte | `npx rayfin login`, Workspace-Rolle prüfen |
| CLI blockiert mit „destructive change“ | Schemaänderung würde Daten löschen | Operationen prüfen; nur bei akzeptiertem Datenverlust `--force` |
| `TS6305` bei Typprüfung | `tsc --noEmit` statt `tsc -b` | `npm run typecheck` verwenden |
| `unsupported UUID`-Fehler lokal | Anderer Dienst mit anderem Dialekt auf dem Standardport | Konkurrierenden Dienst beenden |
| Nur 100 Kunden sichtbar | Standard-Seitengröße | Paginierung mit `first()`/`executePaginated()` |

Quelle: [Troubleshoot Fabric Apps](https://learn.microsoft.com/fabric/apps/troubleshooting)

---

## 13. Weiterführende Links

**Microsoft Learn – Fabric Apps**

- [What is Fabric Apps (Preview)?](https://learn.microsoft.com/fabric/apps/overview)
- [Create your first Fabric app](https://learn.microsoft.com/fabric/apps/create-app)
- [Create a Fabric app with the Rayfin CLI](https://learn.microsoft.com/fabric/apps/create-app-with-cli)
- [Fabric Apps project structure](https://learn.microsoft.com/fabric/apps/project-structure)
- [Programming model overview](https://learn.microsoft.com/fabric/apps/programming-model)
- [Define data models](https://learn.microsoft.com/fabric/apps/data-models)
- [Define data permissions](https://learn.microsoft.com/fabric/apps/data-permissions)
- [Read and write data with GraphQL](https://learn.microsoft.com/fabric/apps/read-write-data-graphql)
- [Apply and verify schema changes](https://learn.microsoft.com/fabric/apps/apply-schema-changes)
- [Deploy a Fabric app to Fabric](https://learn.microsoft.com/fabric/apps/deploy-app)
- [Tutorial: Dev- und Prod-Umgebungen mit der Rayfin CLI](https://learn.microsoft.com/fabric/apps/dev-prod-workflow)
- [Rayfin CLI reference](https://learn.microsoft.com/fabric/apps/cli-reference)
- [Troubleshoot Fabric Apps](https://learn.microsoft.com/fabric/apps/troubleshooting)
- [Fabric Apps FAQ](https://learn.microsoft.com/fabric/apps/faq)
- [Rayfin SDK (JavaScript) overview](https://learn.microsoft.com/javascript/api/fabric-apps-sdk-javascript/rayfin-overview)

**Microsoft Learn – Fabric allgemein**

- [SQL database in Microsoft Fabric](https://learn.microsoft.com/fabric/database/sql/overview)
- [Roles in workspaces](https://learn.microsoft.com/fabric/fundamentals/roles-workspaces)
- [Region availability](https://learn.microsoft.com/fabric/admin/region-availability)
- [Preview-Funktionen in Fabric](https://learn.microsoft.com/fabric/fundamentals/preview)

**Im Projekt installierte, versionsgenaue Dokumentation**

- `node_modules/@microsoft/rayfin-core/assets/docs/decorators.md` – alle Feld-Decorators
- `node_modules/@microsoft/rayfin-guide/assets/docs/data/permissions.md` – Berechtigungen
- `node_modules/@microsoft/rayfin-guide/assets/docs/data/graphql.md` – Client-API
- `node_modules/@microsoft/rayfin-guide/assets/docs/known-limitations.md` – bekannte Einschränkungen
- `node_modules/@microsoft/rayfin-guide/assets/docs/app-backend/deploy.md` – Deployment
