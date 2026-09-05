import { useState } from "react";
import { getDb } from "../../shared/db/client";
import { createOrder } from "../../shared/db/repositories/orders";
import { useAuthStore } from "../../shared/auth/store";
import { useCatalogCart } from "../../shared/orders/useCatalogCart";
import {
  buildTicketText,
  buildWhatsAppLink,
  type TicketOrderInfo,
} from "../../shared/whatsapp/ticket";
import { buildComandaText } from "../../shared/print/comanda";
import { usePrint } from "../../shared/print/usePrint";
import { ProductGrid } from "../sales/ProductGrid";
import { ModifierPicker } from "../sales/ModifierPicker";
import { CartPanel } from "../sales/CartPanel";
import { OrderDetailsForm, type IntakeDetails, type IntakeOrderType } from "./OrderDetailsForm";

const EMPTY_DETAILS: IntakeDetails = {
  tableNumber: "",
  customerName: "",
  customerPhone: "",
  deliveryAddress: "",
  scheduledFor: "",
};

function validate(orderType: IntakeOrderType, details: IntakeDetails): string | null {
  if (orderType === "dine_in" && !details.tableNumber.trim()) {
    return "Falta el número de mesa";
  }
  if (orderType === "pickup" || orderType === "delivery") {
    if (!details.customerName.trim()) return "Falta el nombre del cliente";
    if (!details.customerPhone.trim()) return "Falta el teléfono del cliente";
  }
  if (orderType === "delivery" && !details.deliveryAddress.trim()) {
    return "Falta la dirección de entrega";
  }
  return null;
}

// Captura de pedidos que no son de mostrador: mesa (mesero), recoger y
// domicilio. Reutiliza el mismo carrito/catálogo que Venta -- solo cambia el
// formulario de datos extra y a qué order_type/columnas se guarda la orden.
// El tablero de Cocina es quien los recibe después.
export function IntakeScreen() {
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

  const [orderType, setOrderType] = useState<IntakeOrderType>("dine_in");
  const [details, setDetails] = useState<IntakeDetails>(EMPTY_DETAILS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<TicketOrderInfo | null>(null);
  const [waPhone, setWaPhone] = useState("");
  const { print, printArea } = usePrint();

  async function handleSaveOrder() {
    if (!currentUser || !cashSession || cart.length === 0) return;

    const validationError = validate(orderType, details);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const db = await getDb();
      const result = await createOrder(db, {
        cashSessionId: cashSession.id,
        userId: currentUser.id,
        orderType,
        lines: cart,
        tableNumber: orderType === "dine_in" ? details.tableNumber.trim() : undefined,
        customerName:
          orderType !== "dine_in" ? details.customerName.trim() : undefined,
        customerPhone:
          orderType !== "dine_in" ? details.customerPhone.trim() : undefined,
        deliveryAddress:
          orderType === "delivery" ? details.deliveryAddress.trim() : undefined,
        scheduledFor: details.scheduledFor
          ? new Date(details.scheduledFor).toISOString()
          : undefined,
      });
      // Recoger/domicilio ya piden el teléfono del cliente como parte del
      // pedido -- se reusa aquí para no volver a teclearlo.
      setWaPhone(orderType !== "dine_in" ? details.customerPhone.trim() : "");
      clearCart();
      setLastOrder({
        orderNumber: result.orderNumber,
        orderType,
        lines: cart,
        subtotal: result.totals.subtotal,
        taxAmount: result.totals.taxAmount,
        total: result.totals.total,
        tableNumber: orderType === "dine_in" ? details.tableNumber.trim() : null,
        customerName: orderType !== "dine_in" ? details.customerName.trim() : null,
      });
      setDetails(EMPTY_DETAILS);
    } finally {
      setSaving(false);
    }
  }

  // Se abre solo en respuesta directa a este clic (no encadenado tras un
  // await) para que Safari/iOS no lo trate como pop-up y lo bloquee.
  function handleSendWhatsApp() {
    if (!lastOrder || !waPhone.trim()) return;
    window.open(buildWhatsAppLink(waPhone, buildTicketText(lastOrder)), "_blank");
  }

  return (
    <div className="flex h-full flex-col">
      <OrderDetailsForm
        orderType={orderType}
        onOrderTypeChange={(type) => {
          setOrderType(type);
          setDetails(EMPTY_DETAILS);
          setError(null);
        }}
        details={details}
        onDetailsChange={setDetails}
      />

      <div className="flex flex-1 overflow-hidden">
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
      </div>

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

      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-red-600 px-6 py-3 font-medium text-white shadow-lg">
          {error}
        </div>
      )}
      {lastOrder && (
        <div className="fixed bottom-6 left-1/2 w-full max-w-sm -translate-x-1/2 rounded-xl bg-neutral-900 p-4 text-white shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">
              Pedido #{lastOrder.orderNumber} enviado a cocina
            </p>
            <button
              onClick={() => setLastOrder(null)}
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="mb-2 flex gap-2">
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
          <div className="flex gap-2">
            <button
              onClick={() => print(buildTicketText(lastOrder))}
              className="flex-1 rounded-lg border border-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-800"
            >
              🖨️ Imprimir ticket
            </button>
            <button
              onClick={() => print(buildComandaText(lastOrder))}
              className="flex-1 rounded-lg border border-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-800"
            >
              🖨️ Imprimir comanda
            </button>
          </div>
        </div>
      )}

      {printArea}
    </div>
  );
}
