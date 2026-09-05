import { useEffect, useState } from "react";
import { getDb } from "../db/client";
import { isSyncConfigured } from "./supabaseClient";
import { countPendingSync, runSync } from "./syncEngine";

export type SyncStatus =
  | "disabled" // sin VITE_SUPABASE_* configuradas -- respaldo no activado
  | "offline"
  | "syncing"
  | "synced"
  | "pending"
  | "error";

const SYNC_INTERVAL_MS = 20_000;

// Corre el motor de sync cada 20s y al recuperar conexión, mientras la app
// está abierta. Nunca bloquea la UI: cualquier pantalla puede seguir
// leyendo/escribiendo local sin importar el estado de este hook.
export function useSyncStatus(): { status: SyncStatus; pendingCount: number } {
  const [status, setStatus] = useState<SyncStatus>("disabled");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isSyncConfigured()) return;

    let cancelled = false;

    async function tick() {
      const db = await getDb();
      if (cancelled) return;

      if (!navigator.onLine) {
        setStatus("offline");
        setPendingCount(await countPendingSync(db));
        return;
      }

      setStatus("syncing");
      const result = await runSync(db);
      if (cancelled) return;

      const count = await countPendingSync(db);
      setPendingCount(count);
      setStatus(result.failed > 0 ? "error" : count > 0 ? "pending" : "synced");
    }

    tick();
    const interval = setInterval(tick, SYNC_INTERVAL_MS);
    window.addEventListener("online", tick);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("online", tick);
    };
  }, []);

  return { status, pendingCount };
}
