-- Migration 0019 — sistema de referidos para founder-led growth
-- Cada usuario obtiene un código único. Cuando un nuevo usuario se
-- registra usando ese código (URL ?ref=CODE), se crea fila en `referrals`
-- vinculando referente y referido. Admin aprueba manualmente cuando el
-- referido alcanza estado paid en Stripe (Fase 1) — la automatización
-- vendrá en Fase 1.5 cuando justifique el código.

-- 1) Codigo de referido en profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON profiles(referred_by);

-- 2) Tabla de referidos
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'qualified', 'rewarded', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_code_idx ON referrals(code);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals(status);

-- 3) RLS — el usuario solo ve sus propios referidos
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY referrals_owner_read ON referrals
  FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY referrals_admin_all ON referrals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 4) Función para generar código único de referido
-- Formato: LG-{6 chars alphanumeric}, ej LG-7H3K9P
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  candidate TEXT;
  attempts INTEGER := 0;
  max_attempts CONSTANT INTEGER := 10;
BEGIN
  LOOP
    candidate := 'LG-' || upper(
      substring(
        encode(extensions.gen_random_bytes(6), 'base64')
        FROM 1 FOR 6
      )
    );
    -- strip non-alphanumeric just in case
    candidate := regexp_replace(candidate, '[^A-Z0-9-]', '', 'g');
    -- ensure exactly LG- + 6 chars
    IF length(candidate) = 9 AND
       NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = candidate) THEN
      RETURN candidate;
    END IF;
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      -- fallback: append timestamp microseconds
      RETURN 'LG-' || lpad(
        (extract(epoch from clock_timestamp()) * 1000000)::bigint::text,
        6, '0'
      );
    END IF;
  END LOOP;
END;
$$;

-- 5) Trigger: al crear profile, asignar referral_code si no tiene
CREATE OR REPLACE FUNCTION assign_referral_code_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_assign_referral_code ON profiles;
CREATE TRIGGER profiles_assign_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_referral_code_on_profile();

-- 6) Backfill: usuarios existentes sin código
UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;
