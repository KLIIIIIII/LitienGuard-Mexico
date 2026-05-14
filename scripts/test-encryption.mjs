// Round-trip test del módulo de cifrado. Se corre con tsx desde la raíz.
import {
  encryptField,
  decryptField,
  isEncrypted,
  searchHash,
  isEncryptionConfigured,
} from "../src/lib/encryption.ts";

let pass = 0,
  fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log("  ✓", name);
  } else {
    fail++;
    console.log("  ✗ FALLO:", name);
  }
}

console.log("isEncryptionConfigured:", isEncryptionConfigured());

const original = "SOAP: Paciente con disnea progresiva. Dx: ICC.";
const enc = await encryptField(original);
check("cifrado tiene prefijo v1:", isEncrypted(enc));
check("ciphertext != plaintext", enc !== original);
const dec = await decryptField(enc);
check("round-trip coincide", dec === original);

const enc2 = await encryptField(enc);
check("idempotente (no doble-cifra)", enc2 === enc);

check("null pasa como null", (await encryptField(null)) === null);
check("'' pasa como ''", (await encryptField("")) === "");
check("decrypt null", (await decryptField(null)) === null);

check(
  "legacy plaintext pasa sin tocar",
  (await decryptField("texto viejo sin cifrar")) === "texto viejo sin cifrar",
);

const h1 = searchHash("Juan@Hospital.MX ");
const h2 = searchHash("juan@hospital.mx");
check("searchHash normaliza (trim+lower)", h1 === h2);
check("searchHash null para vacío", searchHash("") === null);
check("searchHash hex 64 chars", h1.length === 64);

const unicode =
  "Niño con fiebre 38.5° — diagnóstico: faringoamigdalitis 🩺";
check(
  "unicode round-trip",
  (await decryptField(await encryptField(unicode))) === unicode,
);

// Dos cifrados del mismo texto deben tener distinto IV → distinto output
const a = await encryptField("mismo texto");
const b = await encryptField("mismo texto");
check("IV aleatorio (cada cifrado es distinto)", a !== b);
check("pero ambos descifran igual", (await decryptField(a)) === (await decryptField(b)));

console.log(`\n${pass} pasaron, ${fail} fallaron`);
process.exit(fail > 0 ? 1 : 0);
