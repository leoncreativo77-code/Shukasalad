import { useState } from "react";
import type { Product } from "@pos/shared-types";
import { SALES_GRID_COLUMNS } from "../../shared/constants/layout";
import { useImageUrl } from "../../shared/browser/useImageUrl";

interface ButtonLayoutEditorProps {
  products: Product[];
  onPositionChange: (
    productId: string,
    col: number | null,
    row: number | null,
  ) => Promise<void>;
}

function UnpositionedChip({
  product,
  dragging,
  onDragStart,
}: {
  product: Product;
  dragging: boolean;
  onDragStart: () => void;
}) {
  const imageUrl = useImageUrl(product.image_path);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`flex cursor-move items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm ${
        dragging ? "opacity-40" : ""
      }`}
    >
      {imageUrl && (
        <img src={imageUrl} alt="" className="h-6 w-6 rounded object-cover" />
      )}
      <span className="text-sm font-medium text-neutral-700">{product.name}</span>
    </div>
  );
}

// Editor de "diseño libre" por categoría: arrastrar un producto a una celda
// de la cuadrícula asigna grid_col/grid_row (snap a cuadrícula, no posición
// libre en píxeles -- ver plan). Soltar sobre una celda ocupada intercambia
// posiciones. Los productos sin posición viven en la "bandeja" de arriba.
export function ButtonLayoutEditor({
  products,
  onPositionChange,
}: ButtonLayoutEditorProps) {
  const [dragId, setDragId] = useState<string | null>(null);

  const positioned = products.filter((p) => p.grid_col !== null && p.grid_row !== null);
  const unpositioned = products.filter((p) => p.grid_col === null || p.grid_row === null);

  const maxUsedRow = positioned.reduce(
    (max, p) => Math.max(max, p.grid_row ?? 0),
    -1,
  );
  const rowCount = Math.max(3, maxUsedRow + 3);

  function productAt(col: number, row: number): Product | undefined {
    return positioned.find((p) => p.grid_col === col && p.grid_row === row);
  }

  async function handleDrop(col: number, row: number) {
    const draggedId = dragId;
    setDragId(null);
    if (!draggedId) return;

    const dragged = products.find((p) => p.id === draggedId);
    if (!dragged) return;
    if (dragged.grid_col === col && dragged.grid_row === row) return;

    const occupant = productAt(col, row);
    if (occupant && occupant.id !== dragged.id) {
      await onPositionChange(occupant.id, dragged.grid_col, dragged.grid_row);
    }
    await onPositionChange(dragged.id, col, row);
  }

  async function handleRemoveFromLayout(productId: string) {
    await onPositionChange(productId, null, null);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-4">
        <h3 className="mb-1 font-medium text-neutral-700">
          Sin posición asignada
        </h3>
        <p className="mb-2 text-sm text-neutral-400">
          Arrastra un producto a una celda de la cuadrícula de abajo.
        </p>
        <div className="flex min-h-16 flex-wrap gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-2">
          {unpositioned.map((p) => (
            <UnpositionedChip
              key={p.id}
              product={p}
              dragging={dragId === p.id}
              onDragStart={() => setDragId(p.id)}
            />
          ))}
          {unpositioned.length === 0 && (
            <span className="p-2 text-sm text-neutral-400">
              Todos los productos ya tienen posición.
            </span>
          )}
        </div>
      </div>

      <h3 className="mb-2 font-medium text-neutral-700">Cuadrícula</h3>
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${SALES_GRID_COLUMNS}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: rowCount }).flatMap((_, row) =>
          Array.from({ length: SALES_GRID_COLUMNS }).map((_, col) => {
            const product = productAt(col, row);
            return (
              <div
                key={`${col}-${row}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col, row)}
                className="flex h-20 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white p-1"
              >
                {product ? (
                  <div
                    draggable
                    onDragStart={() => setDragId(product.id)}
                    className={`flex h-full w-full cursor-move flex-col items-center justify-center gap-1 rounded-md bg-blue-50 p-1 text-center ${
                      dragId === product.id ? "opacity-40" : ""
                    }`}
                  >
                    <span className="line-clamp-2 text-xs font-medium text-neutral-700">
                      {product.name}
                    </span>
                    <button
                      onClick={() => handleRemoveFromLayout(product.id)}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-neutral-300">+</span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
