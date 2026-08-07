import type { PosDatabase } from "../client";
import { writeOutboxEvent } from "../outbox";

export async function getSetting(
  db: PosDatabase,
  key: string,
): Promise<string | null> {
  const row = await db.app_settings.get(key);
  return row ? row.value : null;
}

export async function setSetting(
  db: PosDatabase,
  key: string,
  value: string,
): Promise<void> {
  await db.app_settings.put({ key, value });
  await writeOutboxEvent(db, "app_setting", key, "update", { key, value });
}

// Elimina una configuración (ej. "quitar imagen de fondo" para volver al
// color plano).
export async function clearSetting(db: PosDatabase, key: string): Promise<void> {
  await db.app_settings.delete(key);
  await writeOutboxEvent(db, "app_setting", key, "update", { key, value: null });
}
