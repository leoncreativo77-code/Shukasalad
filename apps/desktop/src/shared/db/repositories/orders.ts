import { v4 as uuidv4 } from "uuid";
import type Database from "@tauri-apps/plugin-sql";
import type { CartLine } from "@pos/shared-types";
import { withTransaction } from "../transaction";
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
  db: Database,
  cashSessionId: string,
): Promise<number> {
  const rows = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM orders WHERE cash_session_id = $1",
    [cashSessionId],
  );
  return (rows[0]?.count ?? 0) + 1;
}

export interface NewOrder {
  cashSessionId: string;
  userId: string;
  lines: CartLine[];
}

export interface CreatedOrder {
  id: string;
  orderNumber: number;
  totals: OrderTotals;
}

// Persiste una orden de mostrador completa (orden + líneas + modificadores)
// como status 'open' -- todavía sin cobrar. El cobro y cierre de la orden se
// construyen en la siguiente etapa (módulo de pagos).
export async function createOrder(
  db: Database,
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

  await withTransaction(db, async () => {
    await db.execute(
      `INSERT INTO orders
         (id, order_number, cash_session_id, user_id, order_type, table_id, status, subtotal, tax_amount, total, created_at)
       VALUES ($1, $2, $3, $4, 'counter', NULL, 'open', $5, $6, $7, $8)`,
      [
        orderId,
        orderNumber,
        input.cashSessionId,
        input.userId,
        totals.subtotal,
        totals.taxAmount,
        totals.total,
        now,
      ],
    );

    const itemsPayload = [];
    for (const line of input.lines) {
      const itemId = uuidv4();
      await db.execute(
        `INSERT INTO order_items
           (id, order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, notes, line_subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          itemId,
          orderId,
          line.product_id,
          line.product_name,
          line.unit_price,
          line.quantity,
          line.notes || null,
          lineTotal(line),
        ],
      );

      const modifiersPayload = [];
      for (const mod of line.modifiers) {
        const modId = uuidv4();
        await db.execute(
          `INSERT INTO order_item_modifiers
             (id, order_item_id, modifier_id, modifier_name_snapshot, price_delta_snapshot)
           VALUES ($1, $2, $3, $4, $5)`,
          [modId, itemId, mod.modifier_id, mod.name, mod.price_delta],
        );
        modifiersPayload.push({ id: modId, ...mod });
      }

      itemsPayload.push({ id: itemId, ...line, modifiers: modifiersPayload });
    }

    await writeOutboxEvent(db, "order", orderId, "insert", {
      id: orderId,
      order_number: orderNumber,
      cash_session_id: input.cashSessionId,
      user_id: input.userId,
      order_type: "counter",
      status: "open",
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total: totals.total,
      created_at: now,
      items: itemsPayload,
    });
  });

  return { id: orderId, orderNumber, totals };
}
