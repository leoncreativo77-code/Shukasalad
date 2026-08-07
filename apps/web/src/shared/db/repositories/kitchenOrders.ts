import type { KitchenStatus, OrderType } from "@pos/shared-types";
import type { PosDatabase } from "../client";
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

const ACTIVE_STATUSES: KitchenStatus[] = ["new", "preparing", "ready"];

// Todas las órdenes que todavía necesitan atención en cocina/mostrador,
// incluyendo las de mostrador (order_type 'counter') -- la persona detrás
// del mostrador prepara de todo, no solo mesa/recoger/domicilio. Se excluyen
// las canceladas y las que ya están 'ready' desde hace mucho no se filtran
// aquí -- el tablero las muestra en su columna hasta que alguien las quite
// manualmente (no hay un cuarto estado "entregado" en esta etapa).
export async function listActiveKitchenOrders(
  db: PosDatabase,
): Promise<KitchenOrder[]> {
  const orders = (
    await db.orders.where("kitchen_status").anyOf(ACTIVE_STATUSES).toArray()
  )
    .filter((o) => o.status !== "cancelled")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const items = await db.order_items.where("order_id").anyOf(orderIds).toArray();

  const itemIds = items.map((i) => i.id);
  const modifiers = itemIds.length
    ? await db.order_item_modifiers.where("order_item_id").anyOf(itemIds).toArray()
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
  db: PosDatabase,
  orderId: string,
  status: KitchenStatus,
): Promise<void> {
  await db.orders.update(orderId, { kitchen_status: status });
  await writeOutboxEvent(db, "order", orderId, "update", {
    id: orderId,
    kitchen_status: status,
  });
}
