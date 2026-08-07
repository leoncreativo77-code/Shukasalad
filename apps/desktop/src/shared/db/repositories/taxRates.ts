import type Database from "@tauri-apps/plugin-sql";
import type { TaxRate } from "@pos/shared-types";

interface TaxRateRow {
  id: string;
  name: string;
  rate: number;
  is_default: number;
  active: number;
}

function toTaxRate(row: TaxRateRow): TaxRate {
  return { ...row, is_default: row.is_default === 1, active: row.active === 1 };
}

export async function getDefaultTaxRate(db: Database): Promise<TaxRate> {
  const rows = await db.select<TaxRateRow[]>(
    "SELECT * FROM tax_rates WHERE is_default = 1 AND active = 1 LIMIT 1",
  );
  if (rows.length === 0) {
    throw new Error("No hay una tasa de impuesto por defecto configurada");
  }
  return toTaxRate(rows[0]);
}
