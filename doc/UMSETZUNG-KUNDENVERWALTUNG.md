# Umsetzung der Kundenverwaltung – ergänzte Dateien

Diese Datei dokumentiert die Dateien, die für die Umsetzung von Abschnitt 7
(„Benutzeroberfläche: Liste und Formular") aus [KUNDENVERWALTUNG.md](./KUNDENVERWALTUNG.md)
**neu angelegt** oder **geändert** wurden, inklusive der dafür nötigen
Verdrahtung in den Paketen `shared` und `data`.

Stand der Qualitätsprüfung (Abschnitt 9): `typecheck`, `build`, `lint` und
`test` (50/50) laufen grün.

---

## Überblick

| Datei | Status | Paket | Zweck |
|---|---|---|---|
| `packages/frontend/src/features/kunden/kunden.api.ts` | neu | frontend | Datenzugriff auf die Entity `Kunde` |
| `packages/frontend/src/features/kunden/KundenFormular.tsx` | neu | frontend | Formular zum Anlegen/Bearbeiten inkl. Validierung |
| `packages/frontend/src/features/kunden/KundenListe.tsx` | neu | frontend | Tabelle mit Suche, Statusfilter, Löschbestätigung |
| `packages/frontend/src/features/kunden/KundenSeite.tsx` | neu | frontend | Seitenlayout, Zustände, Formular-Dialog |
| `packages/frontend/src/App.tsx` | geändert | frontend | Platzhalter durch `KundenSeite` ersetzt |
| `packages/shared/src/index.ts` | geändert | shared | Exportiert den `Kunde`-Vertrag statt `Item` |
| `packages/data/src/index.ts` | geändert | data | Registriert `Kunde` statt `Item` im Schema |
| `packages/data/src/Item.ts` | gelöscht | data | Beispiel-Entity entfernt |
| `packages/frontend/src/Root.spec.tsx` | geändert | frontend | Auth-Gating-Tests auf neuen App-Inhalt angepasst |

---

## Frontend: Feature `kunden`

Alle neuen UI-Dateien liegen gebündelt unter
`packages/frontend/src/features/kunden/`. Importe innerhalb des Frontends nutzen
den Alias `@/`; Datensatz-Typen kommen ausschließlich aus
`@rayfin-app/shared` (nie die dekorierte Klasse `Kunde`).

### `kunden.api.ts`

Datenzugriff auf die Entity `Kunde` über den typisierten Rayfin-Client
(`await getRayfinClient()`).

- Exportiert `kundenApi`, typisiert als `CrudApi<KundeRecord>`, damit es direkt
  an `useCrud` übergeben werden kann.
- `list` liest alle Felder (`FELDER`) und sortiert nach `firma` aufsteigend
  (`.select(...).orderBy({ firma: 'asc' }).execute()`).
- `create` reicht die Eingabe durch; die Zeitstempel `erstelltAm`/`geaendertAm`
  werden in `KundenSeite` beim Anlegen gesetzt.
- `update` setzt bei jeder Änderung `geaendertAm` neu.
- `remove` löscht anhand der `id` und gibt `void` zurück.

> Hinweis: `.execute()` liefert standardmäßig nur eine Seite (100 Datensätze).
> Für größere Bestände auf `.first(n).executePaginated()` mit `.after(endCursor)`
> umstellen.

### `KundenFormular.tsx`

Kontrolliertes Formular zum Anlegen und Bearbeiten eines Kunden.

- Exportiert die Komponente `KundenFormular` und den Typ `KundenFormWerte`
  (`Omit<KundeRecord, 'id' | 'erstelltAm' | 'geaendertAm'>`).
- Props: `initial` (vorhandener Kunde beim Bearbeiten), `pending`, `onSubmit`,
  `onCancel`.
- Validierung clientseitig **exakt** gemäß den Schema-Constraints
  (`firma`/`ansprechpartner` 1–100, `email` gültiges Format max. 254,
  `telefon` max. 30, `strasse` max. 200, `plz` max. 10, `ort` max. 100,
  `notizen` max. 2000); Status (`lead`/`aktiv`/`inaktiv`) mit Vorgabe `lead`.
- „Speichern" ist deaktiviert, solange Pflichtfelder fehlen oder gespeichert
  wird (`pending`). Fehlermeldungen stehen direkt am jeweiligen Feld
  (`aria-invalid`, `aria-describedby`).
- Leere optionale Felder werden als `null` (nicht als leerer String)
  übergeben.

### `KundenListe.tsx`

Tabellenansicht der Kunden mit Suche und Filter.

- Exportiert die Komponente `KundenListe`.
- Props: `kunden`, `pending`, `onBearbeiten`, `onLoeschen` und optional
  `onBeispieleAnlegen` (Knopf im Leerzustand).
- Spalten: Firma, Ansprechpartner, E-Mail, Ort, Status (Badge), Aktionen.
- Clientseitige Suche über Firma/Ansprechpartner/Ort und Statusfilter.
- „Löschen" zeigt die `ConfirmDelete`-Bestätigung mit dem Firmennamen;
  „Bearbeiten" reicht den Kunden an die Seite weiter.
- Leerzustand („Noch keine Kunden") und Treffer-Leerzustand über die
  gemeinsame `EmptyState`-Komponente.

### `KundenSeite.tsx`

Seitenlayout, das Liste, Formular und Zustände zusammenführt.

- Exportiert die Komponente `KundenSeite` (von `App.tsx` gerendert).
- Nutzt `useCrud(kundenApi)` für Laden, optimistische Mutationen und
  Fehlerzustände.
- Kopfzeile mit Titel, „Neuer Kunde"-Knopf und Theme-Umschalter
  (`useTheme`).
- Zeigt `LoadingState` beim initialen Laden und `ErrorState` (mit „Erneut
  versuchen") bei Lade-/Mutationsfehlern.
- Öffnet das Formular in einem modalen Dialog; der Dialog schließt **erst nach
  erfolgreichem Speichern**, bei Fehler bleiben die Eingaben erhalten und der
  Fehler wird angezeigt. Beim Anlegen werden `erstelltAm`/`geaendertAm` gesetzt.

### `App.tsx` (geändert)

Der Platzhalter `EmptyStatePreview` wurde durch `KundenSeite` ersetzt. Die
Auth-Grenze bleibt unverändert: `App` wird weiterhin innerhalb von `AuthGate`
gerendert, sodass App-Inhalte erst nach erfolgreicher Anmeldung erscheinen.

---

## Shared und Data: Verdrahtung der Entity `Kunde`

Die UI setzt auf dem `Kunde`-Vertrag auf. Dafür wurde die noch auf das
Beispiel `Item` zeigende Registrierung auf `Kunde` umgestellt (Abschnitte 6.1
und 6.2 der Anleitung).

### `packages/shared/src/index.ts` (geändert)

Exportiert jetzt `KundeStatus`, `KundeRecord` und `UniversalAppSchema` aus
`./Kunde` (der browser-sichere Vertrag in
[`packages/shared/src/Kunde.ts`](../packages/shared/src/Kunde.ts)). Der frühere
`ItemRecord`-Typ wurde entfernt.

### `packages/data/src/index.ts` (geändert)

Registriert die dekorierte Klasse `Kunde` im `schema`-Array und re-exportiert
`UniversalAppSchema`. Die `Item`-Registrierung wurde entfernt.

### `packages/data/src/Item.ts` (gelöscht)

Die Beispiel-Entity wurde entfernt, da sie durch
[`packages/data/src/Kunde.ts`](../packages/data/src/Kunde.ts) ersetzt ist.

---

## Tests

### `packages/frontend/src/Root.spec.tsx` (geändert)

Die Tests zum Auth-Gating prüfen, ob geschützter App-Inhalt erst nach
erfolgreicher Anmeldung erscheint. Da der geschützte Inhalt nun die Kundenseite
ist, wurde der Marker von der alten Welcome-Überschrift auf die Überschrift
„Kundenverwaltung" umgestellt. Die Aussagekraft der Auth-Tests bleibt dabei
erhalten.
