/**
 * Bootstrap del cifrado — se corre UNA SOLA VEZ.
 *
 * Genera:
 *   1. Una DEK (Data Encryption Key) de 256 bits aleatoria.
 *   2. La envuelve (cifra) con la KMS key de Google Cloud.
 *   3. Un SEARCH_HMAC_SECRET aleatorio para los índices de búsqueda.
 *
 * Imprime los 3 valores que deben configurarse como env vars en Vercel:
 *   - GCP_KMS_WRAPPED_DEK    (la DEK envuelta, base64)
 *   - SEARCH_HMAC_SECRET     (hex de 64 chars)
 *
 * Uso:
 *   GCP_SERVICE_ACCOUNT_JSON='...' GCP_KMS_KEY_NAME='projects/...' \
 *     node scripts/bootstrap-encryption.mjs
 */

import { randomBytes } from "node:crypto";
import { KeyManagementServiceClient } from "@google-cloud/kms";

const saJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
const keyName = process.env.GCP_KMS_KEY_NAME;

if (!saJson || !keyName) {
  console.error(
    "Faltan env vars: GCP_SERVICE_ACCOUNT_JSON y GCP_KMS_KEY_NAME",
  );
  process.exit(1);
}

const credentials = JSON.parse(saJson);
const client = new KeyManagementServiceClient({
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
  projectId: credentials.project_id,
});

// 1) Generar DEK de 256 bits
const dek = randomBytes(32);

// 2) Envolverla con KMS
const [encryptResult] = await client.encrypt({
  name: keyName,
  plaintext: dek,
});
const wrappedDek = Buffer.from(encryptResult.ciphertext).toString("base64");

// 3) Verificar round-trip (desenvolver y comparar)
const [decryptResult] = await client.decrypt({
  name: keyName,
  ciphertext: Buffer.from(wrappedDek, "base64"),
});
const unwrapped = Buffer.from(decryptResult.plaintext);
if (!unwrapped.equals(dek)) {
  console.error("FALLO: el round-trip de la DEK no coincide");
  process.exit(1);
}

// 4) Generar HMAC secret para búsqueda
const hmacSecret = randomBytes(32).toString("hex");

console.log("\n=== Round-trip KMS verificado ✓ ===\n");
console.log("Configura estas env vars en Vercel (production + preview):\n");
console.log("GCP_KMS_WRAPPED_DEK=" + wrappedDek);
console.log("");
console.log("SEARCH_HMAC_SECRET=" + hmacSecret);
console.log("");
