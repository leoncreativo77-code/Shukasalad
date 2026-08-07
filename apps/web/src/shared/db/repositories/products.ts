import { v4 as uuidv4 } from "uuid";
import type { Product } from "@pos/shared-types";
import type { PosDatabase } from "../client";
import { writeOutboxEvent } from "../outbox";

export async function listProducts(
  db: PosDatabase,
  opts: { activeOnly?: boolean } = {},
): Promise<Product[]> {
  let rows = await db.products.toArray();
  if (opts.activeOnly) rows = rows.filter((p) => p.active);
  return rows.sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  );
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
  db: PosDatabase,
  input: NewProductInput,
): Promise<Product> {
  const now = new Date().toISOString();
  const product: Product = {
    id: uuidv4(),
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

  await db.products.add(product);
  await writeOutboxEvent(db, "product", product.id, "insert", product);

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
  db: PosDatabase,
  id: string,
  patch: ProductPatch,
): Promise<void> {
  const now = new Date().toISOString();
  const changes: Partial<Product> = { updated_at: now };
  if (patch.categoryId !== undefined) changes.category_id = patch.categoryId;
  if (patch.name !== undefined) changes.name = patch.name;
  if (patch.description !== undefined) changes.description = patch.description;
  if (patch.price !== undefined) changes.price = patch.price;
  if (patch.sku !== undefined) changes.sku = patch.sku;
  if (patch.sortOrder !== undefined) changes.sort_order = patch.sortOrder;

  if (Object.keys(changes).length === 1) return; // solo updated_at, nada que hacer

  await db.products.update(id, changes);
  await writeOutboxEvent(db, "product", id, "update", { id, ...patch });
}

export async function setProductActive(
  db: PosDatabase,
  id: string,
  active: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  await db.products.update(id, { active, updated_at: now });
  await writeOutboxEvent(db, "product", id, "update", { id, active });
}

// `imagePath` guarda en la web el `id` del Blob en la tabla `images` (ver
// shared/browser/pickImage.ts) -- mismo campo que en desktop, significado
// ligeramente distinto según la plataforma.
export async function setProductImage(
  db: PosDatabase,
  id: string,
  imagePath: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  await db.products.update(id, { image_path: imagePath, updated_at: now });
  await writeOutboxEvent(db, "product", id, "update", { id, image_path: imagePath });
}

// Posición dentro de la cuadrícula de venta de su categoría (ver
// ButtonLayoutEditor). Pasar null en ambos para quitar la posición y volver
// al flujo automático.
export async function setProductGridPosition(
  db: PosDatabase,
  id: string,
  gridCol: number | null,
  gridRow: number | null,
): Promise<void> {
  const now = new Date().toISOString();
  await db.products.update(id, {
    grid_col: gridCol,
    grid_row: gridRow,
    updated_at: now,
  });
  await writeOutboxEvent(db, "product", id, "update", {
    id,
    grid_col: gridCol,
    grid_row: gridRow,
  });
}

// Reordena la lista (no la cuadrícula libre) según el orden dado -- se
// persiste como 0,1,2,... en sort_order.
export async function reorderProducts(
  db: PosDatabase,
  orderedIds: string[],
): Promise<void> {
  const now = new Date().toISOString();
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    await db.products.update(id, { sort_order: i, updated_at: now });
    await writeOutboxEvent(db, "product", id, "update", { id, sort_order: i });
  }
}
