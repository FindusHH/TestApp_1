import { useMemo, useState } from 'react';

import type { KundeRecord, KundeStatus } from '@rayfin-app/shared';

import { cn } from '@/lib/utils';

/**
 * Die editierbaren Felder eines Kunden – ohne `id` und Zeitstempel, die der
 * Server bzw. die Seite setzt. Optionale Felder werden beim Speichern als
 * `null` (statt leerer String) übergeben.
 */
export type KundenFormWerte = Omit<
  KundeRecord,
  'id' | 'erstelltAm' | 'geaendertAm'
>;

/** Maximale Längen – exakt wie die `@text`/`@email`-Constraints der Entity. */
const MAX = {
  firma: 100,
  ansprechpartner: 100,
  email: 254,
  telefon: 30,
  strasse: 200,
  plz: 10,
  ort: 100,
  notizen: 2000,
} as const;

const STATUS_OPTIONEN: readonly { wert: KundeStatus; label: string }[] = [
  { wert: 'lead', label: 'Lead' },
  { wert: 'aktiv', label: 'Aktiv' },
  { wert: 'inaktiv', label: 'Inaktiv' },
];

interface FormularFelder {
  firma: string;
  ansprechpartner: string;
  email: string;
  telefon: string;
  strasse: string;
  plz: string;
  ort: string;
  status: KundeStatus;
  notizen: string;
}

type Fehler = Partial<Record<keyof FormularFelder, string>>;

const LEER: FormularFelder = {
  firma: '',
  ansprechpartner: '',
  email: '',
  telefon: '',
  strasse: '',
  plz: '',
  ort: '',
  status: 'lead',
  notizen: '',
};

function ausRecord(kunde: KundeRecord): FormularFelder {
  return {
    firma: kunde.firma,
    ansprechpartner: kunde.ansprechpartner,
    email: kunde.email,
    telefon: kunde.telefon ?? '',
    strasse: kunde.strasse ?? '',
    plz: kunde.plz ?? '',
    ort: kunde.ort ?? '',
    status: kunde.status,
    notizen: kunde.notizen ?? '',
  };
}

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pruefen(felder: FormularFelder): Fehler {
  const fehler: Fehler = {};

  const firma = felder.firma.trim();
  if (!firma) fehler.firma = 'Firma ist erforderlich.';
  else if (firma.length > MAX.firma)
    fehler.firma = `Höchstens ${MAX.firma} Zeichen.`;

  const ansprechpartner = felder.ansprechpartner.trim();
  if (!ansprechpartner)
    fehler.ansprechpartner = 'Ansprechpartner ist erforderlich.';
  else if (ansprechpartner.length > MAX.ansprechpartner)
    fehler.ansprechpartner = `Höchstens ${MAX.ansprechpartner} Zeichen.`;

  const email = felder.email.trim();
  if (!email) fehler.email = 'E-Mail ist erforderlich.';
  else if (!EMAIL_MUSTER.test(email))
    fehler.email = 'Bitte eine gültige E-Mail-Adresse eingeben.';
  else if (email.length > MAX.email)
    fehler.email = `Höchstens ${MAX.email} Zeichen.`;

  if (felder.telefon.trim().length > MAX.telefon)
    fehler.telefon = `Höchstens ${MAX.telefon} Zeichen.`;
  if (felder.strasse.trim().length > MAX.strasse)
    fehler.strasse = `Höchstens ${MAX.strasse} Zeichen.`;
  if (felder.plz.trim().length > MAX.plz)
    fehler.plz = `Höchstens ${MAX.plz} Zeichen.`;
  if (felder.ort.trim().length > MAX.ort)
    fehler.ort = `Höchstens ${MAX.ort} Zeichen.`;
  if (felder.notizen.trim().length > MAX.notizen)
    fehler.notizen = `Höchstens ${MAX.notizen} Zeichen.`;

  return fehler;
}

/** Leere optionale Felder werden weggelassen (`null`), nicht als "" gesendet. */
function optional(wert: string): string | null {
  const getrimmt = wert.trim();
  return getrimmt === '' ? null : getrimmt;
}

function zuWerten(felder: FormularFelder): KundenFormWerte {
  return {
    firma: felder.firma.trim(),
    ansprechpartner: felder.ansprechpartner.trim(),
    email: felder.email.trim(),
    telefon: optional(felder.telefon),
    strasse: optional(felder.strasse),
    plz: optional(felder.plz),
    ort: optional(felder.ort),
    status: felder.status,
    notizen: optional(felder.notizen),
  };
}

export interface KundenFormularProps {
  /** Vorhandener Kunde beim Bearbeiten; `null`/undefiniert beim Anlegen. */
  readonly initial?: KundeRecord | null;
  readonly pending?: boolean;
  readonly onSubmit: (werte: KundenFormWerte) => void;
  readonly onCancel: () => void;
}

const feldKlasse =
  'w-full rounded-md border border-input bg-background px-300 py-200 text-300 ' +
  'text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 ' +
  'aria-[invalid=true]:border-destructive';

export function KundenFormular({
  initial,
  pending = false,
  onSubmit,
  onCancel,
}: KundenFormularProps) {
  const [felder, setFelder] = useState<FormularFelder>(() =>
    initial ? ausRecord(initial) : LEER
  );
  const [beruehrt, setBeruehrt] = useState(false);

  const fehler = useMemo(() => pruefen(felder), [felder]);
  const istGueltig = Object.keys(fehler).length === 0;

  const setzen =
    <K extends keyof FormularFelder>(feld: K) =>
    (wert: FormularFelder[K]) =>
      setFelder((prev) => ({ ...prev, [feld]: wert }));

  const absenden = (event: React.FormEvent) => {
    event.preventDefault();
    setBeruehrt(true);
    if (!istGueltig) return;
    onSubmit(zuWerten(felder));
  };

  const zeigeFehler = (feld: keyof FormularFelder) =>
    beruehrt ? fehler[feld] : undefined;

  return (
    <form onSubmit={absenden} noValidate className="space-y-400">
      <div className="grid gap-400 sm:grid-cols-2">
        <Textfeld
          id="firma"
          label="Firma"
          pflicht
          wert={felder.firma}
          maxLength={MAX.firma}
          fehler={zeigeFehler('firma')}
          onChange={setzen('firma')}
        />
        <Textfeld
          id="ansprechpartner"
          label="Ansprechpartner"
          pflicht
          wert={felder.ansprechpartner}
          maxLength={MAX.ansprechpartner}
          fehler={zeigeFehler('ansprechpartner')}
          onChange={setzen('ansprechpartner')}
        />
        <Textfeld
          id="email"
          label="E-Mail"
          type="email"
          pflicht
          wert={felder.email}
          maxLength={MAX.email}
          fehler={zeigeFehler('email')}
          onChange={setzen('email')}
        />
        <Textfeld
          id="telefon"
          label="Telefon"
          type="tel"
          wert={felder.telefon}
          maxLength={MAX.telefon}
          fehler={zeigeFehler('telefon')}
          onChange={setzen('telefon')}
        />
        <Textfeld
          id="strasse"
          label="Straße"
          wert={felder.strasse}
          maxLength={MAX.strasse}
          fehler={zeigeFehler('strasse')}
          onChange={setzen('strasse')}
        />
        <div className="grid grid-cols-[1fr_2fr] gap-300">
          <Textfeld
            id="plz"
            label="PLZ"
            wert={felder.plz}
            maxLength={MAX.plz}
            fehler={zeigeFehler('plz')}
            onChange={setzen('plz')}
          />
          <Textfeld
            id="ort"
            label="Ort"
            wert={felder.ort}
            maxLength={MAX.ort}
            fehler={zeigeFehler('ort')}
            onChange={setzen('ort')}
          />
        </div>
        <div className="flex flex-col gap-100">
          <label htmlFor="status" className="text-200 font-medium">
            Status <span className="text-destructive">*</span>
          </label>
          <select
            id="status"
            className={feldKlasse}
            value={felder.status}
            onChange={(e) => setzen('status')(e.target.value as KundeStatus)}
          >
            {STATUS_OPTIONEN.map((option) => (
              <option key={option.wert} value={option.wert}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-100">
        <label htmlFor="notizen" className="text-200 font-medium">
          Notizen
        </label>
        <textarea
          id="notizen"
          rows={3}
          maxLength={MAX.notizen}
          className={cn(feldKlasse, 'resize-y')}
          value={felder.notizen}
          aria-invalid={zeigeFehler('notizen') ? true : undefined}
          onChange={(e) => setzen('notizen')(e.target.value)}
        />
        {zeigeFehler('notizen') ? (
          <p className="text-200 text-destructive">{zeigeFehler('notizen')}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-300">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-md px-400 py-200 text-300 font-medium hover:bg-accent disabled:opacity-50"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={!istGueltig || pending}
          className="rounded-md bg-primary px-400 py-200 text-300 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}

interface TextfeldProps {
  readonly id: string;
  readonly label: string;
  readonly wert: string;
  readonly maxLength: number;
  readonly type?: 'text' | 'email' | 'tel';
  readonly pflicht?: boolean;
  readonly fehler?: string;
  readonly onChange: (wert: string) => void;
}

function Textfeld({
  id,
  label,
  wert,
  maxLength,
  type = 'text',
  pflicht = false,
  fehler,
  onChange,
}: TextfeldProps) {
  return (
    <div className="flex flex-col gap-100">
      <label htmlFor={id} className="text-200 font-medium">
        {label}
        {pflicht ? <span className="text-destructive"> *</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={wert}
        maxLength={maxLength}
        aria-invalid={fehler ? true : undefined}
        aria-describedby={fehler ? `${id}-fehler` : undefined}
        className={feldKlasse}
        onChange={(e) => onChange(e.target.value)}
      />
      {fehler ? (
        <p id={`${id}-fehler`} className="text-200 text-destructive">
          {fehler}
        </p>
      ) : null}
    </div>
  );
}
