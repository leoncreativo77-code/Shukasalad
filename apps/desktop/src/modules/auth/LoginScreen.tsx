import { useState } from "react";
import { getDb } from "../../shared/db/client";
import { findUserByPin } from "../../shared/db/repositories/users";
import { getOpenCashSession } from "../../shared/db/repositories/cashSessions";
import { useAuthStore } from "../../shared/auth/store";
import { NumPad } from "../../shared/components/NumPad";

export function LoginScreen() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  async function handlePinChange(next: string) {
    setPin(next);
    setError(null);
    if (next.length < 4) return;

    setLoading(true);
    try {
      const db = await getDb();
      const user = await findUserByPin(db, next);
      if (!user) {
        setError("PIN incorrecto");
        setPin("");
        return;
      }
      const cashSession = await getOpenCashSession(db);
      if (!cashSession) {
        setError("No hay una caja abierta. Contacta a un administrador.");
        setPin("");
        return;
      }
      login(user, cashSession);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-neutral-100">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-1 text-center text-2xl font-bold text-neutral-800">
          POS Restaurante
        </h1>
        <p className="mb-6 text-center text-neutral-500">
          Ingresa tu PIN de cajero
        </p>

        <div className="mb-6 flex justify-center gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full border-2 border-blue-600 ${
                i < pin.length ? "bg-blue-600" : "bg-white"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-center text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        {loading && (
          <p className="mb-4 text-center text-sm text-neutral-400">
            Verificando…
          </p>
        )}

        <NumPad value={pin} onChange={handlePinChange} maxLength={4} />
      </div>
    </div>
  );
}
