import { useCallback, useEffect, useState } from "react";
import type { CartLine, Category, Product, TaxRate } from "@pos/shared-types";
import { getDb } from "../../shared/db/client";
import { listCategories } from "../../shared/db/repositories/categories";
import { listProducts } from "../../shared/db/repositories/products";
import { getDefaultTaxRate } from "../../shared/db/repositories/taxRates";
import { calculateOrderTotals, createOrder } from "../../shared/db/repositories/orders";
import { useAuthStore } from "../../shared/auth/store";
import { ProductGrid } from "./ProductGrid";
import { ModifierPicker } from "./ModifierPicker";
import { CartPanel } from "./CartPanel";

export function SalesScreen() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const cashSession = useAuthStore((s) => s.cashSession);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxRate, setTaxRate] = useState<TaxRate | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

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

  function handleRemoveLine(index: number) {
    setCart((lines) => lines.filter((_, i) => i !== index));
  }

  async function handleSaveOrder() {
    if (!currentUser || !cashSession || cart.length === 0) return;
    setSaving(true);
    try {
      const db = await getDb();
      const result = await createOrder(db, {
        cashSessionId: cashSession.id,
        userId: currentUser.id,
        lines: cart,
      });
      setCart([]);
      setConfirmation(`Orden #${result.orderNumber} guardada`);
      setTimeout(() => setConfirmation(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  const totals = taxRate
    ? calculateOrderTotals(cart, taxRate.rate)
    : { subtotal: 0, taxAmount: 0, total: 0 };

  return (
    <div className="flex h-full">
      <ProductGrid
        categories={categories}
        products={products}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onProductClick={setPendingProduct}
      />

      <CartPanel
        lines={cart}
        subtotal={totals.subtotal}
        taxAmount={totals.taxAmount}
        total={totals.total}
        saving={saving}
        onRemoveLine={handleRemoveLine}
        onSave={handleSaveOrder}
      />

      {pendingProduct && (
        <ModifierPicker
          product={pendingProduct}
          onCancel={() => setPendingProduct(null)}
          onConfirm={(line) => {
            setCart((lines) => [...lines, line]);
            setPendingProduct(null);
          }}
        />
      )}

      {confirmation && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-neutral-900 px-6 py-3 font-medium text-white shadow-lg">
          {confirmation}
        </div>
      )}
    </div>
  );
}
