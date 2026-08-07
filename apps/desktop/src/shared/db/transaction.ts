import type Database from "@tauri-apps/plugin-sql";

// tauri-plugin-sql no expone una API de transacción tipada; BEGIN/COMMIT/ROLLBACK
// se envían como sentencias sueltas. Este helper centraliza ese patrón para que
// cada escritura de negocio (orden, producto, etc.) y su evento de outbox
// correspondiente queden atómicos.
export async function withTransaction<T>(
  db: Database,
  fn: () => Promise<T>,
): Promise<T> {
  await db.execute("BEGIN");
  try {
    const result = await fn();
    await db.execute("COMMIT");
    return result;
  } catch (err) {
    await db.execute("ROLLBACK");
    throw err;
  }
}
