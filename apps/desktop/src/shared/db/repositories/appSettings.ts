import type Database from "@tauri-apps/plugin-sql";
import { withTransaction } from "../transaction";
import { writeOutboxEvent } from "../outbox";

export async function getSetting(
  db: Database,
  key: string,
): Promise<string | null> {
  const rows = await db.select<{ value: string }[]>(
    "SELECT value FROM app_settings WHERE key = $1",
    [key],
  );
  return rows.length > 0 ? rows[0].value : null;
}

export async function setSetting(
  db: Database,
  key: string,
  value: string,
): Promise<void> {
  await withTransaction(db, async () => {
    await db.execute(
      `INSERT INTO app_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      [key, value],
    );
    await writeOutboxEvent(db, "app_setting", key, "update", { key, value });
  });
}

// Elimina una configuración (ej. "quitar imagen de fondo" para volver al
// color plano).
export async function clearSetting(db: Database, key: string): Promise<void> {
  await withTransaction(db, async () => {
    await db.execute("DELETE FROM app_settings WHERE key = $1", [key]);
    await writeOutboxEvent(db, "app_setting", key, "update", { key, value: null });
  });
}
