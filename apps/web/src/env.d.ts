/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Respaldo a servidor (opcional -- ver shared/sync/supabaseClient.ts).
  // Sin estas variables la app sigue funcionando 100% local/offline.
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SYNC_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
