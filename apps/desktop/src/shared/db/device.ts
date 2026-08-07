import { v4 as uuidv4 } from "uuid";
import type Database from "@tauri-apps/plugin-sql";

let cachedDeviceId: string | null = null;

// Identifica a esta terminal/caja frente a la nube. Se genera una sola vez y
// se persiste en app_settings; sirve para no colisionar IDs entre varias
// cajas cuando se sincronicen a Postgres.
export async function getDeviceId(db: Database): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const rows = await db.select<{ value: string }[]>(
    "SELECT value FROM app_settings WHERE key = 'device_id'",
  );
  if (rows.length > 0) {
    cachedDeviceId = rows[0].value;
    return cachedDeviceId;
  }

  const id = uuidv4();
  await db.execute(
    "INSERT INTO app_settings (key, value) VALUES ('device_id', $1)",
    [id],
  );
  cachedDeviceId = id;
  return id;
}
