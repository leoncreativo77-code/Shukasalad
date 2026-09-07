import type { KitchenOrder } from "../../shared/db/repositories/kitchenOrders";
import { TouchButton } from "../../shared/components/TouchButton";

interface KitchenOrderCardProps {
  order: KitchenOrder;
  onAdvance: () => void;
  onGoBack: () => void;
}

function orderLabel(order: KitchenOrder): string {
  switch (order.orderType) {
    case "counter":
      return "Mostrador";
    case "dine_in":
      return `Mesa ${order.tableNumber ?? "—"}`;
    case "pickup":
      return `Recoger — ${order.customerName ?? ""}`;
    case "delivery":
      return `Domicilio — ${order.customerName ?? ""}`;
  }
}

const ADVANCE_LABEL: Record<KitchenOrder["kitchenStatus"], string> = {
  new: "Empezar a preparar",
  preparing: "Marcar listo",
  ready: "",
};

export function KitchenOrderCard({ order, onAdvance, onGoBack }: KitchenOrderCardProps) {
  const time = new Date(order.createdAt).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const scheduled = order.scheduledFor
    ? new Date(order.scheduledFor).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="font-bold text-neutral-800">
            #{order.orderNumber} · {orderLabel(order)}
          </p>
          <p className="text-xs text-neutral-400">
            {time}
            {order.customerPhone ? ` · ${order.customerPhone}` : ""}
          </p>
          {order.deliveryAddress && (
            <p className="text-xs text-neutral-400">{order.deliveryAddress}</p>
          )}
          {scheduled && (
            <p className="text-xs font-medium text-amber-600">
              Programado: {scheduled}
            </p>
          )}
        </div>
      </div>

      <ul className="mb-3 space-y-1">
        {order.items.map((item) => (
          <li key={item.id} className="text-sm text-neutral-700">
            <span className="font-semibold">{item.quantity}×</span>{" "}
            {item.productName}
            {item.modifierNames.length > 0 && (
              <span className="text-neutral-500">
                {" "}
                ({item.modifierNames.join(", ")})
              </span>
            )}
            {item.notes && (
              <span className="block pl-4 text-xs italic text-neutral-400">
                “{item.notes}”
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        {order.kitchenStatus !== "new" && (
          <TouchButton
            variant="ghost"
            className="min-h-0 px-3 py-2 text-sm"
            onClick={onGoBack}
          >
            ← Regresar
          </TouchButton>
        )}
        {order.kitchenStatus !== "ready" && (
          <TouchButton className="min-h-0 flex-1 px-3 py-2 text-sm" onClick={onAdvance}>
            {ADVANCE_LABEL[order.kitchenStatus]}
          </TouchButton>
        )}
      </div>
    </div>
  );
}
