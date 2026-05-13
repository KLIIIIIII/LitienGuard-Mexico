-- LitienGuard — Tipo de perfil del médico (vertical de práctica).
--
-- Permite separar la UI según especialidad de práctica. Un dentista
-- no debe ver "Diferencial bayesiano ATTR-CM" y un internista no
-- debe ver "Odontograma". El tier sigue siendo ortogonal: el
-- profile_type determina QUÉ se muestra; el tier determina si lo
-- puede USAR.
--
-- IMPORTANTE: ALTER TYPE ADD VALUE no aplica aquí porque es enum
-- nuevo creado en una sola transacción.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_type') then
    create type profile_type as enum (
      'sin_definir',
      'medico_general',
      'dentista',
      'hospital'
    );
  end if;
end$$;
