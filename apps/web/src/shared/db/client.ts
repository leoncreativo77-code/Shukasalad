import Dexie, { type Table } from "dexie";
import type {
  User,
  Category,
  Product,
  Modifier,
  ProductModifier,
  TaxRate,
  CashSession,
  Order,
  OrderItem,
  OrderItemModifier,
  Payment,
  AuditLogEntry,
  OutboxEvent,
} from "@pos/shared-types";

export interface AppSettingRow {
  key: string;
  value: string;
}

// Blob de una imagen subida (producto o marca). Product.image_path / los
// app_settings de marca guardan el `id` de este registro en vez de una ruta
// de archivo -- ver shared/browser/pickImage.ts.
export interface ImageRow {
  id: string;
  blob: Blob;
  created_at: string;
}

// Mismo esquema que src-tauri/migrations/*.sql, reflejado como tablas Dexie.
// `active`/`is_default` son booleanos en los tipos de dominio (@pos/shared-types)
// pero IndexedDB no admite boolean como clave indexable, así que esos campos
// no se indexan aquí -- se filtran en memoria dentro de cada repositorio.
export class PosDatabase extends Dexie {
  users!: Table<User, string>;
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  modifiers!: Table<Modifier, string>;
  product_modifiers!: Table<ProductModifier, [string, string]>;
  tax_rates!: Table<TaxRate, string>;
  cash_sessions!: Table<CashSession, string>;
  orders!: Table<Order, string>;
  order_items!: Table<OrderItem, string>;
  order_item_modifiers!: Table<OrderItemModifier, string>;
  payments!: Table<Payment, string>;
  audit_log!: Table<AuditLogEntry, string>;
  outbox_events!: Table<OutboxEvent, string>;
  app_settings!: Table<AppSettingRow, string>;
  images!: Table<ImageRow, string>;

  constructor() {
    super("pos-restaurante");
    this.version(1).stores({
      users: "id",
      categories: "id, sort_order",
      products: "id, category_id, sort_order",
      modifiers: "id",
      product_modifiers: "[product_id+modifier_id], product_id, modifier_id",
      tax_rates: "id",
      cash_sessions: "id, status, opening_at",
      orders: "id, cash_session_id, status, kitchen_status, created_at",
      order_items: "id, order_id",
      order_item_modifiers: "id, order_item_id",
      payments: "id, order_id",
      audit_log: "id, entity_type, entity_id",
      outbox_events: "id, synced_at",
      app_settings: "key",
      images: "id",
    });
  }
}

let dbInstance: PosDatabase | null = null;
let seedPromise: Promise<void> | null = null;

// Firma async a propósito (aunque abrir Dexie es instantáneo) para que el
// resto del código -- copiado casi tal cual de apps/desktop -- pueda seguir
// escribiendo `const db = await getDb();` sin cambios. La primera llamada
// también siembra los datos demo (equivalente al seed embebido en
// 0001_init.sql de desktop) si la base está vacía.
export async function getDb(): Promise<PosDatabase> {
  if (!dbInstance) {
    dbInstance = new PosDatabase();
  }
  if (!seedPromise) {
    // Se asigna síncronamente (antes de cualquier await) para que dos
    // llamadas concurrentes a getDb() -- normal al montar varias pantallas
    // a la vez -- no disparen seedIfEmpty() dos veces y choquen con
    // ConstraintError al insertar las mismas claves.
    seedPromise = import("./seed").then(({ seedIfEmpty }) =>
      seedIfEmpty(dbInstance!),
    );
  }
  await seedPromise;
  return dbInstance;
}
