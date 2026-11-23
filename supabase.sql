-- Clasificación del Escape Room EOI. Ejecutar una sola vez en Supabase: SQL Editor > New query > Run.
create table public.scores (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 20),
  secs integer check (secs between 1 and 2100),  -- segundos empleados; vacío (null) = no superado
  created_at timestamptz not null default now()
);
alter table public.scores enable row level security;
-- Cualquiera puede leer la clasificación y añadir su tiempo; nadie puede modificar ni borrar filas desde el juego.
create policy "leer clasificacion" on public.scores for select to anon using (true);
create policy "anadir tiempo" on public.scores for insert to anon with check (true);
grant select, insert on public.scores to anon;
