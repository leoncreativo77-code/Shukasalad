import type { CartLine, OrderType } from "@pos/shared-types";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  counter: "Mostrador",
  dine_in: "Mesa",
  pickup: "Recoger",
  delivery: "Domicilio",
};

export interface TicketOrderInfo {
  orderNumber: number;
  orderType: OrderType;
  lines: CartLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  tableNumber?: string | null;
  customerName?: string | null;
}

// Arma el texto plano del ticket (formato WhatsApp: *negritas* con
// asteriscos) para adjuntar al link de wa.me -- ver buildWhatsAppLink.
export function buildTicketText(order: TicketOrderInfo): string {
  const parts: string[] = [];
  parts.push("*Shuka Salads*");
  parts.push(`Orden #${order.orderNumber} · ${ORDER_TYPE_LABEL[order.orderType]}`);
  if (order.tableNumber) parts.push(`Mesa: ${order.tableNumber}`);
  if (order.customerName) parts.push(`Cliente: ${order.customerName}`);
  parts.push("");

  for (const line of order.lines) {
    const modifiersTotal = line.modifiers.reduce((s, m) => s + m.price_delta, 0);
    const lineTotal = (line.unit_price + modifiersTotal) * line.quantity;
    parts.push(`${line.quantity} x ${line.product_name} - ${currency.format(lineTotal)}`);
    if (line.modifiers.length > 0) {
      parts.push(`  ${line.modifiers.map((m) => m.name).join(", ")}`);
    }
    if (line.notes) parts.push(`  "${line.notes}"`);
  }

  parts.push("");
  parts.push(`Subtotal: ${currency.format(order.subtotal)}`);
  parts.push(`IVA: ${currency.format(order.taxAmount)}`);
  parts.push(`*Total: ${currency.format(order.total)}*`);
  parts.push("");
  parts.push("¡Gracias por tu compra!");

  return parts.join("\n");
}

// wa.me necesita el número con código de país, sin signos ni espacios. Si
// capturan solo 10 dígitos (formato local mexicano) se asume México (52) --
// si ya incluyen código de país, se respeta tal cual.
export function buildWhatsAppLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `52${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(text)}`;
}
