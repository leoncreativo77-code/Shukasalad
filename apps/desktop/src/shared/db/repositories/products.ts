import { v4 as uuidv4 } from "uuid";
import type Database from "@tauri-apps/plugin-sql";
import type { Product } from "@pos/shared-types";
import { withTransaction } from "../transaction";
import { writeOutboxEvent } from "../outbox";

interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  active: number;
  sort_order: number;
  image_path: string | null;
  grid_col: number | null;
  grid_row: number | null;
  created_at: string;
  updated_at: string;
}

function toProduct(row: ProductRow): Product {
  return { ...row, active: row.active === 1 };
}

export async function listProducts(
  db: Database,
  opts: { activeOnly?: boolean } = {},
): Promise<Product[]> {
  const rows = await db.select<ProductRow[]>(
    opts.activeOnly
      ? "SELECT * FROM products WHERE active = 1 ORDER BY sort_order, name"
      : "SELECT * FROM products ORDER BY sort_order, name",
  );
  return rows.map(toProduct);
}

export interface NewProductInput {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  sortOrder?: number;
}

export async function createProduct(
  db: Database,
  input: NewProductInput,
): Promise<Product> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const product: Product = {
    id,
    category_id: input.categoryId,
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    sku: input.sku ?? null,
    active: true,
    sort_order: input.sortOrder ?? 0,
    image_path: null,
    grid_col: null,
    grid_row: null,
    created_at: now,
    updated_at: now,
  };

  await withTransaction(db, async () => {
    await db.execute(
      `INSERT INTO products (id, category_id, name, description, price, sku, active, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $8)`,
      [
        id,
        product.category_id,
        product.name,
        product.description,
        product.price,
        product.sku,
        product.sort_order,
        now,
      ],
    );
    await writeOutboxEvent(db, "product", id, "insert", product);
  });

  return product;
}

export interface ProductPatch {
  categoryId?: string;
  name?: string;
  description?: string | null;
  price?: number;
  sku?: string | null;
  sortOrder?: number;
}

export async function updateProduct(
  db: Database,
  id: string,
  patch: ProductPatch,
): Promise<void> {
  const now = new Date().toISOString();
  const fieldMap: Record<string, unknown> = {
    category_id: patch.categoryId,
    name: patch.name,
    description: patch.description,
    price: patch.price,
    sku: patch.sku,
    sort_order: patch.sortOrder,
  };
  const setClauses = Object.entries(fieldMap).filter(([, v]) => v !== undefined);
  if (setClauses.length === 0) return;

  await withTransaction(db, async () => {
    const assignments = setClauses
      .map(([col], i) => `${col} = $${i + 1}`)
      .join(", ");
    const values = setClauses.map(([, v]) => v);
    await db.execute(
      `UPDATE products SET ${assignments}, updated_at = $${values.length + 1} WHERE id = $${values.length + 2}`,
      [...values, now, id],
    );
    await writeOutboxEvent(db, "product", id, "update", { id, ...patch });
  });
}

export async function setProductActive(
  db: Database,
  id: string,
  active: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  await withTransaction(db, async () => {
    await db.execute(
      "UPDATE products SET active = $1, updated_at = $2 WHERE id = $3",
      [active ? 1 : 0, now, id],
    );
    await writeOutboxEvent(db, "product", id, "update", { id, active });
  });
}

export async function setProductImage(
  db: Database,
  id: string,
  imagePath: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  await withTransaction(db, async () => {
    await db.execute(
      "UPDATE products SET image_path = $1, updated_at = $2 WHERE id = $3",
      [imagePath, now, id],
    );
    await writeOutboxEvent(db, "product", id, "update", { id, image_path: imagePath });
  });
}

// Posición dentro de la cuadrícula de venta de su categoría (ver
// ButtonLayoutEditor). Pasar null en ambos para quitar la posición y volver
// al flujo automático.
export async function setProductGridPosition(
  db: Database,
  id: string,
  gridCol: number | null,
  gridRow: number | null,
): Promise<void> {
  const now = new Date().toISOString();
  await withTransaction(db, async () => {
    await db.execute(
      "UPDATE products SET grid_col = $1, grid_row = $2, updated_at = $3 WHERE id = $4",
      [gridCol, gridRow, now, id],
    );
    await writeOutboxEvent(db, "product", id, "update", {
      id,
      grid_col: gridCol,
      grid_row: gridRow,
    });
  });
}

// Reordena la lista (no la cuadrícula libre) según el orden dado -- se
// persiste como 0,1,2,... en sort_order.
export async function reorderProducts(
  db: Database,
  orderedIds: string[],
): Promise<void> {
  const now = new Date().toISOString();
  await withTransaction(db, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      await db.execute(
        "UPDATE products SET sort_order = $1, updated_at = $2 WHERE id = $3",
        [i, now, id],
      );
      await writeOutboxEvent(db, "product", id, "update", { id, sort_order: i });
    }
  });
}
