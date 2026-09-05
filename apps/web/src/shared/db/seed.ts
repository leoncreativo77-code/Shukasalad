import type { PosDatabase } from "./client";

const NOW = "2026-01-01T00:00:00.000Z";

// Catálogo real de Shuka Salads. Cajero demo, PIN 1234 (SHA-256, ver
// shared/auth/pinHash.ts). Tasa de IVA 16% (México). Una cash_session
// abierta de prueba: el flujo real de apertura de caja se construye en la
// siguiente etapa.
export async function seedIfEmpty(db: PosDatabase): Promise<void> {
  const userCount = await db.users.count();
  if (userCount > 0) return;

  await db.users.add({
    id: "1685762f-b276-4057-939e-8d7a066d6860",
    name: "Cajero Demo",
    pin_hash:
      "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
    role: "admin",
    active: true,
    created_at: NOW,
    updated_at: NOW,
  });

  await db.tax_rates.add({
    id: "e12790d0-c495-41bc-8965-5f21f41374dd",
    name: "IVA",
    rate: 0.16,
    is_default: true,
    active: true,
  });

  const categories = [
    { id: "b1a1c2d3-0001-4a11-9c11-000000000001", name: "Paquetes", sort_order: 1 },
    { id: "b1a1c2d3-0001-4a11-9c11-000000000002", name: "Ensaladas", sort_order: 2 },
    { id: "b1a1c2d3-0001-4a11-9c11-000000000003", name: "Panes", sort_order: 3 },
    { id: "b1a1c2d3-0001-4a11-9c11-000000000005", name: "Papas", sort_order: 4 },
    { id: "b1a1c2d3-0001-4a11-9c11-000000000006", name: "Boneless", sort_order: 5 },
    { id: "b1a1c2d3-0001-4a11-9c11-000000000004", name: "Bebidas", sort_order: 6 },
  ];
  await db.categories.bulkAdd(
    categories.map((c) => ({
      ...c,
      active: true,
      created_at: NOW,
      updated_at: NOW,
    })),
  );

  const products = [
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000001",
      category_id: categories[0].id,
      name: "Paquete 1",
      description:
        "Ensalada Jumbo + Baguette + 1 Litro de Té · 5 ingredientes a elegir, 2 proteínas, 3 aderezos a elegir",
      price: 260.0,
      sku: "PAQ-001",
      sort_order: 1,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000002",
      category_id: categories[0].id,
      name: "Paquete 2",
      description:
        "Ensalada Mediana + ½ Baguette + ½ Litro de Té · 4 ingredientes a elegir, 2 proteínas, 2 aderezos a elegir",
      price: 180.0,
      sku: "PAQ-002",
      sort_order: 2,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000003",
      category_id: categories[0].id,
      name: "Paquete 3",
      description:
        "Ensalada Chica + ½ Baguette + ½ Litro de Té · 3 ingredientes a elegir, 1 proteína, 1 aderezo a elegir",
      price: 150.0,
      sku: "PAQ-003",
      sort_order: 3,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000004",
      category_id: categories[1].id,
      name: "Ensalada Jumbo",
      description: null,
      price: 220.0,
      sku: "ENS-001",
      sort_order: 1,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000005",
      category_id: categories[1].id,
      name: "Ensalada Mediana",
      description: null,
      price: 180.0,
      sku: "ENS-002",
      sort_order: 2,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000006",
      category_id: categories[1].id,
      name: "Ensalada Chica",
      description: null,
      price: 130.0,
      sku: "ENS-003",
      sort_order: 3,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000007",
      category_id: categories[2].id,
      name: "Baguette",
      description: null,
      price: 85.0,
      sku: "PAN-001",
      sort_order: 1,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000008",
      category_id: categories[2].id,
      name: "Croissant",
      description: null,
      price: 85.0,
      sku: "PAN-002",
      sort_order: 2,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000011",
      category_id: categories[3].id,
      name: "Orden",
      description: "Papas fritas",
      price: 75.0,
      sku: "PAP-001",
      sort_order: 1,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000012",
      category_id: categories[4].id,
      name: "Orden con papas",
      description: null,
      price: 120.0,
      sku: "BON-001",
      sort_order: 1,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000013",
      category_id: categories[5].id,
      name: "Té 500 ml",
      description: null,
      price: 30.0,
      sku: "BEB-003",
      sort_order: 1,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000014",
      category_id: categories[5].id,
      name: "Té 1 Litro",
      description: null,
      price: 35.0,
      sku: "BEB-004",
      sort_order: 2,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000009",
      category_id: categories[5].id,
      name: "Agua 500 ml",
      description: null,
      price: 25.0,
      sku: "BEB-001",
      sort_order: 3,
    },
    {
      id: "b1a1c2d3-0002-4a11-9c11-000000000010",
      category_id: categories[5].id,
      name: "Agua 1 Litro",
      description: null,
      price: 35.0,
      sku: "BEB-002",
      sort_order: 4,
    },
  ];
  await db.products.bulkAdd(
    products.map((p) => ({
      ...p,
      active: true,
      image_path: null,
      grid_col: null,
      grid_row: null,
      created_at: NOW,
      updated_at: NOW,
    })),
  );

  await db.cash_sessions.add({
    id: "33c985b2-1c11-4b96-915c-da56d43f8bc4",
    opened_by: "1685762f-b276-4057-939e-8d7a066d6860",
    opening_amount: 1000.0,
    opening_at: NOW,
    closed_by: null,
    closing_amount: null,
    expected_amount: null,
    difference: null,
    closing_at: null,
    status: "open",
    notes:
      "Sesión de prueba — el flujo real de apertura de caja se agrega en la siguiente etapa",
  });
}
