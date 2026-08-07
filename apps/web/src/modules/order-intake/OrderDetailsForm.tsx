import type { OrderType } from "@pos/shared-types";

export type IntakeOrderType = Extract<OrderType, "dine_in" | "pickup" | "delivery">;

export interface IntakeDetails {
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  scheduledFor: string; // datetime-local value, "" = ahora
}

interface OrderDetailsFormProps {
  orderType: IntakeOrderType;
  onOrderTypeChange: (type: IntakeOrderType) => void;
  details: IntakeDetails;
  onDetailsChange: (details: IntakeDetails) => void;
}

const TYPE_OPTIONS: { value: IntakeOrderType; label: string }[] = [
  { value: "dine_in", label: "Mesa" },
  { value: "pickup", label: "Recoger" },
  { value: "delivery", label: "Domicilio" },
];

function field(
  details: IntakeDetails,
  onDetailsChange: (details: IntakeDetails) => void,
  key: keyof IntakeDetails,
) {
  return {
    value: details[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onDetailsChange({ ...details, [key]: e.target.value }),
  };
}

// Formulario de datos extra según el tipo de pedido. Programar hora/fecha
// solo aplica a recoger/domicilio -- un pedido de mesa es siempre "ahora".
export function OrderDetailsForm({
  orderType,
  onOrderTypeChange,
  details,
  onDetailsChange,
}: OrderDetailsFormProps) {
  return (
    <div className="border-b border-neutral-200 bg-white p-4">
      <div className="mb-3 flex gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onOrderTypeChange(opt.value)}
            className={`rounded-lg px-5 py-2 text-lg font-semibold ${
              orderType === opt.value
                ? "bg-[var(--brand-primary)] text-white"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {orderType === "dine_in" && (
          <input
            {...field(details, onDetailsChange, "tableNumber")}
            placeholder="Número de mesa"
            className="w-40 rounded-lg border border-neutral-300 px-3 py-2"
          />
        )}

        {(orderType === "pickup" || orderType === "delivery") && (
          <>
            <input
              {...field(details, onDetailsChange, "customerName")}
              placeholder="Nombre del cliente"
              className="w-56 rounded-lg border border-neutral-300 px-3 py-2"
            />
            <input
              {...field(details, onDetailsChange, "customerPhone")}
              placeholder="Teléfono"
              type="tel"
              className="w-44 rounded-lg border border-neutral-300 px-3 py-2"
            />
          </>
        )}

        {orderType === "delivery" && (
          <input
            {...field(details, onDetailsChange, "deliveryAddress")}
            placeholder="Dirección de entrega"
            className="w-72 rounded-lg border border-neutral-300 px-3 py-2"
          />
        )}

        {(orderType === "pickup" || orderType === "delivery") && (
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            Para:
            <input
              type="datetime-local"
              value={details.scheduledFor}
              onChange={(e) =>
                onDetailsChange({ ...details, scheduledFor: e.target.value })
              }
              className="rounded-lg border border-neutral-300 px-2 py-2"
            />
            <span className="text-neutral-400">(vacío = lo antes posible)</span>
          </label>
        )}
      </div>
    </div>
  );
}
