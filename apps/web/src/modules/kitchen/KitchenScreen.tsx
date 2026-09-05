import { useCallback, useEffect, useState } from "react";
import type { KitchenStatus } from "@pos/shared-types";
import { getDb } from "../../shared/db/client";
import {
  listActiveKitchenOrders,
  setKitchenStatus,
  type KitchenOrder,
} from "../../shared/db/repositories/kitchenOrders";
import { buildComandaTextFromKitchenOrder } from "../../shared/print/comanda";
import { usePrint } from "../../shared/print/usePrint";
import { KitchenOrderCard } from "./KitchenOrderCard";

const COLUMNS: { status: KitchenStatus; title: string }[] = [
  { status: "new", title: "Nuevo" },
  { status: "preparing", title: "En preparación" },
  { status: "ready", title: "Listo" },
];

const NEXT_STATUS: Record<KitchenStatus, KitchenStatus | null> = {
  new: "preparing",
  preparing: "ready",
  ready: null,
};
const PREV_STATUS: Record<KitchenStatus, KitchenStatus | null> = {
  new: null,
  preparing: "new",
  ready: "preparing",
};

// Tablero para quien prepara los pedidos detrás del mostrador: ve todo lo
// que entra (mostrador, mesa, recoger, domicilio) y lo va avanzando de
// columna. Como es una sola app local sin backend en tiempo real todavía,
// se refresca con polling corto -- suficiente para que lo que capturan
// Venta/Pedidos aparezca aquí casi al instante.
export function KitchenScreen() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const { print, printArea } = usePrint();

  const reload = useCallback(async () => {
    const db = await getDb();
    setOrders(await listActiveKitchenOrders(db));
  }, []);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 5000);
    return () => clearInterval(interval);
  }, [reload]);

  async function handleChangeStatus(orderId: string, status: KitchenStatus) {
    const db = await getDb();
    await setKitchenStatus(db, orderId, status);
    await reload();
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto p-4">
      {COLUMNS.map((col) => {
        const columnOrders = orders.filter((o) => o.kitchenStatus === col.status);
        return (
          <div
            key={col.status}
            className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-neutral-100"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="font-semibold text-neutral-700">{col.title}</h2>
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                {columnOrders.length}
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {columnOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onAdvance={() => {
                    const next = NEXT_STATUS[order.kitchenStatus];
                    if (next) handleChangeStatus(order.id, next);
                  }}
                  onGoBack={() => {
                    const prev = PREV_STATUS[order.kitchenStatus];
                    if (prev) handleChangeStatus(order.id, prev);
                  }}
                  onPrint={() => print(buildComandaTextFromKitchenOrder(order))}
                />
              ))}
              {columnOrders.length === 0 && (
                <p className="p-2 text-sm text-neutral-400">Sin pedidos aquí.</p>
              )}
            </div>
          </div>
        );
      })}

      {printArea}
    </div>
  );
}
