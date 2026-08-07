import type { TaxRate } from "@pos/shared-types";
import type { PosDatabase } from "../client";

export async function getDefaultTaxRate(db: PosDatabase): Promise<TaxRate> {
  const rows = await db.tax_rates.toArray();
  const rate = rows.find((r) => r.is_default && r.active);
  if (!rate) {
    throw new Error("No hay una tasa de impuesto por defecto configurada");
  }
  return rate;
}
