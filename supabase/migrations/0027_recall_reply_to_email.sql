-- LitienGuard — Reply-to configurable por médico para correos a pacientes.
--
-- Por default, los recordatorios a pacientes (recall manual y futuro
-- automático) salen del dominio de envío de LitienGuard. El paciente
-- ve el nombre del médico como sender name, pero el From técnico es
-- siempre el dominio verificado de la plataforma.
--
-- Algunos médicos prefieren que las respuestas del paciente lleguen
-- a un correo distinto al que usan para entrar al sistema. Por
-- ejemplo: se loguean con su correo personal pero quieren que los
-- pacientes contesten al correo del consultorio (recepcion@,
-- contacto@, etc.).
--
-- Esta columna es OPCIONAL:
--   NULL → reply-to = email de login del médico (default)
--   string → reply-to = ese correo

alter table public.profiles
  add column if not exists recall_reply_to_email text;

-- Validación de formato (solo cuando esté presente)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_recall_reply_to_email_format'
  ) then
    alter table public.profiles
      add constraint profiles_recall_reply_to_email_format
      check (
        recall_reply_to_email is null
        or recall_reply_to_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
      );
  end if;
end$$;

comment on column public.profiles.recall_reply_to_email is
  'Correo opcional al que se enviarán las respuestas de los pacientes a recordatorios. Si NULL, se usa el email de login del médico (profiles.email).';
