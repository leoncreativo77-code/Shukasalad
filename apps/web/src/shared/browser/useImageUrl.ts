import { useEffect, useState } from "react";
import { getDb } from "../db/client";

// Busca el Blob de una imagen (producto o marca) en la tabla `images` y
// genera un object URL para usarlo en <img src>. Reemplaza a
// convertFileSrc(product.image_path) de la versión desktop.
export function useImageUrl(imageId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageId) {
      setUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      const db = await getDb();
      const record = await db.images.get(imageId);
      if (cancelled || !record) return;
      objectUrl = URL.createObjectURL(record.blob);
      setUrl(objectUrl);
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  return url;
}

// Variante no-hook para código que no es un componente (ver useBranding.ts).
export async function resolveImageUrl(
  imageId: string | null,
): Promise<string | null> {
  if (!imageId) return null;
  const db = await getDb();
  const record = await db.images.get(imageId);
  return record ? URL.createObjectURL(record.blob) : null;
}
