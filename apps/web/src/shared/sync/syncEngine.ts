import type { SupabaseClient } from "@supabase/supabase-js";
import type { PosDatabase } from "../db/client";
import { getSupabase } from "./supabaseClient";

type EntityHandler = (
  db: PosDatabase,
  supabase: SupabaseClient,
  entityId: string,
) => Promise<void>;

// Cada handler lee el estado ACTUAL de la entidad en Dexie (no el payload
// del evento, que puede ser un patch parcial) y lo empuja completo a
// Supabase -- así no importa cuántas escrituras parciales se acumularon
// entre una sincronización y otra, siempre se manda la versión más
// reciente. `upsert` usa el mismo `id` como llave, así reintentar un envío
// nunca duplica una fila.
const handlers: Record<string, EntityHandler> = {
  category: async (db, sb, id) => {
    const row = await db.categories.get(id);
    if (row) await sb.from("categories").upsert(row).throwOnError();
  },
  product: async (db, sb, id) => {
    const row = await db.products.get(id);
    if (row) await sb.from("products").upsert(row).throwOnError();
  },
  // Los usuarios (cajeros y su PIN) se quedan solo en el dispositivo donde se
  // crean -- no hay handler "user" a propósito. No es algo que se pidió
  // sincronizar, y evita exponer pin_hash fuera del dispositivo. Un evento
  // "user" en el outbox se descarta silenciosamente como cualquier otro tipo
  // sin handler (ver el bucle de runSync más abajo).
  app_setting: async (db, sb, key) => {
    const row = await db.app_settings.get(key);
    if (row) await sb.from("app_settings").upsert(row).throwOnError();
  },
  order: async (db, sb, id) => {
    const order = await db.orders.get(id);
    if (!order) return;
    await sb.from("orders").upsert(order).throwOnError();

    const items = await db.order_items.where("order_id").equals(id).toArray();
    if (items.length > 0) {
      await sb.from("order_items").upsert(items).throwOnError();
    }

    const itemIds = items.map((i) => i.id);
    const modifiers = itemIds.length
      ? await db.order_item_modifiers.where("order_item_id").anyOf(itemIds).toArray()
      : [];
    if (modifiers.length > 0) {
      await sb.from("order_item_modifiers").upsert(modifiers).throwOnError();
    }
  },
  image: async (db, sb, id) => {
    const row = await db.images.get(id);
    if (!row) return;
    const { error } = await sb.storage
      .from("images")
      .upload(id, row.blob, { upsert: true, contentType: row.blob.type });
    if (error) throw error;
  },
};

export interface SyncResult {
  ran: boolean;
  pushed: number;
  failed: number;
}

// Recorre la cola de outbox_events pendientes (synced_at vacío) y empuja
// cada entidad afectada a Supabase. No bloquea ni retrasa nada de la
// operación local -- si falla (sin internet, Supabase caído, etc.) los
// eventos se quedan pendientes con el error anotado y se reintentan en la
// siguiente pasada.
export async function runSync(db: PosDatabase): Promise<SyncResult> {
  const supabase = getSupabase();
  if (!supabase || !navigator.onLine) {
    return { ran: false, pushed: 0, failed: 0 };
  }

  const pending = (await db.outbox_events.toArray()).filter((e) => !e.synced_at);
  if (pending.length === 0) {
    return { ran: true, pushed: 0, failed: 0 };
  }

  // Dedupe: si el mismo producto/orden/etc. se editó varias veces antes de
  // que corriera la sincronización, basta con empujar su estado una vez.
  const byEntity = new Map<string, typeof pending>();
  for (const event of pending) {
    const key = `${event.entity_type}:${event.entity_id}`;
    const list = byEntity.get(key) ?? [];
    list.push(event);
    byEntity.set(key, list);
  }

  const now = new Date().toISOString();
  let pushed = 0;
  let failed = 0;

  for (const [, events] of byEntity) {
    const { entity_type: entityType, entity_id: entityId } = events[0];
    const handler = handlers[entityType];
    if (!handler) {
      // Tipo de entidad sin handler de sync todavía (ej. modifiers, si se
      // agregan a futuro): se descarta silenciosamente, no bloquea la cola.
      await Promise.all(events.map((e) => db.outbox_events.update(e.id, { synced_at: now })));
      continue;
    }

    try {
      await handler(db, supabase, entityId);
      await Promise.all(events.map((e) => db.outbox_events.update(e.id, { synced_at: now })));
      pushed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await Promise.all(
        events.map((e) =>
          db.outbox_events.update(e.id, {
            attempts: e.attempts + 1,
            last_error: message,
          }),
        ),
      );
      failed += 1;
    }
  }

  return { ran: true, pushed, failed };
}

export async function countPendingSync(db: PosDatabase): Promise<number> {
  const rows = await db.outbox_events.toArray();
  return rows.filter((e) => !e.synced_at).length;
}

export interface CatalogSyncResult {
  ran: boolean;
  mode: "bootstrap" | "pull" | "none";
}

// Mantiene el catálogo (categorías, productos, ajustes de marca e imágenes)
// igual en todos los dispositivos, usando Supabase como fuente compartida:
//
// - Primera vez que se activa el respaldo (Supabase todavía sin catálogo):
//   sube el catálogo local completo tal cual está en este dispositivo --
//   necesario porque el seed original y las ediciones hechas antes de esta
//   función nunca generaron outbox_events (ver seedIfEmpty en ../db/seed.ts).
// - Cualquier otra vez: Supabase manda -- pisa (bulkPut) categorías,
//   productos y app_settings locales con lo que haya remoto. No usa
//   writeOutboxEvent porque esto es una lectura, no un cambio de negocio
//   hecho en este dispositivo: si el device de origen sigue empujando su
//   propia copia, entrarían en un ciclo de ida y vuelta innecesario.
//
// Nunca lanza si Supabase está caído/sin internet -- un dispositivo debe
// poder seguir vendiendo con el catálogo que ya tenía en caché aunque falle
// la sincronización.
export async function syncCatalog(db: PosDatabase): Promise<CatalogSyncResult> {
  const supabase = getSupabase();
  if (!supabase || !navigator.onLine) return { ran: false, mode: "none" };

  try {
    const [{ data: remoteCategories }, { data: remoteProducts }, { data: remoteSettings }] =
      await Promise.all([
        supabase.from("categories").select("*").throwOnError(),
        supabase.from("products").select("*").throwOnError(),
        supabase.from("app_settings").select("*").throwOnError(),
      ]);

    const remoteIsEmpty =
      (remoteCategories?.length ?? 0) === 0 && (remoteProducts?.length ?? 0) === 0;

    if (remoteIsEmpty) {
      const [localCategories, localProducts, localSettings] = await Promise.all([
        db.categories.toArray(),
        db.products.toArray(),
        db.app_settings.toArray(),
      ]);
      if (localCategories.length) {
        await supabase.from("categories").upsert(localCategories).throwOnError();
      }
      if (localProducts.length) {
        await supabase.from("products").upsert(localProducts).throwOnError();
      }
      if (localSettings.length) {
        await supabase.from("app_settings").upsert(localSettings).throwOnError();
      }
      await pullMissingImages(db, supabase);
      return { ran: true, mode: "bootstrap" };
    }

    await Promise.all([
      remoteCategories?.length ? db.categories.bulkPut(remoteCategories) : Promise.resolve(),
      remoteProducts?.length ? db.products.bulkPut(remoteProducts) : Promise.resolve(),
      remoteSettings?.length ? db.app_settings.bulkPut(remoteSettings) : Promise.resolve(),
    ]);
    await pullMissingImages(db, supabase);
    return { ran: true, mode: "pull" };
  } catch {
    // Sin internet a mitad de camino, Supabase pausado, etc. -- el
    // dispositivo sigue funcionando con lo que ya tenía en caché local.
    return { ran: false, mode: "none" };
  }
}

// Descarga a la tabla local `images` cualquier foto (de producto o de marca)
// que el catálogo recién sincronizado referencia pero que este dispositivo
// todavía no tiene guardada -- p.ej. la del combo nuevo que agregaste desde
// otra compu.
async function pullMissingImages(
  db: PosDatabase,
  supabase: SupabaseClient,
): Promise<void> {
  const [products, settings] = await Promise.all([
    db.products.toArray(),
    db.app_settings.toArray(),
  ]);

  const brandImageKeys = new Set(["brand_logo_path", "brand_background_image_path"]);
  const neededIds = new Set<string>();
  for (const p of products) if (p.image_path) neededIds.add(p.image_path);
  for (const s of settings) if (brandImageKeys.has(s.key) && s.value) neededIds.add(s.value);

  for (const id of neededIds) {
    const existing = await db.images.get(id);
    if (existing) continue;

    const { data, error } = await supabase.storage.from("images").download(id);
    if (error || !data) continue; // no existe en el bucket todavía, o falló -- no bloquea el resto

    await db.images.put({ id, blob: data, created_at: new Date().toISOString() });
  }
}
