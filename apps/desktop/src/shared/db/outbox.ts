import { v4 as uuidv4 } from "uuid";
import type Database from "@tauri-apps/plugin-sql";
import { getDeviceId } from "./device";

export type OutboxOperation = "insert" | "update";

// Encola un evento para sincronizar hacia la nube. Debe llamarse dentro de la
// misma transacción que la escritura de negocio (ver withTransaction) para
// garantizar que nunca quede una venta sin su evento correspondiente.
// El envío real (POST /sync/events del cloud-api) se implementa en la
// siguiente etapa; por ahora los eventos solo se acumulan con synced_at NULL.
export async function writeOutboxEvent(
  db: Database,
  entityType: string,
  entityId: string,
  operation: OutboxOperation,
  payload: unknown,
): Promise<void> {
  const deviceId = await getDeviceId(db);
  await db.execute(
    `INSERT INTO outbox_events (id, entity_type, entity_id, operation, payload, device_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      uuidv4(),
      entityType,
      entityId,
      operation,
      JSON.stringify(payload),
      deviceId,
      new Date().toISOString(),
    ],
  );
}
