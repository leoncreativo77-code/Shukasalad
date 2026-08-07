import { useEffect, useState } from "react";
import type { CartLine, Modifier, Product } from "@pos/shared-types";
import { getDb } from "../../shared/db/client";
import { listModifiersForProduct } from "../../shared/db/repositories/modifiers";
import { TouchButton } from "../../shared/components/TouchButton";

interface ModifierPickerProps {
  product: Product;
  onCancel: () => void;
  onConfirm: (line: CartLine) => void;
}

// Modal que aparece al tocar un producto en el mostrador: cantidad,
// modificadores simples (ej. "sin cebolla") y nota libre. Se muestra siempre
// -- incluso para productos sin modificadores -- para mantener un solo flujo
// consistente y no obligar al cajero a recordar cuáles productos los tienen.
export function ModifierPicker({
  product,
  onCancel,
  onConfirm,
}: ModifierPickerProps) {
  const [availableModifiers, setAvailableModifiers] = useState<Modifier[]>([]);
  const [selectedModifierIds, setSelectedModifierIds] = useState<Set<string>>(
    new Set(),
  );
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await getDb();
      const modifiers = await listModifiersForProduct(db, product.id);
      if (!cancelled) setAvailableModifiers(modifiers);
    })();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  function toggleModifier(id: string) {
    setSelectedModifierIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const modifiers = availableModifiers
      .filter((m) => selectedModifierIds.has(m.id))
      .map((m) => ({
        modifier_id: m.id,
        name: m.name,
        price_delta: m.price_delta,
      }));

    onConfirm({
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      quantity,
      notes: notes.trim(),
      modifiers,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-neutral-800">{product.name}</h2>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-medium text-neutral-600">Cantidad</span>
          <div className="flex items-center gap-3">
            <TouchButton
              variant="secondary"
              className="min-h-0 h-10 w-10 p-0 text-xl"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </TouchButton>
            <span className="w-8 text-center text-lg font-semibold">
              {quantity}
            </span>
            <TouchButton
              variant="secondary"
              className="min-h-0 h-10 w-10 p-0 text-xl"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </TouchButton>
          </div>
        </div>

        {availableModifiers.length > 0 && (
          <div className="mt-4">
            <span className="font-medium text-neutral-600">
              Modificadores
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableModifiers.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => toggleModifier(mod.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    selectedModifierIds.has(mod.id)
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-neutral-300 text-neutral-600"
                  }`}
                >
                  {mod.name}
                  {mod.price_delta > 0 ? ` (+${mod.price_delta})` : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <span className="font-medium text-neutral-600">Nota</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. sin hielo, para llevar…"
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2"
            rows={2}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <TouchButton variant="ghost" onClick={onCancel}>
            Cancelar
          </TouchButton>
          <TouchButton onClick={handleConfirm}>Agregar</TouchButton>
        </div>
      </div>
    </div>
  );
}
