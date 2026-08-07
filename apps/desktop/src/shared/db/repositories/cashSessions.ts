import type Database from "@tauri-apps/plugin-sql";
import type { CashSession } from "@pos/shared-types";

interface CashSessionRow {
  id: string;
  opened_by: string;
  opening_amount: number;
  opening_at: string;
  closed_by: string | null;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  closing_at: string | null;
  status: "open" | "closed";
  notes: string | null;
}

function toCashSession(row: CashSessionRow): CashSession {
  return row;
}

// La apertura/cierre de caja real (con captura de fondo inicial) se
// construye en la siguiente etapa; por ahora toda venta se asocia a la
// sesión abierta más reciente, sembrada por la migración inicial.
export async function getOpenCashSession(
  db: Database,
): Promise<CashSession | null> {
  const rows = await db.select<CashSessionRow[]>(
    "SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY opening_at DESC LIMIT 1",
  );
  return rows.length > 0 ? toCashSession(rows[0]) : null;
}
