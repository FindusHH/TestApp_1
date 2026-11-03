# Seminar-Beispiel: Fabric-Workspace bereinigen und eine Rayfin-App sauber neu deployen

> **Zweck dieses Dokuments**
> Eine wiederverwendbare, didaktische Schritt-für-Schritt-Anleitung für
> Seminare/Trainings. Sie zeigt an einem realen Fall, **wo Fabric Apps ihre
> Daten speichern**, **warum ein Workspace mit der Zeit „zuwuchert"** und **wie
> man ihn bereinigt und die App sauber neu deployt**. Alle umgebungsspezifischen
> Werte sind als Platzhalter `<…>` markiert, damit das Beispiel auf jeden
> Workspace übertragbar ist.

---

## Lernziele

Nach dieser Übung können die Teilnehmenden:

1. erklären, **welche Fabric-Elemente eine Rayfin-App mit Datendienst erzeugt**
   (App-Backend + SQL database + SQL analytics endpoint);
2. nachvollziehen, **wo die App-Daten tatsächlich liegen** und wie man das prüft;
3. einen **unübersichtlichen Workspace sicher bereinigen** (inkl. Risiken);
4. den **lokalen Deployment-Status zurücksetzen**, sodass ein frisches Item
   entsteht;
5. die App **mit Vorschau (Dry-Run) sauber neu deployen** und das Ergebnis
   **verifizieren**.

**Voraussetzungen:** Node.js 20/22/24, im Projekt installierte Rayfin CLI,
angemeldet (`npx rayfin login status` → „Signed in"), Contributor-Rolle im
Ziel-Workspace.

---

## 0. Ausgangslage (Fallbeispiel)

Eine Kundenverwaltungs-App (`Kunde`-Entity, SQL database in Fabric) wurde
mehrfach deployt. Im Workspace sind dadurch **mehrere Apps samt Datenbanken**
entstanden, u. a. mit **irritierenden Namen** (z. B. eine SQL database, die
`angular-blankapp` heißt, obwohl die App `testapp-1` heißt).

**Zwei Kernfragen**, die im Seminar beantwortet werden:

- *„Wo werden meine Daten gespeichert?"*
- *„Woher kommen all diese Datenbanken und wie werde ich die Altlasten los?"*

---

## 1. Hintergrund: Was eine Fabric-App mit Datendienst anlegt

Ist in `rayfin/rayfin.yml` der Datendienst aktiv …

```yaml
services:
  data:
    enabled: true
    dialect: "mssql"
    path: packages/data
```

… dann erzeugt **jedes Deployment eines App-Backends automatisch ein Trio**:

| Fabric-Element | Rolle |
|---|---|
| **App** (AppBackend) | Die Rayfin-App selbst (Auth, Data-API, statisches Frontend). |
| **SQL database** | Hier liegen die Tabellen/Zeilen – aus den `@entity`-Klassen generiert (z. B. Tabelle `Kunde`). |
| **SQL analytics endpoint** | Automatisch erzeugter, **lesender** T-SQL/Analytics-Zugang auf genau diese Datenbank. |

**Merksatz für Teilnehmende:** *Eine App = eine Datenbank + ein Analytics-Endpoint.*
Mehrere Apps im selben Workspace ⇒ entsprechend viele Datenbanken.

> **Wichtig:** Die App verbindet sich über das **App-Backend** (Endpoint +
> Publishable Key), **nicht** über den Anzeigenamen der Datenbank. Der
> DB-Anzeigename wird **einmalig bei der Erst-Bereitstellung** vergeben und
> danach nicht mehr geändert – daher können „alte" Namen hängen bleiben.

---

## 2. Wo liegen die Daten? (Diagnose, nur lesend)

```powershell
npx rayfin login status      # bestätigt Konto, Tenant, Gültigkeit
npx rayfin up status         # zeigt Item-ID, Workspace, verknüpfte SQL database
```

`rayfin up status` nennt u. a.:

- **Rayfin Item ID** `<item-guid>` (das App-Backend),
- **SQL Database** `<db-name>` / `<db-guid>` samt Portal-Link,
- **Services** (`auth`, `data`).

**Verifikation in der Datenbank** (Portal → SQL database → Objekt-Explorer bzw.
Abfrage-Editor, nur lesend):

```sql
SELECT TOP (20) * FROM [Kunde] ORDER BY [firma];
```

Findet man die Tabelle `Kunde` mit den erwarteten Zeilen, ist das die „echte"
Datenbank der App.

> **Didaktischer Hinweis:** Weicht der in `rayfin up status` genannte DB-Name von
> der Erwartung ab (hier `angular-blankapp` statt `testapp-1`), ist das ein guter
> Moment, um den Unterschied zwischen **funktionaler Verknüpfung** (Backend →
> DB-GUID) und **kosmetischem Anzeigenamen** zu besprechen.

---

## 3. Warum „wuchert" der Workspace?

Im Portal (Workspace-Liste) sieht man bei wiederholten Deployments schnell:

```
<App-A>            App
  └ <App-A>        SQL database
  └ <App-A>        SQL analytics endpoint
<App-B>            App
  └ <App-B>        SQL database
  └ <App-B>        SQL analytics endpoint
SampleWH           Warehouse            (Fabric-Beispiel)
SampleWH-SemModel  Semantic model       (Fabric-Beispiel)
…
```

**Ursachen:**

- Jeder neue/umbenannte App-Deploy legt (bei aktivem Datendienst) ein neues
  Trio an.
- Beispiel-Elemente (Warehouse, Semantic model) stammen aus Tutorials/Vorlagen.
- Groß-/Kleinschreibung oder Namenswechsel (`testapp-1` vs. `TestApp_1`) kann zu
  **Duplikaten** führen.

---

## 4. Workspace bereinigen (im Portal) — destruktiv!

> ⚠️ **Unwiderruflich.** Das Löschen entfernt die Elemente **inklusive ihrer
> Daten**. Vorher sicherstellen, dass keine benötigten Daten verloren gehen.
> **Den Workspace selbst nicht löschen** (nur leeren), sonst geht die zugewiesene
> Kapazität verloren.

Es gibt **keinen CLI-Befehl** zum Massenlöschen – bewusst, aus
Sicherheitsgründen. Vorgehen im **Fabric-Portal**, je Element „**…" → Delete**:

1. **Apps zuerst** – beim Löschen einer App werden **SQL database + SQL analytics
   endpoint automatisch mitgelöscht**.
2. **Danach freistehende Elemente** wie `Warehouse` und `Semantic model`
   (Semantic model vor dem zugehörigen Warehouse löschen).

Ergebnis: ein **leerer** Workspace (Kapazität bleibt erhalten).

---

## 5. Lokalen Deployment-Status zurücksetzen (lokal, nicht remote)

Nach dem Leeren zeigen die lokalen Dateien noch auf das **gelöschte** Item.
Damit `rayfin up` ein **frisches** Item anlegt (statt das gelöschte
wiederzuverwenden), die Registry zurücksetzen:

```powershell
# Sicherungen anlegen
Copy-Item rayfin\.deployments.json rayfin\.deployments.json.bak -Force
Copy-Item rayfin\.env              rayfin\.env.bak              -Force
```

- **`rayfin/.deployments.json`** auf „keine Deployments" setzen:

  ```json
  { "deployments": {}, "active": null }
  ```

- **`rayfin/.env`**: die item-spezifischen Werte entfernen/leeren
  (`RAYFIN_PUBLIC_API_URL`, `RAYFIN_PUBLIC_PUBLISHABLE_KEY`,
  `RAYFIN_PUBLIC_ITEM_ID`). Workspace-/Tenant-/Portal-Werte dürfen bleiben;
  `rayfin up` schreibt die Datei beim Deploy ohnehin neu.

> **Warum lokal zurücksetzen?** Die Registry speichert die Item-GUID zur
> **Wiederverwendung**. Ohne Reset könnte `rayfin up` versuchen, das gelöschte
> Item zu aktualisieren (404) statt ein neues zu erstellen.

---

## 6. Sauber neu deployen (mit Vorschau)

```powershell
# 1) Vorschau – validiert Eingaben & Workspace, ändert nichts
npx rayfin up -n --workspace-id <workspace-guid>

# 2) Deploy – legt ein frisches Item "<projekt-id aus rayfin.yml>" an
npx rayfin up --workspace-id <workspace-guid>

# 3) Kontrolle
npx rayfin up status
```

`rayfin up` führt nacheinander aus: Item anlegen/wiederverwenden → Publishable
Key abrufen → Laufzeiteinstellungen synchronisieren → **Datenbankschema anwenden**
(Tabelle `Kunde`) → Frontend bauen & als statischen Inhalt hochladen →
Deployment-Details in `rayfin/.deployments.json` und `rayfin/.env` speichern.

> Falls die Entity direkt nach dem Deploy noch GraphQL-Fehler liefert: kurz
> warten, bis der Status gesund ist, dann ggf. nur das Schema nachziehen:
> `npx rayfin up db apply` (`--force` **nur** bei bewusst akzeptiertem
> Datenverlust).

---

## 7. Verifizieren

1. `npx rayfin up status` → **genau ein** App-Item und **eine** SQL database mit
   erwartetem Namen.
2. Datenbank im Portal öffnen → Tabelle `Kunde` vorhanden.
3. App über die Hosting-URL öffnen, anmelden, einen Kunden anlegen, **F5**
   drücken → der Kunde bleibt erhalten (**Persistenz**).

---

## 8. Häufige Stolpersteine (Troubleshooting)

| Symptom | Ursache | Lösung |
|---|---|---|
| DB heißt anders als die App (z. B. `angular-blankapp`) | Anzeigename stammt aus Erst-Bereitstellung/Wiederverwendung | Kosmetisch; im Portal umbenennen **oder** sauber neu deployen |
| Viele Datenbanken im Workspace | Jede App mit Datendienst bringt ihre eigene DB mit | Altlasten im Portal löschen (Apps zuerst) |
| Nach Deploy „Internal server error" bei GraphQL | Textfeld ohne `max` (`NVARCHAR(MAX)`) | `max` an allen Textfeldern, `npx rayfin up db apply` |
| `rayfin up` will altes, gelöschtes Item nutzen | Registry nicht zurückgesetzt | `rayfin/.deployments.json` leeren (Abschnitt 5) |
| Entity direkt nach Deploy nicht abfragbar | Deployment noch nicht gesund | `npx rayfin up status`, dann `npx rayfin up db apply` |
| Nur 100 Datensätze sichtbar | Standard-Seitengröße der Data-API | Paginierung `.first(n).executePaginated()` + `.after(endCursor)` |

---

## 9. Diskussionsfragen fürs Seminar

- Warum gibt es **bewusst keinen** CLI-Befehl zum Massenlöschen von
  Workspace-Elementen?
- Worin unterscheiden sich **SQL database** und **SQL analytics endpoint**?
- Warum ist der **Anzeigename** einer Datenbank für die Funktion der App
  **irrelevant**?
- Welche Rolle spielt die **lokale Deploy-Registry** (`.deployments.json`) für
  Wiederverwendung vs. Neuanlage eines Items?

---

### Verwandte Projektdokumente

- [KUNDENVERWALTUNG.md](./KUNDENVERWALTUNG.md) – vollständige Schritt-für-Schritt-Anleitung der App.
- [UMSETZUNG-KUNDENVERWALTUNG.md](./UMSETZUNG-KUNDENVERWALTUNG.md) – die konkret angelegten/geänderten Dateien.
