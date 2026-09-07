import { useState } from "react";
import { getDb } from "../../shared/db/client";
import { createOrder } from "../../shared/db/repositories/orders";
import { useAuthStore } from "../../shared/auth/store";
import { useCatalogCart } from "../../shared/orders/useCatalogCart";
import { ProductGrid } from "./ProductGrid";
import { ModifierPicker } from "./ModifierPicker";
import { CartPanel } from "./CartPanel";

export function SalesScreen() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const cashSession = useAuthStore((s) => s.cashSession);
  const {
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
  } = useCatalogCart();

  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  async function handleSaveOrder() {
    if (!currentUser || !cashSession || cart.length === 0) return;
    setSaving(true);
    try {
      const db = await getDb();
      const result = await createOrder(db, {
        cashSessionId: cashSession.id,
        userId: currentUser.id,
        orderType: "counter",
        lines: cart,
      });
      clearCart();
      setConfirmation(`Orden #${result.orderNumber} guardada`);
      setTimeout(() => setConfirmation(null), 3000);
    } finally {
      setSaving(false);
    }
  }

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
        onRemoveLine={removeLine}
        onSave={handleSaveOrder}
      />

      {pendingProduct && (
        <ModifierPicker
          product={pendingProduct}
          onCancel={() => setPendingProduct(null)}
          onConfirm={(line) => {
            addLine(line);
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
