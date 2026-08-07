import { v4 as uuidv4 } from "uuid";
import type { PosDatabase } from "./client";

let cachedDeviceId: string | null = null;

// Identifica a este navegador/dispositivo frente a la nube. Se genera una
// sola vez y se persiste en app_settings; sirve para no colisionar IDs entre
// varias cajas cuando se sincronicen a Postgres.
export async function getDeviceId(db: PosDatabase): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const row = await db.app_settings.get("device_id");
  if (row) {
    cachedDeviceId = row.value;
    return cachedDeviceId;
  }

  const id = uuidv4();
  await db.app_settings.put({ key: "device_id", value: id });
  cachedDeviceId = id;
  return id;
}
