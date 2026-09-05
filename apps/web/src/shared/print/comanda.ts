import type { TicketOrderInfo } from "../whatsapp/ticket";
import type { KitchenOrder } from "../db/repositories/kitchenOrders";

const ORDER_TYPE_LABEL: Record<TicketOrderInfo["orderType"], string> = {
  counter: "Mostrador",
  dine_in: "Mesa",
  pickup: "Recoger",
  delivery: "Domicilio",
};

// Ticket para cocina: sin precios, letra grande (ver PrintArea), solo lo
// que se tiene que preparar. Complementa (no reemplaza) el tablero digital
// de Cocina -- esto es la copia en papel que se queda pegada junto a la
// plancha.
export function buildComandaText(order: TicketOrderInfo): string {
  const parts: string[] = [];
  parts.push("*** COMANDA ***");
  parts.push(`Orden #${order.orderNumber} · ${ORDER_TYPE_LABEL[order.orderType]}`);
  if (order.tableNumber) parts.push(`Mesa: ${order.tableNumber}`);
  if (order.customerName) parts.push(`Cliente: ${order.customerName}`);
  parts.push(
    new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
  );
  parts.push("--------------------------------");

  for (const line of order.lines) {
    parts.push(`${line.quantity}x ${line.product_name}`);
    if (line.modifiers.length > 0) {
      parts.push(`   ${line.modifiers.map((m) => m.name).join(", ")}`);
    }
    if (line.notes) parts.push(`   >>> ${line.notes} <<<`);
  }

  return parts.join("\n");
}

// Reimpresión bajo demanda desde el tablero de Cocina (ver KitchenOrderCard)
// -- misma idea que buildComandaText, pero a partir de lo que ya trae
// KitchenOrder (no hay unit_price/modifier_id ahí, solo nombres).
export function buildComandaTextFromKitchenOrder(order: KitchenOrder): string {
  const parts: string[] = [];
  parts.push("*** COMANDA (reimpresión) ***");
  parts.push(`Orden #${order.orderNumber} · ${ORDER_TYPE_LABEL[order.orderType]}`);
  if (order.tableNumber) parts.push(`Mesa: ${order.tableNumber}`);
  if (order.customerName) parts.push(`Cliente: ${order.customerName}`);
  parts.push("--------------------------------");

  for (const item of order.items) {
    parts.push(`${item.quantity}x ${item.productName}`);
    if (item.modifierNames.length > 0) {
      parts.push(`   ${item.modifierNames.join(", ")}`);
    }
    if (item.notes) parts.push(`   >>> ${item.notes} <<<`);
  }

  return parts.join("\n");
}
