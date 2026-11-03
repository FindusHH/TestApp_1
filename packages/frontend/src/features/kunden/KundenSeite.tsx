import { useEffect, useState } from 'react';

import type { KundeRecord } from '@rayfin-app/shared';

import { ErrorState, LoadingState } from '@/components/states';
import { useCrud } from '@/components/useCrud';
import { useAuth } from '@/hooks/auth.context';
import { useTheme } from '@/hooks/theme.context';

import type { KundenFormWerte } from './KundenFormular';
import { KundenFormular } from './KundenFormular';
import { KundenListe } from './KundenListe';
import { kundenApi } from './kunden.api';

export function KundenSeite() {
  const crud = useCrud<KundeRecord>(kundenApi);
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  const [dialogOffen, setDialogOffen] = useState(false);
  const [bearbeite, setBearbeite] = useState<KundeRecord | null>(null);
  const [absende, setAbsende] = useState(false);

  // Das Formular wird erst nach erfolgreichem Speichern geschlossen. useCrud
  // fängt Fehler intern ab und setzt `error`; bei einem Fehler bleibt der
  // Dialog mit den Eingaben offen. Das Schließen ist eine kontrollierte
  // Reaktion auf das Ende einer Mutation – dasselbe Muster, das useCrud für
  // seinen Lade-Effekt verwendet.
  useEffect(() => {
    if (!absende || crud.pending) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!crud.error) {
      setDialogOffen(false);
      setBearbeite(null);
    }
    setAbsende(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [absende, crud.pending, crud.error]);

  const dialogOeffnen = (kunde: KundeRecord | null) => {
    crud.clearError();
    setBearbeite(kunde);
    setDialogOffen(true);
  };

  const dialogSchliessen = () => {
    if (crud.pending) return;
    setDialogOffen(false);
    setBearbeite(null);
  };

  const absenden = (werte: KundenFormWerte) => {
    setAbsende(true);
    if (bearbeite) {
      void crud.update(bearbeite.id, werte);
    } else {
      const jetzt = new Date();
      void crud.create({ ...werte, erstelltAm: jetzt, geaendertAm: jetzt });
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-400 py-600">
        <header className="mb-600 flex flex-wrap items-start justify-between gap-400">
          <div>
            <h1 className="text-hero-700 font-semibold leading-hero-700">
              Kundenverwaltung
            </h1>
            <p className="mt-100 text-300 text-muted-foreground">
              Kunden anlegen, bearbeiten und verwalten – für das ganze Team.
            </p>
          </div>
          <div className="flex items-center gap-300">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDark ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln'
              }
              className="rounded-md border border-input px-300 py-200 text-300 hover:bg-accent"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={() => dialogOeffnen(null)}
              className="rounded-md bg-primary px-400 py-200 text-300 font-medium text-primary-foreground hover:opacity-90"
            >
              Neuer Kunde
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-md border border-input px-400 py-200 text-300 font-medium hover:bg-accent"
            >
              Abmelden
            </button>
          </div>
        </header>

        {crud.error && !dialogOffen ? (
          <div className="mb-400">
            <ErrorState message={crud.error} onRetry={() => void crud.refresh()} />
          </div>
        ) : null}

        {crud.status === 'loading' && crud.items.length === 0 ? (
          <LoadingState rows={4} />
        ) : (
          <KundenListe
            kunden={crud.items}
            pending={crud.pending}
            onBearbeiten={dialogOeffnen}
            onLoeschen={(id) => void crud.remove(id)}
          />
        )}
      </div>

      {dialogOffen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-400"
          role="presentation"
          onClick={dialogSchliessen}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={bearbeite ? 'Kunde bearbeiten' : 'Kunde anlegen'}
            className="mt-600 w-full max-w-2xl rounded-xl border border-border bg-card p-600 text-card-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-400 text-500 font-semibold">
              {bearbeite ? 'Kunde bearbeiten' : 'Kunde anlegen'}
            </h2>
            {crud.error ? (
              <div className="mb-400">
                <ErrorState message={crud.error} />
              </div>
            ) : null}
            <KundenFormular
              initial={bearbeite}
              pending={crud.pending}
              onSubmit={absenden}
              onCancel={dialogSchliessen}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
