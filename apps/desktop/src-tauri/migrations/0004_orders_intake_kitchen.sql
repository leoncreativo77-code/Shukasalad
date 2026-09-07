-- Soporte para pedidos de mesa/recoger/domicilio (módulo "Pedidos") y el
-- tablero de preparación (módulo "Cocina"). kitchen_status es independiente
-- de status (que sigue rastreando abierto/pagado/cancelado): una orden puede
-- estar 'open' (sin cobrar) y a la vez 'preparing' en cocina.
ALTER TABLE orders ADD COLUMN kitchen_status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE orders ADD COLUMN table_number TEXT;
ALTER TABLE orders ADD COLUMN customer_name TEXT;
ALTER TABLE orders ADD COLUMN customer_phone TEXT;
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN scheduled_for TEXT;

CREATE INDEX idx_orders_kitchen_status ON orders(kitchen_status);
