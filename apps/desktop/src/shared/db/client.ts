import Database from "@tauri-apps/plugin-sql";

let dbPromise: Promise<Database> | null = null;

// Conexión única y compartida a la base local. Las migraciones (ver
// src-tauri/migrations/0001_init.sql) se aplican automáticamente al abrir
// esta conexión por primera vez.
export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:pos.db");
  }
  return dbPromise;
}
