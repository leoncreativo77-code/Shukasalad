import { useEffect, useState } from "react";
import type { OrderType } from "@pos/shared-types";
import { getDb } from "../../shared/db/client";
import {
  getSalesStats,
  type SalesStats,
  type StatsRange,
} from "../../shared/db/repositories/stats";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const RANGE_OPTIONS: { value: StatsRange; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "all", label: "Todo" },
];

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  counter: "Mostrador",
  dine_in: "Mesa",
  pickup: "Recoger",
  delivery: "Domicilio",
};

const EMPTY_STATS: SalesStats = {
  orderCount: 0,
  totalSales: 0,
  averageTicket: 0,
  byOrderType: {},
  topProducts: [],
};

// Solo accesible desde Admin (ver AdminScreen/RequireAdmin en App.tsx) --
// un cajero nunca ve esta pantalla.
export function StatsScreen() {
  const [range, setRange] = useState<StatsRange>("today");
  const [stats, setStats] = useState<SalesStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const db = await getDb();
      const result = await getSalesStats(db, range);
      if (!cancelled) {
        setStats(result);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const orderTypeEntries = Object.entries(stats.byOrderType) as [
    OrderType,
    { count: number; total: number },
  ][];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800">Estadística</h2>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                range === opt.value
                  ? "bg-[var(--brand-primary)] text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-neutral-400">Calculando…</p>
      ) : (
        <div className="max-w-3xl space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Total vendido</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {currency.format(stats.totalSales)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Órdenes</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {stats.orderCount}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Ticket promedio</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {currency.format(stats.averageTicket)}
              </p>
            </div>
          </div>

          <section>
            <h3 className="mb-2 font-medium text-neutral-700">Por tipo de orden</h3>
            {orderTypeEntries.length === 0 ? (
              <p className="text-neutral-400">Sin órdenes en este periodo.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {orderTypeEntries.map(([type, data], i) => (
                  <div
                    key={type}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i > 0 ? "border-t border-neutral-100" : ""
                    }`}
                  >
                    <span className="text-neutral-700">
                      {ORDER_TYPE_LABEL[type]}{" "}
                      <span className="text-neutral-400">({data.count})</span>
                    </span>
                    <span className="font-semibold text-neutral-800">
                      {currency.format(data.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-medium text-neutral-700">
              Productos más vendidos
            </h3>
            {stats.topProducts.length === 0 ? (
              <p className="text-neutral-400">Sin ventas en este periodo.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {stats.topProducts.map((p, i) => (
                  <div
                    key={p.productName}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i > 0 ? "border-t border-neutral-100" : ""
                    }`}
                  >
                    <span className="text-neutral-700">
                      {p.quantity}× {p.productName}
                    </span>
                    <span className="font-semibold text-neutral-800">
                      {currency.format(p.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
