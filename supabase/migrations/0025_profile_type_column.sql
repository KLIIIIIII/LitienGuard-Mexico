-- LitienGuard — Columna profile_type + audit log trigger en tier changes.
--
-- Esta migración requiere que 0024_profile_type_enum.sql haya
-- corrido antes (crea el enum). Si se aplican juntas en la misma
-- transacción, PostgreSQL rechaza el uso del enum recién creado.

alter table public.profiles
  add column if not exists profile_type profile_type not null
    default 'sin_definir';

create index if not exists profiles_profile_type_idx
  on public.profiles(profile_type)
  where profile_type <> 'sin_definir';

-- Helper: ¿está pendiente el onboarding de perfil?
create or replace function public.profile_needs_onboarding()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select profile_type = 'sin_definir'
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

-- ============================================================
-- Audit log automático de cambios de subscription_tier
-- ============================================================
-- Cualquier UPDATE que cambie subscription_tier queda registrado
-- en public.audit_log con detalle del cambio. Esto cubre cambios
-- desde:
--   - /admin/invitaciones (updateInvitationTier)
--   - Stripe webhook (al activar/cancelar suscripción)
--   - Cualquier UPDATE directo en SQL Editor

create or replace function public.audit_subscription_tier_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid;
begin
  -- Solo registrar cuando realmente cambia el tier
  if new.subscription_tier is distinct from old.subscription_tier then
    -- auth.uid() puede ser NULL en triggers de webhook/service role
    acting_user_id := auth.uid();
    insert into public.audit_log (
      user_id, action, resource, metadata
    )
    values (
      coalesce(acting_user_id, new.id),
      'tier.changed',
      'profile:' || new.id::text,
      jsonb_build_object(
        'from', old.subscription_tier::text,
        'to', new.subscription_tier::text,
        'target_user_id', new.id,
        'target_email', new.email,
        'acting_user_id', acting_user_id,
        'changed_via', case
          when acting_user_id is null then 'service_role_or_webhook'
          when acting_user_id = new.id then 'self_change'
          else 'admin_change'
        end
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_audit_tier_change on public.profiles;
create trigger profiles_audit_tier_change
  after update of subscription_tier on public.profiles
  for each row execute function public.audit_subscription_tier_change();

comment on function public.audit_subscription_tier_change is
  'Trigger que registra automáticamente en audit_log cada cambio de subscription_tier en profiles. Garantía de trazabilidad incluso si una server action olvida llamar recordAudit().';

-- ============================================================
-- Cooldown de recall: 30 días entre recordatorios al mismo paciente
-- ============================================================
-- Function que un server action puede consultar para saber si
-- puede mandar otro recall a un paciente.

create or replace function public.can_send_recall_to(p_paciente_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  last_at timestamptz;
begin
  select recall_enviado_at into last_at
  from public.pacientes
  where id = p_paciente_id
    and medico_id = auth.uid();

  if last_at is null then
    return true;
  end if;
  return last_at < now() - interval '30 days';
end;
$$;

comment on function public.can_send_recall_to is
  'Check de cooldown. Devuelve true si el médico autenticado puede enviar otro recall al paciente (nunca enviado, o el último fue hace > 30 días). El server action debe llamarlo antes de enviar.';
