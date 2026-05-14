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

const FIELD_PREFIX = "v1:";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit nonce — estándar para GCM

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

/** ¿El valor ya está cifrado con nuestro formato? */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(FIELD_PREFIX);
}

/**
 * Cifra un campo de texto. Devuelve el formato empaquetado v1:...
 * Si el valor es null/undefined/"" lo devuelve tal cual (nada que cifrar).
 */
export async function encryptField(
  plaintext: string | null | undefined,
): Promise<string | null> {
  if (plaintext === null || plaintext === undefined || plaintext === "") {
    return plaintext ?? null;
  }
  // Idempotencia: si ya está cifrado, no doble-cifrar
  if (isEncrypted(plaintext)) return plaintext;

  const dek = await getDek();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, dek, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${FIELD_PREFIX}${iv.toString("base64")}:${authTag.toString(
    "base64",
  )}:${ciphertext.toString("base64")}`;
}

/**
 * Descifra un campo. Si el valor NO tiene el prefijo v1: se considera
 * legacy (texto plano sin cifrar) y se devuelve tal cual — esto permite
 * migración gradual. null/undefined pasan sin tocar.
 */
export async function decryptField(
  packed: string | null | undefined,
): Promise<string | null> {
  if (packed === null || packed === undefined) return null;
  if (!isEncrypted(packed)) return packed; // legacy plaintext

  const body = packed.slice(FIELD_PREFIX.length);
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
 * HMAC-SHA256 determinístico para búsqueda exacta de campos cifrados.
 * Normaliza (trim + lowercase) antes de hashear para que "Juan@X.com "
 * y "juan@x.com" produzcan el mismo hash. Síncrono — no toca KMS.
 *
 * Usar para: pacientes.email → pacientes.email_search_hash, etc.
 */
export function searchHash(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === "") {
    return null;
  }
  const secret = process.env.SEARCH_HMAC_SECRET;
  if (!secret) {
    throw new Error("SEARCH_HMAC_SECRET no configurada");
  }
  return createHmac("sha256", secret)
    .update(value.trim().toLowerCase())
    .digest("hex");
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
