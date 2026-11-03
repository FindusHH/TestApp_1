import type { KundeRecord } from '@rayfin-app/shared';

import type { CrudApi } from '@/components/useCrud';
import { getRayfinClient } from '@/lib/rayfin-client';

/**
 * Datenzugriff auf die Entity `Kunde` über den typisierten Rayfin-Client.
 *
 * Die Form entspricht `CrudApi<KundeRecord>`, damit sie direkt an `useCrud`
 * übergeben werden kann. Die Seite setzt `erstelltAm`/`geaendertAm` beim
 * Anlegen; `update` aktualisiert `geaendertAm` bei jeder Änderung.
 */
const FELDER = [
  'id',
  'firma',
  'ansprechpartner',
  'email',
  'telefon',
  'strasse',
  'plz',
  'ort',
  'status',
  'notizen',
  'erstelltAm',
  'geaendertAm',
] as const satisfies readonly (keyof KundeRecord)[];

export const kundenApi: CrudApi<KundeRecord> = {
  list: async () =>
    (await getRayfinClient()).data.Kunde.select(FELDER)
      .orderBy({ firma: 'asc' })
      .execute(),

  create: async (input) =>
    (await getRayfinClient()).data.Kunde.create(input),

  update: async (id, patch) =>
    (await getRayfinClient()).data.Kunde.update(
      { id },
      { ...patch, geaendertAm: new Date() }
    ),

  remove: async (id) => {
    await (await getRayfinClient()).data.Kunde.delete({ id });
  },
};
