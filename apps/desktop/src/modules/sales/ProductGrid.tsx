import type { Category, Product } from "@pos/shared-types";

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

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex gap-2 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`shrink-0 rounded-xl px-5 py-3 text-lg font-semibold ${
              selectedCategoryId === cat.id
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => onProductClick(product)}
              className="flex min-h-24 flex-col items-start justify-between rounded-xl bg-white p-4 text-left shadow-sm active:bg-blue-50"
            >
              <span className="font-semibold text-neutral-800">
                {product.name}
              </span>
              <span className="mt-2 font-semibold text-blue-600">
                {currency.format(product.price)}
              </span>
            </button>
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
