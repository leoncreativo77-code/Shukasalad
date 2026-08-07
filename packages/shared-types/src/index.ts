// Tipos compartidos entre apps/desktop y apps/cloud-api (a futuro).
// Reflejan el esquema documentado en docs/schema.md — cualquier cambio ahí debe
// reflejarse aquí y en la migración SQL correspondiente.

export type ID = string; // UUID v4

export type UserRole = "admin" | "cashier" | "waiter";

export interface User {
  id: ID;
  name: string;
  pin_hash: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: ID;
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: ID;
  category_id: ID;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  active: boolean;
  sort_order: number;
  image_path: string | null;
  // Posición en la cuadrícula de venta de su categoría. NULL = sin posición
  // asignada, se muestra en el flujo automático ordenado por sort_order.
  grid_col: number | null;
  grid_row: number | null;
  created_at: string;
  updated_at: string;
}

export interface Modifier {
  id: ID;
  name: string;
  price_delta: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductModifier {
  product_id: ID;
  modifier_id: ID;
}

export interface TaxRate {
  id: ID;
  name: string;
  rate: number; // ej. 0.16
  is_default: boolean;
  active: boolean;
}

export type CashSessionStatus = "open" | "closed";

export interface CashSession {
  id: ID;
  opened_by: ID;
  opening_amount: number;
  opening_at: string;
  closed_by: ID | null;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  closing_at: string | null;
  status: CashSessionStatus;
  notes: string | null;
}

export type OrderStatus = "open" | "paid" | "cancelled";
export type OrderType = "counter" | "dine_in" | "delivery";

export interface Order {
  id: ID;
  order_number: number;
  cash_session_id: ID;
  user_id: ID;
  order_type: OrderType;
  table_id: ID | null;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  cancelled_by: ID | null;
  cancel_reason: string | null;
}

export interface OrderItem {
  id: ID;
  order_id: ID;
  product_id: ID;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  notes: string | null;
  line_subtotal: number;
}

export interface OrderItemModifier {
  id: ID;
  order_item_id: ID;
  modifier_id: ID | null;
  modifier_name_snapshot: string;
  price_delta_snapshot: number;
}

export type PaymentMethod = "cash" | "card";

export interface Payment {
  id: ID;
  order_id: ID;
  method: PaymentMethod;
  amount: number;
  tendered_amount: number | null;
  change_amount: number | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: ID;
  entity_type: string;
  entity_id: ID;
  action: string;
  user_id: ID | null;
  reason: string | null;
  metadata: string | null;
  created_at: string;
}

export type OutboxOperation = "insert" | "update";

export interface OutboxEvent {
  id: ID;
  entity_type: string;
  entity_id: ID;
  operation: OutboxOperation;
  payload: string; // JSON serializado
  device_id: string;
  created_at: string;
  synced_at: string | null;
  attempts: number;
  last_error: string | null;
}

// --- Tipos compuestos usados por la UI de venta (no son tablas) ---

export interface CartLineModifier {
  modifier_id: ID | null;
  name: string;
  price_delta: number;
}

export interface CartLine {
  product_id: ID;
  product_name: string;
  unit_price: number;
  quantity: number;
  notes: string;
  modifiers: CartLineModifier[];
}
