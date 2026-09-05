import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// El respaldo a servidor es opt-in: si estas variables no están configuradas
// (Netlify > Site settings > Environment variables, o .env.local en
// desarrollo), la app sigue funcionando 100% local/offline exactamente igual
// que antes -- getSupabase() devuelve null y el motor de sync no hace nada.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;
// Encabezado extra validado por las políticas RLS (ver supabase/schema.sql):
// no es un secreto fuerte -- cualquier código que corre en el navegador es
// inspeccionable -- pero filtra a los escáneres automáticos que buscan
// proyectos de Supabase con claves anónimas abiertas al público, que es el
// riesgo real más común para este tipo de respaldo. Mismo nivel de
// protección que el resto de la app (ver pinHash.ts).
const SYNC_SECRET = import.meta.env.VITE_SYNC_SECRET as string | undefined;

let client: SupabaseClient | null | undefined;

export function isSyncConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    client = null;
    return client;
  }

  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: SYNC_SECRET ? { "x-sync-secret": SYNC_SECRET } : {},
    },
    auth: {
      persistSession: false,
    },
  });
  return client;
}
