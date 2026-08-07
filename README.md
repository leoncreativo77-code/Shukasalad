# POS Restaurante

Sistema de punto de venta para restaurante. Local-first: corre completamente sin
internet (cobrar, imprimir tickets, cerrar caja) y sincroniza en segundo plano
hacia una nube (Postgres) para respaldo y reportes remotos.

## Estructura

```
apps/
  desktop/      App de escritorio (Tauri + React + TypeScript). Módulo de venta a
                público, catálogo, caja. SQLite como fuente de verdad local.
  cloud-api/    Backend de sincronización y reportes remotos (Node.js + Postgres).
                Placeholder por ahora — ver apps/cloud-api/README.md.
packages/
  shared-types/ Tipos TypeScript compartidos entre desktop y cloud-api.
docs/
  schema.md     Esquema de base de datos local documentado.
```

## Estado actual

Etapa 1: módulo de venta a público (mostrador).

- [x] Catálogo de productos (categorías, productos, activar/desactivar)
- [x] Toma de orden en mostrador (carrito, modificadores, notas, subtotal/IVA/total)
- [ ] Cobro (efectivo/tarjeta/mixto) y ticket
- [ ] Apertura/cierre de caja
- [ ] Historial de ventas, cancelación y reimpresión con auditoría
- [ ] Reportes diarios (PDF/Excel)
- [ ] Sincronización real hacia `cloud-api` (el outbox local ya está implementado)

## Desarrollo

Requisitos: Node.js LTS, Rust (rustup), y en Windows las herramientas de build de
C++ de Visual Studio (requisito de Tauri).

```bash
cd apps/desktop
npm install
npm run tauri dev
```
