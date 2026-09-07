import type Database from "@tauri-apps/plugin-sql";
import type { KitchenStatus, OrderType } from "@pos/shared-types";
import { writeOutboxEvent } from "../outbox";

export interface KitchenOrderItem {
  id: string;
  productName: string;
  quantity: number;
  notes: string | null;
  modifierNames: string[];
}

export interface KitchenOrder {
  id: string;
  orderNumber: number;
  orderType: OrderType;
  kitchenStatus: KitchenStatus;
  tableNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  scheduledFor: string | null;
  createdAt: string;
  items: KitchenOrderItem[];
}

interface OrderRow {
  id: string;
  order_number: number;
  order_type: OrderType;
  kitchen_status: KitchenStatus;
  table_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  scheduled_for: string | null;
  created_at: string;
}

interface ItemRow {
  id: string;
  order_id: string;
  product_name_snapshot: string;
  quantity: number;
  notes: string | null;
}

interface ModifierRow {
  order_item_id: string;
  modifier_name_snapshot: string;
}

// Todas las órdenes que todavía necesitan atención en cocina/mostrador,
// incluyendo las de mostrador (order_type 'counter') -- la persona detrás
// del mostrador prepara de todo, no solo mesa/recoger/domicilio. Se excluyen
// las canceladas y las que ya están 'ready' desde hace mucho no se filtran
// aquí -- el tablero las muestra en su columna hasta que alguien las quite
// manualmente (no hay un cuarto estado "entregado" en esta etapa).
export async function listActiveKitchenOrders(
  db: Database,
): Promise<KitchenOrder[]> {
  const orders = await db.select<OrderRow[]>(
    `SELECT id, order_number, order_type, kitchen_status, table_number,
            customer_name, customer_phone, delivery_address, scheduled_for, created_at
     FROM orders
     WHERE status != 'cancelled' AND kitchen_status IN ('new', 'preparing', 'ready')
     ORDER BY created_at ASC`,
  );

  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(", ");

  const items = await db.select<ItemRow[]>(
    `SELECT id, order_id, product_name_snapshot, quantity, notes
     FROM order_items WHERE order_id IN (${placeholders})`,
    orderIds,
  );

  const itemIds = items.map((i) => i.id);
  const modifiers = itemIds.length
    ? await db.select<ModifierRow[]>(
        `SELECT order_item_id, modifier_name_snapshot
         FROM order_item_modifiers WHERE order_item_id IN (${itemIds
           .map((_, i) => `$${i + 1}`)
           .join(", ")})`,
        itemIds,
      )
    : [];

  const modifiersByItem = new Map<string, string[]>();
  for (const mod of modifiers) {
    const list = modifiersByItem.get(mod.order_item_id) ?? [];
    list.push(mod.modifier_name_snapshot);
    modifiersByItem.set(mod.order_item_id, list);
  }

  const itemsByOrder = new Map<string, KitchenOrderItem[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push({
      id: item.id,
      productName: item.product_name_snapshot,
      quantity: item.quantity,
      notes: item.notes,
      modifierNames: modifiersByItem.get(item.id) ?? [],
    });
    itemsByOrder.set(item.order_id, list);
  }

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    orderType: o.order_type,
    kitchenStatus: o.kitchen_status,
    tableNumber: o.table_number,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    deliveryAddress: o.delivery_address,
    scheduledFor: o.scheduled_for,
    createdAt: o.created_at,
    items: itemsByOrder.get(o.id) ?? [],
  }));
}

export async function setKitchenStatus(
  db: Database,
  orderId: string,
  status: KitchenStatus,
): Promise<void> {
  await db.execute("UPDATE orders SET kitchen_status = $1 WHERE id = $2", [
    status,
    orderId,
  ]);
  await writeOutboxEvent(db, "order", orderId, "update", {
    id: orderId,
    kitchen_status: status,
  });
}
