import { v4 as uuidv4 } from "uuid";
import type Database from "@tauri-apps/plugin-sql";
import type { User, UserRole } from "@pos/shared-types";
import { sha256Hex } from "../../auth/pinHash";
import { withTransaction } from "../transaction";
import { writeOutboxEvent } from "../outbox";

interface UserRow {
  id: string;
  name: string;
  pin_hash: string;
  role: UserRole;
  active: number;
  created_at: string;
  updated_at: string;
}

function toUser(row: UserRow): User {
  return { ...row, active: row.active === 1 };
}

// Autentica por PIN: se hashea el PIN capturado y se busca un cajero activo
// con ese hash. No hay "usuario" explícito que escribir, así el numpad de
// login puede ser ciego (no pide nombre de usuario).
export async function findUserByPin(
  db: Database,
  pin: string,
): Promise<User | null> {
  const pinHash = await sha256Hex(pin);
  const rows = await db.select<UserRow[]>(
    "SELECT * FROM users WHERE pin_hash = $1 AND active = 1 LIMIT 1",
    [pinHash],
  );
  return rows.length > 0 ? toUser(rows[0]) : null;
}

export async function listUsers(db: Database): Promise<User[]> {
  const rows = await db.select<UserRow[]>(
    "SELECT * FROM users ORDER BY name",
  );
  return rows.map(toUser);
}

async function isPinTaken(db: Database, pinHash: string): Promise<boolean> {
  const rows = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM users WHERE pin_hash = $1 AND active = 1",
    [pinHash],
  );
  return (rows[0]?.count ?? 0) > 0;
}

export interface NewUserInput {
  name: string;
  pin: string;
  role: UserRole;
}

// El login busca por pin_hash exacto (ver findUserByPin) sin pedir nombre de
// usuario, así que dos cajeros activos con el mismo PIN harían el login
// ambiguo. Se valida unicidad antes de insertar.
export async function createUser(
  db: Database,
  input: NewUserInput,
): Promise<User> {
  const pinHash = await sha256Hex(input.pin);
  if (await isPinTaken(db, pinHash)) {
    throw new Error("Ese PIN ya está en uso por otro usuario activo");
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const user: User = {
    id,
    name: input.name,
    pin_hash: pinHash,
    role: input.role,
    active: true,
    created_at: now,
    updated_at: now,
  };

  await withTransaction(db, async () => {
    await db.execute(
      `INSERT INTO users (id, name, pin_hash, role, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 1, $5, $5)`,
      [id, user.name, pinHash, user.role, now],
    );
    // No se manda el pin_hash a la nube: solo lo necesario para reportes.
    await writeOutboxEvent(db, "user", id, "insert", {
      id,
      name: user.name,
      role: user.role,
      active: true,
      created_at: now,
      updated_at: now,
    });
  });

  return user;
}

export async function setUserActive(
  db: Database,
  id: string,
  active: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  await withTransaction(db, async () => {
    await db.execute(
      "UPDATE users SET active = $1, updated_at = $2 WHERE id = $3",
      [active ? 1 : 0, now, id],
    );
    await writeOutboxEvent(db, "user", id, "update", { id, active });
  });
}
