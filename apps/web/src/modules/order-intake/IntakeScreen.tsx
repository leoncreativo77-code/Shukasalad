import { useState } from "react";
import { getDb } from "../../shared/db/client";
import { createOrder } from "../../shared/db/repositories/orders";
import { useAuthStore } from "../../shared/auth/store";
import { useCatalogCart } from "../../shared/orders/useCatalogCart";
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
  const [confirmation, setConfirmation] = useState<string | null>(null);

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
      clearCart();
      setDetails(EMPTY_DETAILS);
      setConfirmation(`Pedido #${result.orderNumber} enviado a cocina`);
      setTimeout(() => setConfirmation(null), 3000);
    } finally {
      setSaving(false);
    }
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
      {confirmation && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-neutral-900 px-6 py-3 font-medium text-white shadow-lg">
          {confirmation}
        </div>
      )}
    </div>
  );
}
