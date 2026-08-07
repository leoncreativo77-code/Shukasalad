import type { CashSession } from "@pos/shared-types";
import type { PosDatabase } from "../client";

// La apertura/cierre de caja real (con captura de fondo inicial) se
// construye en la siguiente etapa; por ahora toda venta se asocia a la
// sesión abierta más reciente, sembrada por seedIfEmpty().
export async function getOpenCashSession(
  db: PosDatabase,
): Promise<CashSession | null> {
  const rows = await db.cash_sessions.where("status").equals("open").toArray();
  if (rows.length === 0) return null;
  rows.sort((a, b) => a.opening_at.localeCompare(b.opening_at));
  return rows[rows.length - 1];
}
