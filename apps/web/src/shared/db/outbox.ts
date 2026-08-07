import { v4 as uuidv4 } from "uuid";
import type { PosDatabase } from "./client";
import { getDeviceId } from "./device";

export type OutboxOperation = "insert" | "update";

// Encola un evento para sincronizar hacia la nube. Se llama justo después de
// la escritura de negocio correspondiente. El envío real (POST /sync/events
// del cloud-api) se implementa en la siguiente etapa; por ahora los eventos
// solo se acumulan con synced_at NULL.
export async function writeOutboxEvent(
  db: PosDatabase,
  entityType: string,
  entityId: string,
  operation: OutboxOperation,
  payload: unknown,
): Promise<void> {
  const deviceId = await getDeviceId(db);
  await db.outbox_events.add({
    id: uuidv4(),
    entity_type: entityType,
    entity_id: entityId,
    operation,
    payload: JSON.stringify(payload),
    device_id: deviceId,
    created_at: new Date().toISOString(),
    synced_at: null,
    attempts: 0,
    last_error: null,
  });
}
