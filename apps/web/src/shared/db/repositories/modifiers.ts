import type { Modifier } from "@pos/shared-types";
import type { PosDatabase } from "../client";

export async function listModifiers(db: PosDatabase): Promise<Modifier[]> {
  const rows = await db.modifiers.toArray();
  return rows.filter((m) => m.active).sort((a, b) => a.name.localeCompare(b.name));
}

// Modificadores disponibles para un producto específico (ej. "sin cebolla"
// solo aparece para productos a los que se les asignó en product_modifiers).
export async function listModifiersForProduct(
  db: PosDatabase,
  productId: string,
): Promise<Modifier[]> {
  const links = await db.product_modifiers
    .where("product_id")
    .equals(productId)
    .toArray();
  const modifiers = await db.modifiers.bulkGet(links.map((l) => l.modifier_id));
  return modifiers
    .filter((m): m is Modifier => !!m && m.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}
