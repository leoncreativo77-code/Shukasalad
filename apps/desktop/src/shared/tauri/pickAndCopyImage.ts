import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

// Abre el selector nativo de archivos y, si el usuario elige una imagen, la
// copia dentro del directorio de datos de la app (comando Rust
// copy_app_asset) bajo la subcarpeta indicada. Devuelve la ruta absoluta ya
// copiada (para guardar en SQLite) o null si el usuario canceló.
export async function pickAndCopyImage(
  subdir: "product-images" | "brand",
): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Imagen", extensions: ["png", "jpg", "jpeg", "webp"] }],
  });

  if (!selected || Array.isArray(selected)) return null;

  return invoke<string>("copy_app_asset", { src: selected, subdir });
}
