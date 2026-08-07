import { useEffect, useState } from "react";
import { getDb } from "../../shared/db/client";
import {
  clearSetting,
  getSetting,
  setSetting,
} from "../../shared/db/repositories/appSettings";
import { pickImage } from "../../shared/browser/pickImage";
import { useImageUrl } from "../../shared/browser/useImageUrl";
import { TouchButton } from "../../shared/components/TouchButton";

const DEFAULT_PRIMARY = "#2563eb";
const DEFAULT_BACKGROUND = "#f5f5f5";

export function BrandScreen() {
  const [logoImageId, setLogoImageId] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [backgroundImageId, setBackgroundImageId] = useState<string | null>(
    null,
  );

  const logoUrl = useImageUrl(logoImageId);
  const backgroundUrl = useImageUrl(backgroundImageId);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const [logo, primary, bgColor, bgImage] = await Promise.all([
        getSetting(db, "brand_logo_path"),
        getSetting(db, "brand_primary_color"),
        getSetting(db, "brand_background_color"),
        getSetting(db, "brand_background_image_path"),
      ]);
      setLogoImageId(logo);
      setPrimaryColor(primary ?? DEFAULT_PRIMARY);
      setBackgroundColor(bgColor ?? DEFAULT_BACKGROUND);
      setBackgroundImageId(bgImage);
    })();
  }, []);

  // Mantiene el fondo de <body> sincronizado con la imagen de marca elegida
  // (misma prioridad visual que en desktop: imagen por encima del color).
  useEffect(() => {
    document.body.style.backgroundImage = backgroundUrl
      ? `url("${backgroundUrl}")`
      : "";
  }, [backgroundUrl]);

  async function handleUploadLogo() {
    const imageId = await pickImage("brand");
    if (!imageId) return;
    const db = await getDb();
    await setSetting(db, "brand_logo_path", imageId);
    setLogoImageId(imageId);
  }

  async function handlePrimaryColorChange(color: string) {
    setPrimaryColor(color);
    const db = await getDb();
    await setSetting(db, "brand_primary_color", color);
    document.documentElement.style.setProperty("--brand-primary", color);
  }

  async function handleBackgroundColorChange(color: string) {
    setBackgroundColor(color);
    const db = await getDb();
    await setSetting(db, "brand_background_color", color);
    document.documentElement.style.setProperty("--brand-background", color);
  }

  async function handleUploadBackgroundImage() {
    const imageId = await pickImage("brand");
    if (!imageId) return;
    const db = await getDb();
    await setSetting(db, "brand_background_image_path", imageId);
    setBackgroundImageId(imageId);
  }

  async function handleClearBackgroundImage() {
    const db = await getDb();
    await clearSetting(db, "brand_background_image_path");
    setBackgroundImageId(null);
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="mb-6 text-xl font-semibold text-neutral-800">Marca</h2>

      <div className="max-w-lg space-y-8">
        <section>
          <h3 className="mb-2 font-medium text-neutral-700">Logo</h3>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-full rounded-xl object-contain"
                />
              ) : (
                <span className="text-xs text-neutral-400">Sin logo</span>
              )}
            </div>
            <TouchButton
              variant="secondary"
              className="min-h-0 px-4 py-2 text-base"
              onClick={handleUploadLogo}
            >
              Subir logo
            </TouchButton>
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-medium text-neutral-700">Color principal</h3>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => handlePrimaryColorChange(e.target.value)}
              className="h-12 w-16 cursor-pointer rounded-lg border border-neutral-300"
            />
            <span className="text-neutral-500">{primaryColor}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Se usa en los botones principales y la pestaña activa.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-medium text-neutral-700">Fondo</h3>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              disabled={!!backgroundImageId}
              className="h-12 w-16 cursor-pointer rounded-lg border border-neutral-300 disabled:cursor-not-allowed disabled:opacity-40"
            />
            <span className="text-neutral-500">
              {backgroundImageId ? "Usando imagen de fondo" : backgroundColor}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <TouchButton
              variant="secondary"
              className="min-h-0 px-4 py-2 text-base"
              onClick={handleUploadBackgroundImage}
            >
              Subir imagen de fondo
            </TouchButton>
            {backgroundImageId && (
              <TouchButton
                variant="ghost"
                className="min-h-0 px-4 py-2 text-base"
                onClick={handleClearBackgroundImage}
              >
                Quitar imagen
              </TouchButton>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Si subes una imagen, tiene prioridad sobre el color.
          </p>
        </section>
      </div>
    </div>
  );
}
