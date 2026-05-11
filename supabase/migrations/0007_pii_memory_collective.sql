-- LitienGuard — Patient PII fields, doctor memory tagging, collective cerebro
-- Adds the schema for: full patient name, doctor opt-in to share notes with
-- the collective cerebro, and source-type distinction in cerebro_chunks.

-- 1) PII fields on notas_scribe (optional — physician decides per note)
alter table public.notas_scribe
  add column if not exists paciente_nombre text,
  add column if not exists paciente_apellido_paterno text,
  add column if not exists paciente_apellido_materno text;

-- 2) Doctor opt-in flag for sharing notes with collective cerebro
alter table public.profiles
  add column if not exists share_with_collective boolean not null default false;

-- 3) Cerebro chunks now carry a tipo so the model and the UI can tell
--    academic guidelines apart from observed-practice notes
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'cerebro_chunk_tipo'
  ) then
    create type cerebro_chunk_tipo as enum (
      'evidencia_academica',
      'practica_observada'
    );
  end if;
end$$;

alter table public.cerebro_chunks
  add column if not exists tipo cerebro_chunk_tipo not null default 'evidencia_academica';

-- The optional source_nota_id lets us track which observed-practice chunk
-- came from which scribe note. Null for academic chunks.
alter table public.cerebro_chunks
  add column if not exists source_nota_id uuid references public.notas_scribe(id) on delete set null;

create index if not exists cerebro_chunks_tipo_idx on public.cerebro_chunks(tipo);

-- 4) When a note is signed AND the doctor opted in, we materialize an
--    anonymized chunk into cerebro_chunks. Anonymization: only soap_analisis
--    + soap_plan, age rounded to decade, no name or initials, no sex if it
--    is the only differentiator. We add a trigger that ONLY fires on the
--    'firmada' transition so borrador updates do not flood the cerebro.

create or replace function public.sync_nota_to_practica()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  doctor_opts_in boolean;
  rounded_age int;
  combined_content text;
  chunk_id_value text;
  short_title text;
begin
  -- Only act on transition into 'firmada'
  if new.status is distinct from 'firmada' or
     (tg_op = 'UPDATE' and old.status = 'firmada') then
    return new;
  end if;

  -- Check doctor opt-in
  select share_with_collective into doctor_opts_in
  from public.profiles
  where id = new.medico_id;

  if doctor_opts_in is not true then
    return new;
  end if;

  -- Skip if note has no useful content
  if coalesce(new.soap_analisis, '') = '' and coalesce(new.soap_plan, '') = '' then
    return new;
  end if;

  -- Round age to decade
  rounded_age := case
    when new.paciente_edad is null then null
    else (new.paciente_edad / 10) * 10
  end;

  combined_content :=
    coalesce(new.soap_analisis, '') ||
    case when new.soap_plan is not null and new.soap_plan <> ''
      then E'\n\nPlan observado: ' || new.soap_plan
      else ''
    end ||
    case when rounded_age is not null
      then E'\n\nPaciente: ' || rounded_age || 's' ||
        case when new.paciente_sexo is not null
          then ' · ' || new.paciente_sexo
          else ''
        end
      else ''
    end;

  chunk_id_value := 'practica-' || replace(new.id::text, '-', '');
  short_title :=
    case
      when length(coalesce(new.soap_analisis, '')) > 0
        then substr(new.soap_analisis, 1, 80)
      else 'Práctica clínica observada'
    end;

  -- Upsert so re-firmando una nota actualiza el chunk en lugar de duplicarlo
  insert into public.cerebro_chunks (
    id, source, page, title, content, meta, tipo, source_nota_id,
    is_active, created_by, updated_by
  ) values (
    chunk_id_value,
    'LitienGuard · práctica observada',
    'red',
    short_title,
    combined_content,
    jsonb_build_object(
      'edad_decada', rounded_age,
      'sexo', new.paciente_sexo,
      'creado_de_nota', new.id::text
    ),
    'practica_observada',
    new.id,
    true,
    new.medico_id,
    new.medico_id
  )
  on conflict (id) do update set
    title = excluded.title,
    content = excluded.content,
    meta = excluded.meta,
    updated_by = excluded.updated_by;

  return new;
end;
$$;

drop trigger if exists notas_scribe_sync_practica on public.notas_scribe;
create trigger notas_scribe_sync_practica
  after insert or update on public.notas_scribe
  for each row execute function public.sync_nota_to_practica();

-- 5) When a doctor disables sharing OR deletes the underlying note, the
--    practice chunk should be removed. ON DELETE on notas_scribe already
--    nullifies source_nota_id via FK, so we add a cleanup trigger for the
--    opt-out case.

create or replace function public.cleanup_practica_on_optout()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.share_with_collective = false and old.share_with_collective = true then
    delete from public.cerebro_chunks
    where tipo = 'practica_observada'
      and created_by = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_cleanup_practica on public.profiles;
create trigger profiles_cleanup_practica
  after update on public.profiles
  for each row execute function public.cleanup_practica_on_optout();
