import type { OrderType } from "@pos/shared-types";
import type { PosDatabase } from "../client";

export interface ProductStat {
  productName: string;
  quantity: number;
  total: number;
}

export interface OrderTypeStat {
  count: number;
  total: number;
}

export interface SalesStats {
  orderCount: number;
  totalSales: number;
  averageTicket: number;
  byOrderType: Partial<Record<OrderType, OrderTypeStat>>;
  topProducts: ProductStat[];
}

export type StatsRange = "today" | "week" | "month" | "all";

function rangeStart(range: StatsRange): Date | null {
  if (range === "all") return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (range === "week") {
    // Lunes como inicio de semana (getDay(): 0=domingo..6=sábado).
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
  } else if (range === "month") {
    start.setDate(1);
  }

  return start;
}

// Solo cuenta órdenes no canceladas -- todavía no existe el módulo de pagos
// (ver docs/schema.md), así que "venta" aquí significa "orden capturada",
// igual que en el resto de la app en esta etapa.
export async function getSalesStats(
  db: PosDatabase,
  range: StatsRange,
): Promise<SalesStats> {
  const from = rangeStart(range);
  const allOrders = await db.orders.toArray();
  const orders = allOrders.filter((o) => {
    if (o.status === "cancelled") return false;
    if (from && new Date(o.created_at) < from) return false;
    return true;
  });

  const orderCount = orders.length;
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const averageTicket = orderCount > 0 ? totalSales / orderCount : 0;

  const byOrderType: SalesStats["byOrderType"] = {};
  for (const o of orders) {
    const bucket = byOrderType[o.order_type] ?? { count: 0, total: 0 };
    bucket.count += 1;
    bucket.total += o.total;
    byOrderType[o.order_type] = bucket;
  }

  const orderIds = new Set(orders.map((o) => o.id));
  const items = (await db.order_items.toArray()).filter((i) =>
    orderIds.has(i.order_id),
  );

  const productMap = new Map<string, ProductStat>();
  for (const item of items) {
    const entry = productMap.get(item.product_name_snapshot) ?? {
      productName: item.product_name_snapshot,
      quantity: 0,
      total: 0,
    };
    entry.quantity += item.quantity;
    entry.total += item.line_subtotal;
    productMap.set(item.product_name_snapshot, entry);
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return { orderCount, totalSales, averageTicket, byOrderType, topProducts };
}
