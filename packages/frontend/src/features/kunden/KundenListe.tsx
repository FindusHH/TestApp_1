import { useMemo, useState } from 'react';

import type { KundeRecord, KundeStatus } from '@rayfin-app/shared';

import { ConfirmDelete, EmptyState } from '@/components/states';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<KundeStatus, string> = {
  lead: 'Lead',
  aktiv: 'Aktiv',
  inaktiv: 'Inaktiv',
};

const STATUS_BADGE: Record<KundeStatus, string> = {
  lead: 'bg-muted text-muted-foreground',
  aktiv:
    'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground',
  inaktiv: 'bg-destructive/10 text-destructive',
};

type StatusFilter = KundeStatus | 'alle';

function StatusBadge({ status }: { readonly status: KundeStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-300 py-100-nudge text-100 font-semibold',
        STATUS_BADGE[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export interface KundenListeProps {
  readonly kunden: readonly KundeRecord[];
  readonly pending?: boolean;
  readonly onBearbeiten: (kunde: KundeRecord) => void;
  readonly onLoeschen: (id: string) => void;
  /** Optionaler Knopf im Leerzustand, falls Beispieldaten erlaubt sind. */
  readonly onBeispieleAnlegen?: () => void;
}

export function KundenListe({
  kunden,
  pending = false,
  onBearbeiten,
  onLoeschen,
  onBeispieleAnlegen,
}: KundenListeProps) {
  const [suche, setSuche] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');
  const [loeschKandidat, setLoeschKandidat] = useState<KundeRecord | null>(
    null
  );

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    return kunden.filter((kunde) => {
      const passtStatus =
        statusFilter === 'alle' || kunde.status === statusFilter;
      if (!passtStatus) return false;
      if (!begriff) return true;
      return [kunde.firma, kunde.ansprechpartner, kunde.ort ?? '']
        .join(' ')
        .toLowerCase()
        .includes(begriff);
    });
  }, [kunden, suche, statusFilter]);

  if (kunden.length === 0) {
    return (
      <EmptyState
        title="Noch keine Kunden"
        hint="Lege den ersten Kunden an, um loszulegen."
        action={
          onBeispieleAnlegen ? (
            <button
              type="button"
              onClick={onBeispieleAnlegen}
              disabled={pending}
              className="rounded-md border border-input px-400 py-200 text-300 font-medium hover:bg-accent disabled:opacity-50"
            >
              Beispielkunden anlegen
            </button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-400">
      <div className="flex flex-col gap-300 sm:flex-row sm:items-center">
        <input
          type="search"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Suche nach Firma, Ansprechpartner oder Ort…"
          aria-label="Kunden durchsuchen"
          className="w-full rounded-md border border-input bg-background px-300 py-200 text-300 outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 sm:max-w-sm"
        />
        <div className="flex items-center gap-200">
          <label htmlFor="status-filter" className="text-200 text-muted-foreground">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-input bg-background px-300 py-200 text-300 outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          >
            <option value="alle">Alle</option>
            <option value="lead">Lead</option>
            <option value="aktiv">Aktiv</option>
            <option value="inaktiv">Inaktiv</option>
          </select>
        </div>
      </div>

      {gefiltert.length === 0 ? (
        <EmptyState
          title="Keine Treffer"
          hint="Keine Kunden passen zu Suche und Filter."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-300">
            <thead className="bg-muted/60 text-200 text-muted-foreground">
              <tr>
                <th className="px-400 py-300 font-semibold">Firma</th>
                <th className="px-400 py-300 font-semibold">Ansprechpartner</th>
                <th className="px-400 py-300 font-semibold">E-Mail</th>
                <th className="px-400 py-300 font-semibold">Ort</th>
                <th className="px-400 py-300 font-semibold">Status</th>
                <th className="px-400 py-300 text-right font-semibold">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {gefiltert.map((kunde) => {
                const wirdGeloescht = loeschKandidat?.id === kunde.id;
                return (
                  <tr
                    key={kunde.id}
                    className="border-t border-border align-top"
                  >
                    <td className="px-400 py-300 font-medium">{kunde.firma}</td>
                    <td className="px-400 py-300">{kunde.ansprechpartner}</td>
                    <td className="px-400 py-300">
                      <a
                        href={`mailto:${kunde.email}`}
                        className="text-primary hover:underline"
                      >
                        {kunde.email}
                      </a>
                    </td>
                    <td className="px-400 py-300">{kunde.ort ?? '—'}</td>
                    <td className="px-400 py-300">
                      <StatusBadge status={kunde.status} />
                    </td>
                    <td className="px-400 py-300">
                      {wirdGeloescht ? (
                        <ConfirmDelete
                          label={kunde.firma}
                          pending={pending}
                          onConfirm={() => {
                            onLoeschen(kunde.id);
                            setLoeschKandidat(null);
                          }}
                          onCancel={() => setLoeschKandidat(null)}
                        />
                      ) : (
                        <div className="flex justify-end gap-200">
                          <button
                            type="button"
                            onClick={() => onBearbeiten(kunde)}
                            className="rounded px-300 py-100 text-200 font-medium hover:bg-accent"
                          >
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            onClick={() => setLoeschKandidat(kunde)}
                            className="rounded px-300 py-100 text-200 font-medium text-destructive hover:bg-destructive/10"
                          >
                            Löschen
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-200 text-muted-foreground">
        {gefiltert.length} von {kunden.length} Kunden
      </p>
    </div>
  );
}
