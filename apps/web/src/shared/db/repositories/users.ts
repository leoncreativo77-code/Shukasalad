import { v4 as uuidv4 } from "uuid";
import type { User, UserRole } from "@pos/shared-types";
import type { PosDatabase } from "../client";
import { sha256Hex } from "../../auth/pinHash";
import { writeOutboxEvent } from "../outbox";

// Autentica por PIN: se hashea el PIN capturado y se busca un cajero activo
// con ese hash. No hay "usuario" explícito que escribir, así el numpad de
// login puede ser ciego (no pide nombre de usuario).
export async function findUserByPin(
  db: PosDatabase,
  pin: string,
): Promise<User | null> {
  const pinHash = await sha256Hex(pin);
  const rows = await db.users.toArray();
  return rows.find((u) => u.pin_hash === pinHash && u.active) ?? null;
}

export async function listUsers(db: PosDatabase): Promise<User[]> {
  const rows = await db.users.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

async function isPinTaken(db: PosDatabase, pinHash: string): Promise<boolean> {
  const rows = await db.users.toArray();
  return rows.some((u) => u.pin_hash === pinHash && u.active);
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
  db: PosDatabase,
  input: NewUserInput,
): Promise<User> {
  const pinHash = await sha256Hex(input.pin);
  if (await isPinTaken(db, pinHash)) {
    throw new Error("Ese PIN ya está en uso por otro usuario activo");
  }

  const now = new Date().toISOString();
  const user: User = {
    id: uuidv4(),
    name: input.name,
    pin_hash: pinHash,
    role: input.role,
    active: true,
    created_at: now,
    updated_at: now,
  };

  await db.users.add(user);
  // No se manda el pin_hash a la nube: solo lo necesario para reportes.
  await writeOutboxEvent(db, "user", user.id, "insert", {
    id: user.id,
    name: user.name,
    role: user.role,
    active: true,
    created_at: now,
    updated_at: now,
  });

  return user;
}

export async function setUserActive(
  db: PosDatabase,
  id: string,
  active: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  await db.users.update(id, { active, updated_at: now });
  await writeOutboxEvent(db, "user", id, "update", { id, active });
}
