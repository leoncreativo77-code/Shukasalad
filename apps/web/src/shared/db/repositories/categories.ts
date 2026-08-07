import { v4 as uuidv4 } from "uuid";
import type { Category } from "@pos/shared-types";
import type { PosDatabase } from "../client";
import { writeOutboxEvent } from "../outbox";

export async function listCategories(
  db: PosDatabase,
  opts: { activeOnly?: boolean } = {},
): Promise<Category[]> {
  let rows = await db.categories.toArray();
  if (opts.activeOnly) rows = rows.filter((c) => c.active);
  return rows.sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  );
}

export async function createCategory(
  db: PosDatabase,
  input: { name: string; sortOrder?: number },
): Promise<Category> {
  const now = new Date().toISOString();
  const category: Category = {
    id: uuidv4(),
    name: input.name,
    sort_order: input.sortOrder ?? 0,
    active: true,
    created_at: now,
    updated_at: now,
  };

  await db.categories.add(category);
  await writeOutboxEvent(db, "category", category.id, "insert", category);

  return category;
}

export async function setCategoryActive(
  db: PosDatabase,
  id: string,
  active: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  await db.categories.update(id, { active, updated_at: now });
  await writeOutboxEvent(db, "category", id, "update", { id, active });
}

export async function reorderCategories(
  db: PosDatabase,
  orderedIds: string[],
): Promise<void> {
  const now = new Date().toISOString();
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    await db.categories.update(id, { sort_order: i, updated_at: now });
    await writeOutboxEvent(db, "category", id, "update", { id, sort_order: i });
  }
}

export async function updateCategory(
  db: PosDatabase,
  id: string,
  patch: { name?: string; sortOrder?: number },
): Promise<void> {
  const now = new Date().toISOString();
  const changes: Partial<Category> = { updated_at: now };
  if (patch.name !== undefined) changes.name = patch.name;
  if (patch.sortOrder !== undefined) changes.sort_order = patch.sortOrder;

  await db.categories.update(id, changes);
  await writeOutboxEvent(db, "category", id, "update", { id, ...patch });
}
