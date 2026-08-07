import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Sin esto, la app no arranca si se abre sin internet: precachea todo
      // lo necesario para render (JS/CSS/HTML) en la primera visita.
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
      },
      manifest: {
        name: "POS Restaurante",
        short_name: "POS Restaurante",
        description: "Punto de venta para restaurante — funciona sin internet.",
        theme_color: "#2563eb",
        background_color: "#f5f5f5",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/32x32.png", sizes: "32x32", type: "image/png" },
          { src: "icons/128x128.png", sizes: "128x128", type: "image/png" },
          { src: "icons/128x128@2x.png", sizes: "256x256", type: "image/png" },
          {
            src: "icons/icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],

  server: {
    port: 1421,
  },
});
