import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../shared/auth/store";
import { useBranding } from "../shared/branding/useBranding";
import { useSyncStatus } from "../shared/sync/useSyncStatus";

const TAB_CLASSES =
  "flex items-center rounded-lg px-5 py-2 text-lg font-semibold transition-colors";

function tabClassName(isActive: boolean) {
  return `${TAB_CLASSES} ${isActive ? "bg-[var(--brand-primary)] text-white" : "text-neutral-600 hover:bg-neutral-100"}`;
}

const SYNC_LABEL: Record<string, string> = {
  offline: "Sin conexión",
  syncing: "Respaldando…",
  synced: "Respaldado",
  pending: "Respaldo pendiente",
  error: "Error de respaldo",
};

const SYNC_DOT_CLASSES: Record<string, string> = {
  offline: "bg-neutral-400",
  syncing: "bg-amber-500 animate-pulse",
  synced: "bg-green-500",
  pending: "bg-amber-500",
  error: "bg-red-500",
};

// Punto + etiqueta discretos: solo se muestran si el respaldo a servidor
// está configurado (ver shared/sync/supabaseClient.ts) -- si no, la app no
// dice nada al respecto, igual que antes de que existiera esta función.
function SyncIndicator() {
  const { status, pendingCount } = useSyncStatus();
  if (status === "disabled") return null;

  return (
    <span className="flex items-center gap-1.5 text-sm text-neutral-500">
      <span className={`h-2 w-2 rounded-full ${SYNC_DOT_CLASSES[status]}`} />
      {SYNC_LABEL[status]}
      {(status === "pending" || status === "offline") && pendingCount > 0
        ? ` (${pendingCount})`
        : ""}
    </span>
  );
}

export function AppShell() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const { logoSrc } = useBranding();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          {logoSrc && (
            <img src={logoSrc} alt="Logo" className="h-9 w-9 rounded object-contain" />
          )}
          <nav className="flex gap-2">
            <NavLink to="/venta" className={({ isActive }) => tabClassName(isActive)}>
              Venta
            </NavLink>
            <NavLink to="/pedidos" className={({ isActive }) => tabClassName(isActive)}>
              Pedidos
            </NavLink>
            <NavLink to="/cocina" className={({ isActive }) => tabClassName(isActive)}>
              Cocina
            </NavLink>
            {currentUser?.role === "admin" && (
              <NavLink to="/admin" className={({ isActive }) => tabClassName(isActive)}>
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <SyncIndicator />
          <span className="text-neutral-600">{currentUser?.name}</span>
          <button
            onClick={logout}
            className="rounded-lg px-4 py-2 text-neutral-500 hover:bg-neutral-100"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
