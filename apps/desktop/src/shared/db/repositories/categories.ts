import { v4 as uuidv4 } from "uuid";
import type Database from "@tauri-apps/plugin-sql";
import type { Category } from "@pos/shared-types";
import { withTransaction } from "../transaction";
import { writeOutboxEvent } from "../outbox";

interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
  active: number;
  created_at: string;
  updated_at: string;
}

function toCategory(row: CategoryRow): Category {
  return { ...row, active: row.active === 1 };
}

export async function listCategories(
  db: Database,
  opts: { activeOnly?: boolean } = {},
): Promise<Category[]> {
  const rows = await db.select<CategoryRow[]>(
    opts.activeOnly
      ? "SELECT * FROM categories WHERE active = 1 ORDER BY sort_order, name"
      : "SELECT * FROM categories ORDER BY sort_order, name",
  );
  return rows.map(toCategory);
}

export async function createCategory(
  db: Database,
  input: { name: string; sortOrder?: number },
): Promise<Category> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const category: Category = {
    id,
    name: input.name,
    sort_order: input.sortOrder ?? 0,
    active: true,
    created_at: now,
    updated_at: now,
  };

  await withTransaction(db, async () => {
    await db.execute(
      `INSERT INTO categories (id, name, sort_order, active, created_at, updated_at)
       VALUES ($1, $2, $3, 1, $4, $4)`,
      [id, category.name, category.sort_order, now],
    );
    await writeOutboxEvent(db, "category", id, "insert", category);
  });

  return category;
}

export async function setCategoryActive(
  db: Database,
  id: string,
  active: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  await withTransaction(db, async () => {
    await db.execute(
      "UPDATE categories SET active = $1, updated_at = $2 WHERE id = $3",
      [active ? 1 : 0, now, id],
    );
    await writeOutboxEvent(db, "category", id, "update", { id, active });
  });
}

export async function reorderCategories(
  db: Database,
  orderedIds: string[],
): Promise<void> {
  const now = new Date().toISOString();
  await withTransaction(db, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      await db.execute(
        "UPDATE categories SET sort_order = $1, updated_at = $2 WHERE id = $3",
        [i, now, id],
      );
      await writeOutboxEvent(db, "category", id, "update", { id, sort_order: i });
    }
  });
}

export async function updateCategory(
  db: Database,
  id: string,
  patch: { name?: string; sortOrder?: number },
): Promise<void> {
  const now = new Date().toISOString();
  await withTransaction(db, async () => {
    if (patch.name !== undefined) {
      await db.execute(
        "UPDATE categories SET name = $1, updated_at = $2 WHERE id = $3",
        [patch.name, now, id],
      );
    }
    if (patch.sortOrder !== undefined) {
      await db.execute(
        "UPDATE categories SET sort_order = $1, updated_at = $2 WHERE id = $3",
        [patch.sortOrder, now, id],
      );
    }
    await writeOutboxEvent(db, "category", id, "update", { id, ...patch });
  });
}
