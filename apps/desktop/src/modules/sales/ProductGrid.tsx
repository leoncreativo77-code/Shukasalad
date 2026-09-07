import type { CSSProperties } from "react";
import type { Category, Product } from "@pos/shared-types";
import { convertFileSrc } from "@tauri-apps/api/core";
import { SALES_GRID_COLUMNS } from "../../shared/constants/layout";

interface ProductGridProps {
  categories: Category[];
  products: Product[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onProductClick: (product: Product) => void;
}

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function ProductButton({
  product,
  onClick,
  style,
}: {
  product: Product;
  onClick: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={style}
      className="flex min-h-24 flex-col items-start justify-between overflow-hidden rounded-xl bg-white p-4 text-left shadow-sm active:bg-blue-50"
    >
      {product.image_path && (
        <img
          src={convertFileSrc(product.image_path)}
          alt=""
          className="mb-2 h-16 w-full rounded-lg object-cover"
        />
      )}
      <span className="font-semibold text-neutral-800">{product.name}</span>
      <span className="mt-2 font-semibold text-[var(--brand-primary)]">
        {currency.format(product.price)}
      </span>
    </button>
  );
}

export function ProductGrid({
  categories,
  products,
  selectedCategoryId,
  onSelectCategory,
  onProductClick,
}: ProductGridProps) {
  const visibleProducts = products.filter(
    (p) => p.category_id === selectedCategoryId,
  );

  // Si algún producto de la categoría tiene posición asignada (ver Admin >
  // Catálogo > Diseño), se usa la cuadrícula fija de SALES_GRID_COLUMNS
  // columnas para que coincida exactamente con lo que armó el admin. Los
  // productos sin posición se auto-colocan en las celdas libres (CSS Grid
  // nunca superpone un auto-colocado sobre uno con posición explícita).
  // Si nadie ha tocado el diseño de la categoría, se usa el flujo
  // responsive de siempre.
  const hasCustomLayout = visibleProducts.some(
    (p) => p.grid_col !== null && p.grid_row !== null,
  );

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex gap-2 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`shrink-0 rounded-xl px-5 py-3 text-lg font-semibold ${
              selectedCategoryId === cat.id
                ? "bg-[var(--brand-primary)] text-white"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div
          className={
            hasCustomLayout
              ? "grid gap-3"
              : "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
          }
          style={
            hasCustomLayout
              ? { gridTemplateColumns: `repeat(${SALES_GRID_COLUMNS}, minmax(0, 1fr))` }
              : undefined
          }
        >
          {visibleProducts.map((product) => (
            <ProductButton
              key={product.id}
              product={product}
              onClick={() => onProductClick(product)}
              style={
                hasCustomLayout && product.grid_col !== null && product.grid_row !== null
                  ? {
                      gridColumn: product.grid_col + 1,
                      gridRow: product.grid_row + 1,
                    }
                  : undefined
              }
            />
          ))}
          {visibleProducts.length === 0 && (
            <p className="col-span-full text-neutral-400">
              Sin productos disponibles en esta categoría.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
