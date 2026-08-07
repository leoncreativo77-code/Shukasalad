import { useCallback, useEffect, useState } from "react";
import type { CartLine, Category, Product, TaxRate } from "@pos/shared-types";
import { getDb } from "../db/client";
import { listCategories } from "../db/repositories/categories";
import { listProducts } from "../db/repositories/products";
import { getDefaultTaxRate } from "../db/repositories/taxRates";
import { calculateOrderTotals } from "../db/repositories/orders";

// Catálogo + carrito en construcción, compartido entre la pantalla de
// mostrador (Venta) y la de captura de pedidos (mesa/recoger/domicilio) --
// ambas arman una orden de la misma forma, solo cambia qué pasa al guardar.
export function useCatalogCart() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxRate, setTaxRate] = useState<TaxRate | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);

  const loadCatalog = useCallback(async () => {
    const db = await getDb();
    const [cats, prods, rate] = await Promise.all([
      listCategories(db, { activeOnly: true }),
      listProducts(db, { activeOnly: true }),
      getDefaultTaxRate(db),
    ]);
    setCategories(cats);
    setProducts(prods);
    setTaxRate(rate);
    setSelectedCategoryId((current) => current ?? cats[0]?.id ?? null);
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  function addLine(line: CartLine) {
    setCart((lines) => [...lines, line]);
  }

  function removeLine(index: number) {
    setCart((lines) => lines.filter((_, i) => i !== index));
  }

  function clearCart() {
    setCart([]);
  }

  const totals = taxRate
    ? calculateOrderTotals(cart, taxRate.rate)
    : { subtotal: 0, taxAmount: 0, total: 0 };

  return {
    categories,
    products,
    selectedCategoryId,
    setSelectedCategoryId,
    pendingProduct,
    setPendingProduct,
    cart,
    addLine,
    removeLine,
    clearCart,
    totals,
  };
}
