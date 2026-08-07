import { create } from "zustand";
import type { CashSession, User } from "@pos/shared-types";

interface AuthState {
  currentUser: User | null;
  cashSession: CashSession | null;
  login: (user: User, cashSession: CashSession) => void;
  logout: () => void;
}

// Sesión de la terminal: quién es el cajero logueado y en qué sesión de caja
// está trabajando. Vive en memoria (no persiste entre reinicios) a propósito
// -- cerrar la app equivale a cerrar sesión, evita que quede una caja
// desatendida y logueada.
export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  cashSession: null,
  login: (user, cashSession) => set({ currentUser: user, cashSession }),
  logout: () => set({ currentUser: null, cashSession: null }),
}));
