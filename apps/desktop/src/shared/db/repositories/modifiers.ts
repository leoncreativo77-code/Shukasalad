import type Database from "@tauri-apps/plugin-sql";
import type { Modifier } from "@pos/shared-types";

interface ModifierRow {
  id: string;
  name: string;
  price_delta: number;
  active: number;
  created_at: string;
  updated_at: string;
}

function toModifier(row: ModifierRow): Modifier {
  return { ...row, active: row.active === 1 };
}

export async function listModifiers(db: Database): Promise<Modifier[]> {
  const rows = await db.select<ModifierRow[]>(
    "SELECT * FROM modifiers WHERE active = 1 ORDER BY name",
  );
  return rows.map(toModifier);
}

// Modificadores disponibles para un producto específico (ej. "sin cebolla"
// solo aparece para productos a los que se les asignó en product_modifiers).
export async function listModifiersForProduct(
  db: Database,
  productId: string,
): Promise<Modifier[]> {
  const rows = await db.select<ModifierRow[]>(
    `SELECT m.* FROM modifiers m
     INNER JOIN product_modifiers pm ON pm.modifier_id = m.id
     WHERE pm.product_id = $1 AND m.active = 1
     ORDER BY m.name`,
    [productId],
  );
  return rows.map(toModifier);
}
