import { useState } from "react";
import { CatalogScreen } from "../catalog/CatalogScreen";
import { UsersScreen } from "./UsersScreen";
import { BrandScreen } from "./BrandScreen";

type AdminTab = "catalogo" | "usuarios" | "marca";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "catalogo", label: "Catálogo" },
  { id: "usuarios", label: "Usuarios" },
  { id: "marca", label: "Marca" },
];

export function AdminScreen() {
  const [tab, setTab] = useState<AdminTab>("catalogo");

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 border-b border-neutral-200 bg-white px-4 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 font-medium ${
              tab === t.id
                ? "bg-neutral-800 text-white"
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "catalogo" && <CatalogScreen />}
        {tab === "usuarios" && <UsersScreen />}
        {tab === "marca" && <BrandScreen />}
      </div>
    </div>
  );
}
