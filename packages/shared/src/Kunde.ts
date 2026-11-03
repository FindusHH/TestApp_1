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
