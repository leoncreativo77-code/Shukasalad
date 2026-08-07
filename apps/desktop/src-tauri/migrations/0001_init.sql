-- Esquema inicial del módulo de venta a público.
-- Ver docs/schema.md en la raíz del repo para la referencia legible y las
-- decisiones de diseño (por qué "mixto" no es un enum, por qué hay snapshots
-- en order_items, etc).

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  sku TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_products_category ON products(category_id);

CREATE TABLE modifiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_delta REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE product_modifiers (
  product_id TEXT NOT NULL REFERENCES products(id),
  modifier_id TEXT NOT NULL REFERENCES modifiers(id),
  PRIMARY KEY (product_id, modifier_id)
);

CREATE TABLE tax_rates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rate REAL NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE cash_sessions (
  id TEXT PRIMARY KEY,
  opened_by TEXT NOT NULL REFERENCES users(id),
  opening_amount REAL NOT NULL,
  opening_at TEXT NOT NULL,
  closed_by TEXT REFERENCES users(id),
  closing_amount REAL,
  expected_amount REAL,
  difference REAL,
  closing_at TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number INTEGER NOT NULL,
  cash_session_id TEXT NOT NULL REFERENCES cash_sessions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  order_type TEXT NOT NULL DEFAULT 'counter',
  table_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  cancelled_at TEXT,
  cancelled_by TEXT REFERENCES users(id),
  cancel_reason TEXT
);
CREATE INDEX idx_orders_cash_session ON orders(cash_session_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name_snapshot TEXT NOT NULL,
  unit_price_snapshot REAL NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  line_subtotal REAL NOT NULL
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE order_item_modifiers (
  id TEXT PRIMARY KEY,
  order_item_id TEXT NOT NULL REFERENCES order_items(id),
  modifier_id TEXT REFERENCES modifiers(id),
  modifier_name_snapshot TEXT NOT NULL,
  price_delta_snapshot REAL NOT NULL DEFAULT 0
);
CREATE INDEX idx_order_item_modifiers_item ON order_item_modifiers(order_item_id);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  method TEXT NOT NULL,
  amount REAL NOT NULL,
  tendered_amount REAL,
  change_amount REAL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_payments_order ON payments(order_id);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  reason TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE outbox_events (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  synced_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);
CREATE INDEX idx_outbox_pending ON outbox_events(synced_at);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Seed: datos mínimos para poder usar el mostrador de punta a punta.
-- Cajero demo, PIN 1234 (SHA-256, ver shared/auth). Tasa de IVA 16% (México).
-- Una cash_session abierta de prueba: el flujo real de apertura de caja se
-- construye en la siguiente etapa; por ahora orders.cash_session_id necesita
-- una sesión válida para que el módulo de ventas sea usable ya mismo.
-- ---------------------------------------------------------------------------

INSERT INTO users (id, name, pin_hash, role, active, created_at, updated_at) VALUES
  ('1685762f-b276-4057-939e-8d7a066d6860', 'Cajero Demo',
   '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
   'cashier', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO tax_rates (id, name, rate, is_default, active) VALUES
  ('e12790d0-c495-41bc-8965-5f21f41374dd', 'IVA', 0.16, 1, 1);

INSERT INTO categories (id, name, sort_order, active, created_at, updated_at) VALUES
  ('a3b2ebb2-9398-4a20-aa03-9886df16daef', 'Entradas', 1, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('d7481fdd-01dc-4f82-af0d-65566ae4cfb7', 'Platos fuertes', 2, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('0c3b90ca-2e7b-47bb-9f2b-7d6123c7a3fe', 'Bebidas', 3, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('d863cd7c-48fa-43bd-a486-8117252d456b', 'Postres', 4, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO products (id, category_id, name, description, price, sku, active, sort_order, created_at, updated_at) VALUES
  ('3ca35dbd-2dda-4ea9-ae0c-2862306036b5', 'a3b2ebb2-9398-4a20-aa03-9886df16daef', 'Alitas BBQ', '8 piezas', 120.00, 'ENT-001', 1, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('f5cf1264-1d7f-406c-8431-0ecf054a1591', 'a3b2ebb2-9398-4a20-aa03-9886df16daef', 'Nachos', 'Con queso y jalapeño', 95.00, 'ENT-002', 1, 2, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('4b5840c1-90f2-4615-ac52-1de190b8b9e7', 'd7481fdd-01dc-4f82-af0d-65566ae4cfb7', 'Hamburguesa clásica', 'Res, queso, lechuga, tomate', 145.00, 'PF-001', 1, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('43bab2b4-7379-46a0-8231-9cbc473a7637', 'd7481fdd-01dc-4f82-af0d-65566ae4cfb7', 'Tacos de asada', 'Orden de 3', 110.00, 'PF-002', 1, 2, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('96cb3696-af95-4d58-b5dd-8222c38cac71', 'd7481fdd-01dc-4f82-af0d-65566ae4cfb7', 'Alambre', 'Res, tocino, queso, pimiento', 135.00, 'PF-003', 1, 3, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('872987b0-2163-4dee-8180-8fe2d8ed9b6b', '0c3b90ca-2e7b-47bb-9f2b-7d6123c7a3fe', 'Coca-Cola', '355ml', 30.00, 'BEB-001', 1, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('180168c3-0ebb-42cb-b444-98052af3260d', '0c3b90ca-2e7b-47bb-9f2b-7d6123c7a3fe', 'Agua fresca', 'Sabor del día', 25.00, 'BEB-002', 1, 2, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('d38bcc3c-57db-429f-842f-2eac9ce480e7', '0c3b90ca-2e7b-47bb-9f2b-7d6123c7a3fe', 'Cerveza', '355ml', 45.00, 'BEB-003', 1, 3, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('f92b4225-2dad-4500-9f50-f84c6e37d99f', 'd863cd7c-48fa-43bd-a486-8117252d456b', 'Flan', 'Casero', 55.00, 'POS-001', 1, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('4c5b6645-8f52-4173-9d9b-209fcda2e611', 'd863cd7c-48fa-43bd-a486-8117252d456b', 'Pastel de chocolate', 'Rebanada', 65.00, 'POS-002', 1, 2, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO modifiers (id, name, price_delta, active, created_at, updated_at) VALUES
  ('14d67b2f-e9b4-465a-bdee-fe923b5c0ea8', 'Sin cebolla', 0, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('3c152fa7-7cfc-454f-bcd3-656fd73c0408', 'Extra queso', 15, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('da5ae285-5e64-4ece-bbdb-946c418daf25', 'Sin picante', 0, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO product_modifiers (product_id, modifier_id) VALUES
  ('4b5840c1-90f2-4615-ac52-1de190b8b9e7', '14d67b2f-e9b4-465a-bdee-fe923b5c0ea8'),
  ('4b5840c1-90f2-4615-ac52-1de190b8b9e7', '3c152fa7-7cfc-454f-bcd3-656fd73c0408'),
  ('43bab2b4-7379-46a0-8231-9cbc473a7637', '14d67b2f-e9b4-465a-bdee-fe923b5c0ea8'),
  ('43bab2b4-7379-46a0-8231-9cbc473a7637', 'da5ae285-5e64-4ece-bbdb-946c418daf25'),
  ('96cb3696-af95-4d58-b5dd-8222c38cac71', '14d67b2f-e9b4-465a-bdee-fe923b5c0ea8'),
  ('96cb3696-af95-4d58-b5dd-8222c38cac71', '3c152fa7-7cfc-454f-bcd3-656fd73c0408'),
  ('96cb3696-af95-4d58-b5dd-8222c38cac71', 'da5ae285-5e64-4ece-bbdb-946c418daf25'),
  ('f5cf1264-1d7f-406c-8431-0ecf054a1591', '3c152fa7-7cfc-454f-bcd3-656fd73c0408'),
  ('3ca35dbd-2dda-4ea9-ae0c-2862306036b5', 'da5ae285-5e64-4ece-bbdb-946c418daf25');

INSERT INTO cash_sessions (id, opened_by, opening_amount, opening_at, status, notes) VALUES
  ('33c985b2-1c11-4b96-915c-da56d43f8bc4', '1685762f-b276-4057-939e-8d7a066d6860', 1000.00, '2026-01-01T00:00:00.000Z', 'open', 'Sesión de prueba — el flujo real de apertura de caja se agrega en la siguiente etapa');
