import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getDb } from "../db/client";
import { getSetting } from "../db/repositories/appSettings";

export interface Branding {
  logoSrc: string | null;
}

// Aplica logo/color/fondo guardados en app_settings (ver BrandScreen) al
// montar la app. Los valores por defecto (declarados como fallback en
// index.css) hacen que nada cambie visualmente hasta que un admin configure
// algo desde Admin > Marca.
export function useBranding(): Branding {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const db = await getDb();
      const [primaryColor, logoPath, backgroundColor, backgroundImagePath] =
        await Promise.all([
          getSetting(db, "brand_primary_color"),
          getSetting(db, "brand_logo_path"),
          getSetting(db, "brand_background_color"),
          getSetting(db, "brand_background_image_path"),
        ]);

      if (cancelled) return;

      const root = document.documentElement;
      if (primaryColor) root.style.setProperty("--brand-primary", primaryColor);
      if (backgroundColor)
        root.style.setProperty("--brand-background", backgroundColor);

      // La imagen de fondo se aplica sobre <body> (mismo elemento que ya
      // trae el color vía --brand-background en index.css), así una tiene
      // prioridad visual clara sobre la otra sin pelear por capas/z-index.
      document.body.style.backgroundImage = backgroundImagePath
        ? `url("${convertFileSrc(backgroundImagePath)}")`
        : "";

      setLogoSrc(logoPath ? convertFileSrc(logoPath) : null);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { logoSrc };
}
