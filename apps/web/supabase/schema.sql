-- Respaldo de Shuka Salads (apps/web) en Supabase.
-- Corre esto UNA VEZ en tu proyecto de Supabase: Dashboard > SQL Editor >
-- New query > pega todo este archivo > Run.
--
-- Antes de correrlo, reemplaza el texto 'CAMBIA_ESTE_SECRETO_LARGO_Y_UNICO'
-- (aparece dos veces, abajo) por una contraseña larga inventada por ti -- es
-- el mismo valor que vas a poner en la variable de entorno VITE_SYNC_SECRET
-- en Netlify. Sin este secreto, nadie puede escribir en tu base de datos
-- aunque encuentre la URL/clave pública de tu proyecto.

-- ---------------------------------------------------------------------------
-- Función de autorización: valida el encabezado x-sync-secret que manda la
-- app en cada escritura (ver shared/sync/supabaseClient.ts).
-- ---------------------------------------------------------------------------
create or replace function public.has_sync_secret()
returns boolean
language sql
stable
as $$
  select coalesce(
    (current_setting('request.headers', true)::json ->> 'x-sync-secret'),
    ''
  ) = 'CAMBIA_ESTE_SECRETO_LARGO_Y_UNICO';
$$;

-- ---------------------------------------------------------------------------
-- Tablas espejo (mismos campos que las tablas Dexie de apps/web).
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id text primary key,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.products (
  id text primary key,
  category_id text not null,
  name text not null,
  description text,
  price numeric not null,
  sku text,
  active boolean not null default true,
  sort_order integer not null default 0,
  image_path text,
  grid_col integer,
  grid_row integer,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.users (
  id text primary key,
  name text not null,
  pin_hash text not null,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

create table if not exists public.orders (
  id text primary key,
  order_number integer not null,
  cash_session_id text not null,
  user_id text not null,
  order_type text not null,
  table_id text,
  status text not null,
  kitchen_status text not null,
  table_number text,
  customer_name text,
  customer_phone text,
  delivery_address text,
  scheduled_for timestamptz,
  subtotal numeric not null,
  tax_amount numeric not null,
  total numeric not null,
  created_at timestamptz not null,
  paid_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by text,
  cancel_reason text
);

create table if not exists public.order_items (
  id text primary key,
  order_id text not null references public.orders(id),
  product_id text not null,
  product_name_snapshot text not null,
  unit_price_snapshot numeric not null,
  quantity integer not null,
  notes text,
  line_subtotal numeric not null
);

create table if not exists public.order_item_modifiers (
  id text primary key,
  order_item_id text not null references public.order_items(id),
  modifier_id text,
  modifier_name_snapshot text not null,
  price_delta_snapshot numeric not null default 0
);

-- ---------------------------------------------------------------------------
-- RLS: solo inserta/actualiza quien mande el secreto correcto. No hay
-- política de lectura (SELECT) todavía -- este script cubre el respaldo
-- (push), no la restauración (pull); esa se agrega en una siguiente etapa.
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.users enable row level security;
alter table public.app_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_modifiers enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'products', 'users', 'app_settings',
    'orders', 'order_items', 'order_item_modifiers'
  ]
  loop
    execute format(
      'create policy "sync write" on public.%I for insert with check (public.has_sync_secret())',
      t
    );
    execute format(
      'create policy "sync update" on public.%I for update using (public.has_sync_secret()) with check (public.has_sync_secret())',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: bucket "images" para las fotos de producto y de marca (logo,
-- fondo). Créalo desde el Dashboard (Storage > New bucket > nombre "images",
-- privado) antes de correr las políticas de abajo.
-- ---------------------------------------------------------------------------

create policy "sync write images"
on storage.objects for insert
with check (bucket_id = 'images' and public.has_sync_secret());

create policy "sync update images"
on storage.objects for update
using (bucket_id = 'images' and public.has_sync_secret())
with check (bucket_id = 'images' and public.has_sync_secret());
