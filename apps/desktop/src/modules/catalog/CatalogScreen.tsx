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
  setProductImage,
} from "../../shared/db/repositories/products";
import { CategoryPanel } from "./CategoryPanel";
import { ProductPanel } from "./ProductPanel";

export function CatalogScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

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
      <ProductPanel
        categoryId={selectedCategoryId}
        categoryName={selectedCategory?.name ?? null}
        products={productsInCategory}
        onCreate={handleCreateProduct}
        onToggleActive={handleToggleProduct}
        onReorder={handleReorderProducts}
        onImageChange={handleProductImageChange}
      />
    </div>
  );
}
