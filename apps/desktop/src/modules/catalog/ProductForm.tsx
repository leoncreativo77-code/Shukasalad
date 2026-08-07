import { useState } from "react";
import { TouchButton } from "../../shared/components/TouchButton";

interface ProductFormProps {
  categoryId: string;
  onSubmit: (input: {
    name: string;
    price: number;
    description?: string;
    sku?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [saving, setSaving] = useState(false);

  const priceValue = Number(price);
  const isValid = name.trim().length > 0 && price.trim() !== "" && priceValue >= 0;

  async function handleSubmit() {
    if (!isValid) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        price: priceValue,
        description: description.trim() || undefined,
        sku: sku.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del producto"
          className="col-span-2 rounded-lg border border-neutral-300 px-3 py-2"
          autoFocus
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Precio"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="SKU (opcional)"
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          className="col-span-2 rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <TouchButton
          variant="ghost"
          onClick={onCancel}
          className="min-h-0 px-4 py-2 text-base"
        >
          Cancelar
        </TouchButton>
        <TouchButton
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className="min-h-0 px-4 py-2 text-base"
        >
          Guardar producto
        </TouchButton>
      </div>
    </div>
  );
}
