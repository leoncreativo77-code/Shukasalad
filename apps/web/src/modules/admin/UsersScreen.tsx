import { useCallback, useEffect, useState } from "react";
import type { User, UserRole } from "@pos/shared-types";
import { getDb } from "../../shared/db/client";
import {
  createUser,
  listUsers,
  setUserActive,
} from "../../shared/db/repositories/users";
import { TouchButton } from "../../shared/components/TouchButton";
import { NewUserModal } from "./NewUserModal";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  cashier: "Cajero",
  waiter: "Mesera(o)",
};

export function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const db = await getDb();
    setUsers(await listUsers(db));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleToggleActive(id: string, active: boolean) {
    const db = await getDb();
    await setUserActive(db, id, active);
    await reload();
  }

  async function handleCreate(input: {
    name: string;
    pin: string;
    role: UserRole;
  }) {
    setError(null);
    try {
      const db = await getDb();
      await createUser(db, input);
      setShowForm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario");
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800">Usuarios</h2>
        <TouchButton
          className="min-h-0 px-4 py-2 text-base"
          onClick={() => setShowForm(true)}
        >
          + Nuevo usuario
        </TouchButton>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 text-sm text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium text-neutral-800">
                  {user.name}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {ROLE_LABELS[user.role]}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      user.active
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {user.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleToggleActive(user.id, !user.active)}
                    className="text-sm font-medium text-neutral-400 hover:text-neutral-600"
                  >
                    {user.active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <NewUserModal
          onCancel={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
