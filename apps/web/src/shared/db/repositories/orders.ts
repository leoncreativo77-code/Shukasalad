import { v4 as uuidv4 } from "uuid";
import type { CartLine, OrderType } from "@pos/shared-types";
import type { PosDatabase } from "../client";
import { writeOutboxEvent } from "../outbox";
import { getDefaultTaxRate } from "./taxRates";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function lineTotal(line: CartLine): number {
  const modifiersTotal = line.modifiers.reduce((s, m) => s + m.price_delta, 0);
  return round2((line.unit_price + modifiersTotal) * line.quantity);
}

export interface OrderTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export function calculateOrderTotals(
  lines: CartLine[],
  taxRate: number,
): OrderTotals {
  const subtotal = round2(lines.reduce((sum, line) => sum + lineTotal(line), 0));
  const taxAmount = round2(subtotal * taxRate);
  const total = round2(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
}

async function nextOrderNumber(
  db: PosDatabase,
  cashSessionId: string,
): Promise<number> {
  const count = await db.orders.where("cash_session_id").equals(cashSessionId).count();
  return count + 1;
}

export interface NewOrder {
  cashSessionId: string;
  userId: string;
  orderType: OrderType;
  lines: CartLine[];
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  scheduledFor?: string;
}

export interface CreatedOrder {
  id: string;
  orderNumber: number;
  totals: OrderTotals;
}

// Persiste una orden completa (orden + líneas + modificadores) como status
// 'open' -- todavía sin cobrar -- y kitchen_status 'new', lista para
// aparecer en el tablero de Cocina. El cobro/cierre de la orden se
// construyen en la siguiente etapa (módulo de pagos).
export async function createOrder(
  db: PosDatabase,
  input: NewOrder,
): Promise<CreatedOrder> {
  if (input.lines.length === 0) {
    throw new Error("La orden no tiene productos");
  }

  const taxRate = await getDefaultTaxRate(db);
  const totals = calculateOrderTotals(input.lines, taxRate.rate);
  const orderId = uuidv4();
  const orderNumber = await nextOrderNumber(db, input.cashSessionId);
  const now = new Date().toISOString();

  await db.orders.add({
    id: orderId,
    order_number: orderNumber,
    cash_session_id: input.cashSessionId,
    user_id: input.userId,
    order_type: input.orderType,
    table_id: null,
    status: "open",
    kitchen_status: "new",
    table_number: input.tableNumber ?? null,
    customer_name: input.customerName ?? null,
    customer_phone: input.customerPhone ?? null,
    delivery_address: input.deliveryAddress ?? null,
    scheduled_for: input.scheduledFor ?? null,
    subtotal: totals.subtotal,
    tax_amount: totals.taxAmount,
    total: totals.total,
    created_at: now,
    paid_at: null,
    cancelled_at: null,
    cancelled_by: null,
    cancel_reason: null,
  });

  const itemsPayload = [];
  for (const line of input.lines) {
    const itemId = uuidv4();
    await db.order_items.add({
      id: itemId,
      order_id: orderId,
      product_id: line.product_id,
      product_name_snapshot: line.product_name,
      unit_price_snapshot: line.unit_price,
      quantity: line.quantity,
      notes: line.notes || null,
      line_subtotal: lineTotal(line),
    });

    const modifiersPayload = [];
    for (const mod of line.modifiers) {
      const modId = uuidv4();
      await db.order_item_modifiers.add({
        id: modId,
        order_item_id: itemId,
        modifier_id: mod.modifier_id,
        modifier_name_snapshot: mod.name,
        price_delta_snapshot: mod.price_delta,
      });
      modifiersPayload.push({ id: modId, ...mod });
    }

    itemsPayload.push({ id: itemId, ...line, modifiers: modifiersPayload });
  }

  await writeOutboxEvent(db, "order", orderId, "insert", {
    id: orderId,
    order_number: orderNumber,
    cash_session_id: input.cashSessionId,
    user_id: input.userId,
    order_type: input.orderType,
    status: "open",
    kitchen_status: "new",
    table_number: input.tableNumber ?? null,
    customer_name: input.customerName ?? null,
    customer_phone: input.customerPhone ?? null,
    delivery_address: input.deliveryAddress ?? null,
    scheduled_for: input.scheduledFor ?? null,
    subtotal: totals.subtotal,
    tax_amount: totals.taxAmount,
    total: totals.total,
    created_at: now,
    items: itemsPayload,
  });

  return { id: orderId, orderNumber, totals };
}
