# Esquema de base de datos local (SQLite)

Fuente de verdad de la operación. Todas las tablas sincronizables usan
`id TEXT PRIMARY KEY` (UUID v4, generado en el cliente) en vez de autoincrement,
para que múltiples dispositivos/cajas puedan crear registros sin colisionar al
fusionarse en la nube. Timestamps en ISO-8601 (TEXT).

El DDL vive como migración versionada en
[`apps/desktop/src-tauri/migrations/0001_init.sql`](../apps/desktop/src-tauri/migrations/0001_init.sql).
Este documento es la referencia legible; ante cualquier diferencia, la migración
manda.

## Tablas

| Tabla | Propósito |
|---|---|
| `users` | Cajeros, login por PIN |
| `categories` | Categorías del catálogo (entradas, platos fuertes, bebidas, postres...) |
| `products` | Productos, precio, disponibilidad |
| `modifiers` | Catálogo reutilizable de modificadores (ej. "sin cebolla") |
| `product_modifiers` | Qué modificadores aplican a qué producto |
| `tax_rates` | Tasas de impuesto configurables (IVA 16% por defecto) |
| `cash_sessions` | Apertura/cierre de caja por turno |
| `orders` | Órdenes de venta |
| `order_items` | Líneas de una orden (snapshot de nombre/precio al vender) |
| `order_item_modifiers` | Modificadores aplicados a una línea |
| `payments` | Pagos de una orden — 1 fila por método; "mixto" = 2+ filas |
| `audit_log` | Cancelaciones, reimpresiones y otras acciones auditables |
| `outbox_events` | Cola de sincronización local → nube |
| `app_settings` | Config clave/valor (device_id, nombre del restaurante, etc.) |

## Decisiones de diseño

- **"Mixto" no es un enum especial.** Una orden pagada con efectivo + tarjeta
  simplemente tiene dos filas en `payments`. Evita casos especiales en el código
  de cobro y permite cualquier combinación de métodos sin cambiar el esquema.
- **Mesas están previstas, no implementadas.** `orders.table_id` existe y es
  `NULL` en esta etapa (solo mostrador); el módulo de mesas futuro solo necesita
  empezar a poblarlo, sin migración destructiva.
- **`order_type`** distingue `counter` (mostrador) de valores futuros como
  `dine_in` o `delivery`, para que el módulo de pedidos a domicilio reutilice
  `orders`/`order_items`/`payments` sin duplicar modelos.
- **Snapshots en `order_items`/`order_item_modifiers`.** Se copian nombre y
  precio al momento de vender, para que cambios posteriores al catálogo no
  alteren tickets ya emitidos.
- **Auditoría genérica (`audit_log`)** en vez de columnas ad hoc por tipo de
  evento, para poder registrar cancelaciones, reimpresiones, y acciones futuras
  (ej. anular una línea) sin seguir agregando columnas a `orders`.
- **Outbox pattern.** Toda escritura a una tabla sincronizable inserta también
  una fila en `outbox_events` en la misma transacción. El detalle del proceso de
  sincronización está en el plan de sincronización del proyecto (ver README raíz
  y `apps/cloud-api/README.md` para el contrato del endpoint).
