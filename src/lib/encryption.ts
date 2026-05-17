/**
 * Cifrado a nivel de campo para datos clínicos y PIIs de paciente.
 *
 * Arquitectura — envelope encryption:
 *   1. Una Data Encryption Key (DEK) de 256 bits, generada una sola vez
 *      en el bootstrap, envuelta (cifrada) por la KMS key de Google Cloud.
 *      El wrapped DEK vive en la env var GCP_KMS_WRAPPED_DEK.
 *   2. En runtime, la DEK se desenvuelve con KMS UNA vez por proceso
 *      (cacheada en memoria — persiste en lambdas tibias).
 *   3. Cada campo se cifra localmente con AES-256-GCM usando la DEK.
 *      KMS no se toca por campo — solo 1 llamada por cold start.
 *
 * Formato del campo cifrado:  v1:<iv_b64>:<authTag_b64>:<ciphertext_b64>
 *   El prefijo de versión permite rotación futura. Un valor SIN el
 *   prefijo v1: se considera legacy (texto plano) y se devuelve tal
 *   cual al descifrar — esto permite migración gradual sin romper
 *   lecturas mientras los datos viejos se re-cifran.
 *
 * Búsqueda — searchHash():
 *   Para campos cifrados que necesitan búsqueda exacta (ej. email del
 *   paciente para deduplicar), generamos un HMAC-SHA256 determinístico
 *   con un secreto SEPARADO de la KMS key (SEARCH_HMAC_SECRET). Así una
 *   rotación de la KMS key no invalida los índices de búsqueda.
 *
 * IMPORTANTE — recuperación de desastre:
 *   Si se pierde el acceso al proyecto GCP `prodi-corp-caribe`, TODOS
 *   los datos cifrados son irrecuperables. El service account JSON debe
 *   estar respaldado en un gestor de contraseñas fuera de este repo.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import { KeyManagementServiceClient } from "@google-cloud/kms";

const V1_PREFIX = "v1:";
const V2_PREFIX = "v2:";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit nonce — estándar para GCM

// Resumen de versiones del formato cifrado:
//   v1: <iv>:<tag>:<ct>            — cifrado simple (legacy, Fases A/B/C inicial)
//   v2: <iv>:<tag>:<ct>            — cifrado con AAD binding al contexto.
//      El AAD (p. ej. medico_id) NO se almacena en el ciphertext; viene
//      del row al descifrar. Si alguien mueve el ciphertext a otra fila,
//      el AAD será diferente y el descifrado fallará (anti-rebind).
// Migración: la app lee AMBOS formatos en paralelo. v1 ignora AAD aunque
// se le pase. v2 lo exige. Esto permite rollout gradual sin downtime.

// ------------------------------------------------------------------
// KMS client (lazy singleton)
// ------------------------------------------------------------------

let _kmsClient: KeyManagementServiceClient | null = null;

function getKmsClient(): KeyManagementServiceClient {
  if (_kmsClient) return _kmsClient;
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "GCP_SERVICE_ACCOUNT_JSON no configurada — cifrado no disponible",
    );
  }
  const credentials = JSON.parse(raw) as {
    client_email: string;
    private_key: string;
    project_id: string;
  };
  _kmsClient = new KeyManagementServiceClient({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    projectId: credentials.project_id,
  });
  return _kmsClient;
}

// ------------------------------------------------------------------
// DEK — desenvuelta una vez por proceso, cacheada en memoria
// ------------------------------------------------------------------

let _dekPromise: Promise<Buffer> | null = null;

async function getDek(): Promise<Buffer> {
  if (_dekPromise) return _dekPromise;
  _dekPromise = (async () => {
    const wrapped = process.env.GCP_KMS_WRAPPED_DEK;
    const keyName = process.env.GCP_KMS_KEY_NAME;
    if (!wrapped || !keyName) {
      throw new Error(
        "GCP_KMS_WRAPPED_DEK o GCP_KMS_KEY_NAME no configuradas",
      );
    }
    const client = getKmsClient();
    const [result] = await client.decrypt({
      name: keyName,
      ciphertext: Buffer.from(wrapped, "base64"),
    });
    if (!result.plaintext) {
      throw new Error("KMS no devolvió la DEK descifrada");
    }
    const dek = Buffer.from(result.plaintext);
    if (dek.length !== 32) {
      throw new Error(`DEK debe ser 256 bits, recibí ${dek.length} bytes`);
    }
    return dek;
  })();
  // Si la promesa falla, no cachear el error — permitir reintento
  _dekPromise.catch(() => {
    _dekPromise = null;
  });
  return _dekPromise;
}

// ------------------------------------------------------------------
// API pública
// ------------------------------------------------------------------

/** ¿El valor ya está cifrado con nuestro formato (v1 o v2)? */
export function isEncrypted(value: string | null | undefined): boolean {
  return (
    typeof value === "string" &&
    (value.startsWith(V1_PREFIX) || value.startsWith(V2_PREFIX))
  );
}

/**
 * Cifra un campo de texto. Si se pasa `aad`, usa formato v2 con AAD
 * binding (el contexto queda amarrado al ciphertext y un swap entre
 * filas hace fallar el descifrado). Si no se pasa `aad`, usa v1.
 *
 * Si el valor es null/undefined/"" lo devuelve tal cual.
 */
export async function encryptField(
  plaintext: string | null | undefined,
  aad?: string,
): Promise<string | null> {
  if (plaintext === null || plaintext === undefined || plaintext === "") {
    return plaintext ?? null;
  }
  // Idempotencia: si ya está cifrado, no doble-cifrar
  if (isEncrypted(plaintext)) return plaintext;

  const dek = await getDek();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, dek, iv);
  if (aad && aad.length > 0) {
    cipher.setAAD(Buffer.from(aad, "utf8"));
  }
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const prefix = aad && aad.length > 0 ? V2_PREFIX : V1_PREFIX;
  return `${prefix}${iv.toString("base64")}:${authTag.toString(
    "base64",
  )}:${ciphertext.toString("base64")}`;
}

/**
 * Descifra un campo. Auto-detecta versión por prefijo:
 *   - v1: ignora el AAD pasado (legacy, sin AAD binding)
 *   - v2: REQUIERE el AAD correcto. Si no coincide, el authTag falla.
 * Si el valor NO tiene prefijo, se considera legacy plaintext y se
 * devuelve tal cual. null/undefined pasan sin tocar.
 */
export async function decryptField(
  packed: string | null | undefined,
  aad?: string,
): Promise<string | null> {
  if (packed === null || packed === undefined) return null;
  if (!isEncrypted(packed)) return packed; // legacy plaintext

  const isV2 = packed.startsWith(V2_PREFIX);
  const body = packed.slice(isV2 ? V2_PREFIX.length : V1_PREFIX.length);
  const parts = body.split(":");
  if (parts.length !== 3) {
    throw new Error("Campo cifrado con formato inválido");
  }
  const [ivB64, tagB64, ctB64] = parts;
  const dek = await getDek();
  const decipher = createDecipheriv(
    ALGO,
    dek,
    Buffer.from(ivB64, "base64"),
  );
  if (isV2) {
    if (!aad || aad.length === 0) {
      throw new Error(
        "Campo cifrado v2 requiere AAD — contexto faltante en el descifrado",
      );
    }
    decipher.setAAD(Buffer.from(aad, "utf8"));
  }
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/**
 * Cifra varios campos de un objeto en paralelo. Devuelve un objeto
 * nuevo con los mismos keys pero valores cifrados. Conveniente para
 * preparar un row antes de insert/update.
 */
export async function encryptFields<T extends Record<string, string | null | undefined>>(
  fields: T,
): Promise<Record<keyof T, string | null>> {
  const entries = await Promise.all(
    Object.entries(fields).map(async ([k, v]) => [
      k,
      await encryptField(v),
    ]),
  );
  return Object.fromEntries(entries) as Record<keyof T, string | null>;
}

/**
 * Descifra varios campos de un objeto en paralelo.
 */
export async function decryptFields<T extends Record<string, string | null | undefined>>(
  fields: T,
): Promise<Record<keyof T, string | null>> {
  const entries = await Promise.all(
    Object.entries(fields).map(async ([k, v]) => [
      k,
      await decryptField(v),
    ]),
  );
  return Object.fromEntries(entries) as Record<keyof T, string | null>;
}

/**
 * HMAC determinístico para búsqueda exacta de campos cifrados.
 *
 * Tiene DOS modos según las env vars configuradas:
 *
 *   1) Solo SEARCH_HMAC_SECRET configurada (legacy/default):
 *      Un HMAC simple sobre trim+lowercase. Devuelve hex sin prefijo.
 *      Es compatible con hashes ya almacenados antes de la rotación.
 *
 *   2) SEARCH_HMAC_SECRET + SEARCH_HMAC_PEPPER configuradas (v2):
 *      Doble HMAC encadenado — un atacante con la BD necesitaría AMBOS
 *      secretos para hacer ataques de diccionario sobre los hashes.
 *      Devuelve "v2:<hex>" para distinguir del formato legacy.
 *
 * El upgrade de modo 1 → 2 es transparente: agregar SEARCH_HMAC_PEPPER
 * en env y todos los hashes nuevos se escriben en v2. Para LEER hashes
 * viejos y nuevos en una sola query, usa `searchHashAll(value)` que
 * devuelve ambas versiones — útil para lookups durante la migración.
 *
 * Usar para: pacientes.email → pacientes.email_search_hash,
 * recetas.paciente_search_hash, etc.
 */
export function searchHash(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === "") {
    return null;
  }
  const secret = process.env.SEARCH_HMAC_SECRET;
  if (!secret) {
    throw new Error("SEARCH_HMAC_SECRET no configurada");
  }
  const pepper = process.env.SEARCH_HMAC_PEPPER;
  const normalized = value.trim().toLowerCase();

  if (pepper && pepper.length > 0) {
    // v2: HMAC encadenado. inner = HMAC(pepper, value); outer = HMAC(secret, inner)
    const inner = createHmac("sha256", pepper).update(normalized).digest();
    const outer = createHmac("sha256", secret).update(inner).digest("hex");
    return `v2:${outer}`;
  }

  // v1 (legacy/default): single HMAC
  return createHmac("sha256", secret).update(normalized).digest("hex");
}

/**
 * Devuelve TODAS las versiones del searchHash para un valor dado.
 * Útil para hacer lookups que toleren la migración v1 → v2:
 *
 *   const hashes = searchHashAll("ana lopez");
 *   if (hashes) {
 *     supa.from("recetas")
 *       .select("*")
 *       .in("paciente_search_hash", hashes);
 *   }
 *
 * Cuando SEARCH_HMAC_PEPPER no está configurada, devuelve solo [v1].
 */
export function searchHashAll(
  value: string | null | undefined,
): string[] | null {
  if (value === null || value === undefined || value.trim() === "") {
    return null;
  }
  const secret = process.env.SEARCH_HMAC_SECRET;
  if (!secret) {
    throw new Error("SEARCH_HMAC_SECRET no configurada");
  }
  const pepper = process.env.SEARCH_HMAC_PEPPER;
  const normalized = value.trim().toLowerCase();

  const v1 = createHmac("sha256", secret).update(normalized).digest("hex");
  if (!pepper || pepper.length === 0) {
    return [v1];
  }

  const inner = createHmac("sha256", pepper).update(normalized).digest();
  const v2 =
    "v2:" + createHmac("sha256", secret).update(inner).digest("hex");
  return [v1, v2];
}

/**
 * ¿Está el cifrado configurado y disponible? Útil para feature-gating
 * defensivo — si las env vars no están, no intentar cifrar.
 */
export function isEncryptionConfigured(): boolean {
  return (
    !!process.env.GCP_SERVICE_ACCOUNT_JSON &&
    !!process.env.GCP_KMS_WRAPPED_DEK &&
    !!process.env.GCP_KMS_KEY_NAME &&
    !!process.env.SEARCH_HMAC_SECRET
  );
}

/**
 * ¿Está activado el modo doble-HMAC (v2)? Para reportes de seguridad
 * o para decidir si exhibir hashes con prefijo en la app.
 */
export function isSearchHashV2Active(): boolean {
  const pepper = process.env.SEARCH_HMAC_PEPPER;
  return !!pepper && pepper.length > 0;
}
