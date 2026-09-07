import { useEffect, useState, useCallback } from "react";
import type { Category, Product } from "@pos/shared-types";
import { getDb } from "../../shared/db/client";
import {
  createCategory,
  listCategories,
  reorderCategories,
  setCategoryActive,
} from "../../shared/db/repositories/categories";
import {
  createProduct,
  listProducts,
  reorderProducts,
  setProductActive,
  setProductGridPosition,
  setProductImage,
} from "../../shared/db/repositories/products";
import { CategoryPanel } from "./CategoryPanel";
import { ProductPanel } from "./ProductPanel";
import { ButtonLayoutEditor } from "../admin/ButtonLayoutEditor";

type ViewMode = "list" | "design";

export function CatalogScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [mode, setMode] = useState<ViewMode>("list");

  const reload = useCallback(async () => {
    const db = await getDb();
    const [cats, prods] = await Promise.all([
      listCategories(db),
      listProducts(db),
    ]);
    setCategories(cats);
    setProducts(prods);
    setSelectedCategoryId((current) => current ?? cats[0]?.id ?? null);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const selectedCategory =
    categories.find((c) => c.id === selectedCategoryId) ?? null;
  const productsInCategory = products.filter(
    (p) => p.category_id === selectedCategoryId,
  );

  async function handleCreateCategory(name: string) {
    const db = await getDb();
    await createCategory(db, { name });
    await reload();
  }

  async function handleToggleCategory(id: string, active: boolean) {
    const db = await getDb();
    await setCategoryActive(db, id, active);
    await reload();
  }

  async function handleReorderCategories(orderedIds: string[]) {
    const db = await getDb();
    await reorderCategories(db, orderedIds);
    await reload();
  }

  async function handleCreateProduct(input: {
    name: string;
    price: number;
    description?: string;
    sku?: string;
  }) {
    if (!selectedCategoryId) return;
    const db = await getDb();
    await createProduct(db, { categoryId: selectedCategoryId, ...input });
    await reload();
  }

  async function handleToggleProduct(id: string, active: boolean) {
    const db = await getDb();
    await setProductActive(db, id, active);
    await reload();
  }

  async function handleReorderProducts(orderedIds: string[]) {
    const db = await getDb();
    await reorderProducts(db, orderedIds);
    await reload();
  }

  async function handleProductImageChange(id: string, imagePath: string) {
    const db = await getDb();
    await setProductImage(db, id, imagePath);
    await reload();
  }

  async function handleGridPositionChange(
    id: string,
    col: number | null,
    row: number | null,
  ) {
    const db = await getDb();
    await setProductGridPosition(db, id, col, row);
    await reload();
  }

  return (
    <div className="flex h-full">
      <CategoryPanel
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        onCreate={handleCreateCategory}
        onToggleActive={handleToggleCategory}
        onReorder={handleReorderCategories}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex gap-2 border-b border-neutral-200 bg-white px-4 py-2">
          <button
            onClick={() => setMode("list")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              mode === "list"
                ? "bg-neutral-800 text-white"
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setMode("design")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              mode === "design"
                ? "bg-neutral-800 text-white"
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            Diseño
          </button>
        </div>

        {mode === "list" ? (
          <ProductPanel
            categoryId={selectedCategoryId}
            categoryName={selectedCategory?.name ?? null}
            products={productsInCategory}
            onCreate={handleCreateProduct}
            onToggleActive={handleToggleProduct}
            onReorder={handleReorderProducts}
            onImageChange={handleProductImageChange}
          />
        ) : selectedCategoryId ? (
          <ButtonLayoutEditor
            products={productsInCategory}
            onPositionChange={handleGridPositionChange}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-neutral-400">
            Selecciona una categoría
          </div>
        )}
      </div>
    </div>
  );
}
