-- Ajustes editables desde /configuracion (Dirección General).
-- Ejecutar una vez en Supabase → SQL Editor.
--   clave 'direccion' → {"correo": "...", "whatsapp": "521..."}
--   clave 'prestamo'  → {"umbral": 10000, "pctHastaUmbral": 50, "pctArribaUmbral": 40}
--   clave 'festivos'  → [{"fecha": "2026-12-25", "nombre": "Navidad"}, ...]
create table if not exists public.ajustes (
  clave text primary key,
  valor jsonb not null,
  actualizado_en timestamptz not null default now(),
  actualizado_por text
);

-- Solo el servidor (service_role) lee y escribe; RLS cierra el acceso anónimo.
alter table public.ajustes enable row level security;

insert into public.ajustes (clave, valor) values
  ('direccion', '{"correo": "josecruzgs@outlook.com", "whatsapp": "5216861571095"}'),
  ('prestamo',  '{"umbral": 10000, "pctHastaUmbral": 50, "pctArribaUmbral": 40}'),
  ('festivos',  '[]')
on conflict (clave) do nothing;

-- Nuevo tipo de resguardo "Bodega" (además de Matriz y Externa).
-- Si la columna prendas.resguardo_tipo tiene un CHECK que solo acepta
-- Matriz/Externa, se reemplaza por uno que también acepte Bodega.
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    where rel.relname = 'prendas' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%resguardo_tipo%'
  loop
    execute format('alter table public.prendas drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.prendas drop constraint if exists prendas_resguardo_tipo_check;
alter table public.prendas add constraint prendas_resguardo_tipo_check
  check (resguardo_tipo is null or resguardo_tipo in ('Matriz', 'Bodega', 'Externa'));
