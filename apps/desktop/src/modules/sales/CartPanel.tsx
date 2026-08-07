import type { CartLine } from "@pos/shared-types";
import { TouchButton } from "../../shared/components/TouchButton";
import { lineTotal } from "../../shared/db/repositories/orders";

interface CartPanelProps {
  lines: CartLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  saving: boolean;
  onRemoveLine: (index: number) => void;
  onSave: () => void;
}

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function CartPanel({
  lines,
  subtotal,
  taxAmount,
  total,
  saving,
  onRemoveLine,
  onSave,
}: CartPanelProps) {
  return (
    <div className="flex h-full w-96 flex-col border-l border-neutral-200 bg-white">
      <h2 className="border-b border-neutral-200 px-4 py-3 font-semibold text-neutral-700">
        Orden actual
      </h2>

      <div className="flex-1 overflow-y-auto">
        {lines.length === 0 && (
          <p className="p-4 text-neutral-400">
            Toca un producto para agregarlo.
          </p>
        )}
        <ul>
          {lines.map((line, index) => (
            <li
              key={index}
              className="flex items-start justify-between gap-2 border-b border-neutral-100 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-neutral-800">
                  {line.quantity} × {line.product_name}
                </p>
                {line.modifiers.length > 0 && (
                  <p className="text-sm text-neutral-500">
                    {line.modifiers.map((m) => m.name).join(", ")}
                  </p>
                )}
                {line.notes && (
                  <p className="text-sm italic text-neutral-400">
                    “{line.notes}”
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-semibold text-neutral-700">
                  {currency.format(lineTotal(line))}
                </span>
                <button
                  onClick={() => onRemoveLine(index)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-neutral-200 p-4">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal</span>
          <span>{currency.format(subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>IVA</span>
          <span>{currency.format(taxAmount)}</span>
        </div>
        <div className="mt-1 flex justify-between text-xl font-bold text-neutral-900">
          <span>Total</span>
          <span>{currency.format(total)}</span>
        </div>

        <TouchButton
          className="mt-4 w-full"
          disabled={lines.length === 0 || saving}
          onClick={onSave}
        >
          {saving ? "Guardando…" : "Guardar orden"}
        </TouchButton>
      </div>
    </div>
  );
}
