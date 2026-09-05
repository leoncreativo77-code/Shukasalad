import { useState } from "react";
import { getDb } from "../../shared/db/client";
import { createOrder } from "../../shared/db/repositories/orders";
import { useAuthStore } from "../../shared/auth/store";
import { useCatalogCart } from "../../shared/orders/useCatalogCart";
import { buildTicketText, buildWhatsAppLink } from "../../shared/whatsapp/ticket";
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
  const [lastTicket, setLastTicket] = useState<{
    orderNumber: number;
    text: string;
  } | null>(null);
  const [waPhone, setWaPhone] = useState("");

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
      const text = buildTicketText({
        orderNumber: result.orderNumber,
        orderType: "counter",
        lines: cart,
        subtotal: result.totals.subtotal,
        taxAmount: result.totals.taxAmount,
        total: result.totals.total,
      });
      clearCart();
      setWaPhone("");
      setLastTicket({ orderNumber: result.orderNumber, text });
    } finally {
      setSaving(false);
    }
  }

  // Se abre solo en respuesta directa a este clic (no encadenado tras un
  // await) para que Safari/iOS no lo trate como pop-up y lo bloquee.
  function handleSendWhatsApp() {
    if (!lastTicket || !waPhone.trim()) return;
    window.open(buildWhatsAppLink(waPhone, lastTicket.text), "_blank");
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

      {lastTicket && (
        <div className="fixed bottom-6 left-1/2 w-full max-w-sm -translate-x-1/2 rounded-xl bg-neutral-900 p-4 text-white shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">Orden #{lastTicket.orderNumber} guardada</p>
            <button
              onClick={() => setLastTicket(null)}
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              placeholder="WhatsApp del cliente"
              type="tel"
              className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-400"
            />
            <button
              onClick={handleSendWhatsApp}
              disabled={!waPhone.trim()}
              className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
