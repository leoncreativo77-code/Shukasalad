import { useState } from "react";
import type { Product } from "@pos/shared-types";
import { TouchButton } from "../../shared/components/TouchButton";
import { pickImage } from "../../shared/browser/pickImage";
import { useImageUrl } from "../../shared/browser/useImageUrl";
import { ProductForm } from "./ProductForm";

interface ProductPanelProps {
  categoryId: string | null;
  categoryName: string | null;
  products: Product[];
  onCreate: (input: {
    name: string;
    price: number;
    description?: string;
    sku?: string;
  }) => Promise<void>;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onImageChange: (id: string, imagePath: string) => Promise<void>;
}

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function ProductThumb({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  const imageUrl = useImageUrl(product.image_path);
  return (
    <button
      onClick={onClick}
      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[10px] text-neutral-400">Foto</span>
      )}
    </button>
  );
}

export function ProductPanel({
  categoryId,
  categoryName,
  products,
  onCreate,
  onToggleActive,
  onReorder,
  onImageChange,
}: ProductPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  if (!categoryId) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-neutral-400">
        Selecciona una categoría
      </div>
    );
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = products.map((p) => p.id);
    const fromIndex = ids.indexOf(dragId);
    const toIndex = ids.indexOf(targetId);
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, dragId);
    setDragId(null);
    onReorder(ids);
  }

  async function handleUploadImage(productId: string) {
    const imageId = await pickImage("product-images");
    if (!imageId) return;
    await onImageChange(productId, imageId);
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800">
          {categoryName}
        </h2>
        <TouchButton
          onClick={() => setShowForm((v) => !v)}
          className="min-h-0 px-4 py-2 text-base"
          variant={showForm ? "secondary" : "primary"}
        >
          {showForm ? "Cancelar" : "+ Nuevo producto"}
        </TouchButton>
      </div>

      {showForm && (
        <div className="mb-4">
          <ProductForm
            categoryId={categoryId}
            onCancel={() => setShowForm(false)}
            onSubmit={async (input) => {
              await onCreate(input);
              setShowForm(false);
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            draggable
            onDragStart={() => setDragId(product.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(product.id)}
            className={`cursor-move rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ${
              product.active ? "" : "opacity-40"
            } ${dragId === product.id ? "opacity-50" : ""}`}
          >
            <div className="mb-2 flex gap-3">
              <ProductThumb
                product={product}
                onClick={() => handleUploadImage(product.id)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-neutral-800">
                    {product.name}
                  </h3>
                  <span className="shrink-0 font-semibold text-blue-600">
                    {currency.format(product.price)}
                  </span>
                </div>
                {product.description && (
                  <p className="mt-1 text-sm text-neutral-500">
                    {product.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onToggleActive(product.id, !product.active)}
              className="text-sm font-medium text-neutral-400 hover:text-neutral-600"
            >
              {product.active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
        {products.length === 0 && !showForm && (
          <p className="text-neutral-400">
            No hay productos en esta categoría todavía.
          </p>
        )}
      </div>
    </div>
  );
}
