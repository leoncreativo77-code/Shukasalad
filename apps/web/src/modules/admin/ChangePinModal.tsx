import { useState } from "react";
import { TouchButton } from "../../shared/components/TouchButton";
import { NumPad } from "../../shared/components/NumPad";

interface ChangePinModalProps {
  userName: string;
  onCancel: () => void;
  onSubmit: (pin: string) => Promise<void>;
}

type Step = "pin" | "confirmPin";

// Mismo flujo de captura + confirmación que NewUserModal, pero solo para el
// PIN -- se abre desde un usuario que ya existe (ver UsersScreen).
export function ChangePinModal({ userName, onCancel, onSubmit }: ChangePinModalProps) {
  const [step, setStep] = useState<Step>("pin");
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
      await onSubmit(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el PIN");
      setPin("");
      setPinConfirm("");
      setStep("pin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-center text-xl font-bold text-neutral-800">
          {step === "pin" ? "Nuevo PIN" : "Confirma el PIN"}
        </h2>
        <p className="mb-4 text-center text-neutral-500">{userName}</p>

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
          <p className="mb-4 text-center text-sm text-neutral-400">Guardando…</p>
        )}

        <NumPad
          value={step === "pin" ? pin : pinConfirm}
          onChange={step === "pin" ? handlePinChange : handleConfirmPinChange}
          maxLength={4}
        />

        <TouchButton variant="ghost" className="mt-4 w-full" onClick={onCancel}>
          Cancelar
        </TouchButton>
      </div>
    </div>
  );
}
