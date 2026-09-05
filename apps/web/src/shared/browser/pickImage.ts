import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/client";
import { writeOutboxEvent } from "../db/outbox";

// Equivalente web de shared/tauri/pickAndCopyImage.ts: abre el selector de
// archivos nativo del navegador (<input type="file"> oculto) y, si el
// usuario elige una imagen, la guarda como Blob en la tabla `images` de
// Dexie. Devuelve el `id` del Blob (para guardar en Product.image_path o en
// app_settings de marca) o null si el usuario canceló.
//
// `subdir` se conserva en la firma solo para minimizar el diff frente a la
// versión de desktop en los call sites -- en la web no hay carpetas, el Blob
// vive en una sola tabla.
export function pickImage(
  _subdir: "product-images" | "brand",
): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const db = await getDb();
      const id = uuidv4();
      const created_at = new Date().toISOString();
      await db.images.add({ id, blob: file, created_at });
      // El respaldo a servidor (ver shared/sync) sube el Blob a Supabase
      // Storage cuando encuentre este evento en la cola.
      await writeOutboxEvent(db, "image", id, "insert", { id, created_at });
      resolve(id);
    };
    // Soporte best-effort: no todos los navegadores emiten "cancel" en
    // <input type="file">, pero cuando lo hacen evita dejar la promesa
    // colgada si el usuario cierra el selector sin elegir nada.
    input.oncancel = () => resolve(null);

    input.click();
  });
}
