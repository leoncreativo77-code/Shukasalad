import { useState } from "react";
import type { Category } from "@pos/shared-types";
import { TouchButton } from "../../shared/components/TouchButton";

interface CategoryPanelProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
}

export function CategoryPanel({
  categories,
  selectedId,
  onSelect,
  onCreate,
  onToggleActive,
  onReorder,
}: CategoryPanelProps) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = categories.map((c) => c.id);
    const fromIndex = ids.indexOf(dragId);
    const toIndex = ids.indexOf(targetId);
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, dragId);
    setDragId(null);
    onReorder(ids);
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await onCreate(name);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex h-full w-72 flex-col border-r border-neutral-200 bg-white">
      <h2 className="border-b border-neutral-200 px-4 py-3 font-semibold text-neutral-700">
        Categorías
      </h2>

      <ul className="flex-1 overflow-y-auto">
        {categories.map((cat) => (
          <li
            key={cat.id}
            draggable
            onDragStart={() => setDragId(cat.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(cat.id)}
            className={dragId === cat.id ? "opacity-50" : ""}
          >
            <button
              onClick={() => onSelect(cat.id)}
              className={`flex w-full cursor-move items-center justify-between px-4 py-3 text-left ${
                selectedId === cat.id
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-neutral-50"
              } ${cat.active ? "" : "opacity-40"}`}
            >
              <span>⠿ {cat.name}</span>
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive(cat.id, !cat.active);
                }}
                className="rounded px-2 py-1 text-xs font-medium text-neutral-400 hover:bg-neutral-200"
              >
                {cat.active ? "Desactivar" : "Activar"}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 border-t border-neutral-200 p-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nueva categoría"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2"
        />
        <TouchButton
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="min-h-0 px-4 py-2 text-base"
        >
          +
        </TouchButton>
      </div>
    </div>
  );
}
