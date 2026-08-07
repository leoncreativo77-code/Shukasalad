import { useState } from "react";
import type { UserRole } from "@pos/shared-types";
import { TouchButton } from "../../shared/components/TouchButton";
import { NumPad } from "../../shared/components/NumPad";

interface NewUserModalProps {
  onCancel: () => void;
  onSubmit: (input: { name: string; pin: string; role: UserRole }) => Promise<void>;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "cashier", label: "Cajero" },
  { value: "waiter", label: "Mesera(o)" },
  { value: "admin", label: "Administrador" },
];

type Step = "details" | "pin" | "confirmPin";

// Flujo de alta: datos básicos -> capturar PIN -> volver a capturarlo para
// confirmar (evita dar de alta un PIN mal tecleado que el cajero nunca podría
// volver a usar).
export function NewUserModal({ onCancel, onSubmit }: NewUserModalProps) {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("cashier");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handlePinChange(next: string) {
    setError(null);
    setPin(next);
    if (next.length === 4) setStep("confirmPin");
  }

  async function handleConfirmPinChange(next: string) {
    setError(null);
    setPinConfirm(next);
    if (next.length !== 4) return;

    if (next !== pin) {
      setError("El PIN no coincide, intenta de nuevo");
      setPin("");
      setPinConfirm("");
      setStep("pin");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), pin, role });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {step === "details" && (
          <>
            <h2 className="mb-4 text-xl font-bold text-neutral-800">
              Nuevo usuario
            </h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              className="mb-3 w-full rounded-lg border border-neutral-300 px-3 py-2"
              autoFocus
            />
            <div className="mb-4 flex gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRole(opt.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                    role === opt.value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-neutral-300 text-neutral-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <TouchButton variant="ghost" onClick={onCancel}>
                Cancelar
              </TouchButton>
              <TouchButton
                disabled={name.trim().length === 0}
                onClick={() => setStep("pin")}
              >
                Siguiente
              </TouchButton>
            </div>
          </>
        )}

        {(step === "pin" || step === "confirmPin") && (
          <>
            <h2 className="mb-1 text-center text-xl font-bold text-neutral-800">
              {step === "pin" ? "Asigna un PIN" : "Confirma el PIN"}
            </h2>
            <p className="mb-4 text-center text-neutral-500">{name}</p>

            <div className="mb-6 flex justify-center gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 border-blue-600 ${
                    i < (step === "pin" ? pin.length : pinConfirm.length)
                      ? "bg-blue-600"
                      : "bg-white"
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="mb-4 text-center text-sm font-medium text-red-600">
                {error}
              </p>
            )}
            {saving && (
              <p className="mb-4 text-center text-sm text-neutral-400">
                Guardando…
              </p>
            )}

            <NumPad
              value={step === "pin" ? pin : pinConfirm}
              onChange={step === "pin" ? handlePinChange : handleConfirmPinChange}
              maxLength={4}
            />

            <TouchButton variant="ghost" className="mt-4 w-full" onClick={onCancel}>
              Cancelar
            </TouchButton>
          </>
        )}
      </div>
    </div>
  );
}
