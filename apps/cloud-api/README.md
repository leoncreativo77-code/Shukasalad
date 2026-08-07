# cloud-api (placeholder — próxima etapa)

Backend de respaldo/sincronización/reportes remotos. Node.js + Postgres (p. ej.
Supabase). No bloquea nunca la operación local: la app de escritorio funciona sin
esto, y solo lo usa para respaldar datos y exponer reportes fuera de la
computadora del restaurante.

## Contrato planeado

### `POST /sync/events`

Recibe un batch de eventos de la cola `outbox_events` del dispositivo local.

```json
{
  "device_id": "uuid",
  "events": [
    {
      "id": "uuid",              // id del evento, es la clave de idempotencia
      "entity_type": "order",
      "entity_id": "uuid",
      "operation": "insert",
      "payload": { "...": "..." },
      "created_at": "2026-08-06T12:00:00.000Z"
    }
  ]
}
```

- `events[].id` tiene índice único en Postgres. Reintentos con el mismo id son
  no-op (`ON CONFLICT (id) DO NOTHING`) — nunca se duplica una venta aunque el
  mismo batch se reenvíe tras un timeout de red.
- Respuesta: `{ "accepted": ["id1", "id2", ...] }` — el cliente marca esos
  `outbox_events.synced_at` localmente solo con los ids confirmados.

### `GET /reports/daily?date=YYYY-MM-DD&restaurant_id=...`

Solo lectura, para consulta remota del cierre de día una vez sincronizado.

## Esquema Postgres

Espejo del esquema SQLite documentado en `docs/schema.md`, con `restaurant_id` y
`device_id` agregados para soportar multi-sucursal/multi-caja desde la nube.

## Por qué no está implementado todavía

Se prioriza validar el módulo de mostrador local primero. Implementar esto
requiere que el usuario provisione un proyecto Postgres (Supabase u otro) — se
construye en la siguiente etapa.
