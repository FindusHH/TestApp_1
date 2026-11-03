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
