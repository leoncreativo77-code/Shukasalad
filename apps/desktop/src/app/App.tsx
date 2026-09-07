import type { ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "../shared/auth/store";
import { useBranding } from "../shared/branding/useBranding";
import { LoginScreen } from "../modules/auth/LoginScreen";
import { SalesScreen } from "../modules/sales/SalesScreen";
import { IntakeScreen } from "../modules/order-intake/IntakeScreen";
import { KitchenScreen } from "../modules/kitchen/KitchenScreen";
import { AdminScreen } from "../modules/admin/AdminScreen";
import { AppShell } from "./AppShell";

// Defensa además de ocultar la pestaña Admin en AppShell -- si alguien
// navega directo a #/admin sin ser admin (o deja de serlo), lo regresa a
// Venta en vez de mostrar la pantalla.
function RequireAdmin({ children }: { children: ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  if (currentUser?.role !== "admin") {
    return <Navigate to="/venta" replace />;
  }
  return <>{children}</>;
}

export function App() {
  const currentUser = useAuthStore((s) => s.currentUser);
  // Se llama aquí (y no solo dentro de AppShell) para que el fondo/color de
  // marca también se vea en la pantalla de login, antes de autenticarse.
  useBranding();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/venta" element={<SalesScreen />} />
          <Route path="/pedidos" element={<IntakeScreen />} />
          <Route path="/cocina" element={<KitchenScreen />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminScreen />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/venta" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
