/**
 * Genera embeddings (text-embedding-3-small, 1536 dim) para los chunks
 * de cerebro_chunks que aún no tengan. Idempotente: solo procesa los
 * que tengan embedding IS NULL.
 *
 * Uso:
 *   SUPABASE_PAT=sbp_... \
 *   AI_GATEWAY_API_KEY=... \
 *   KMS_PROJECT_ID=... \
 *   KMS_LOCATION=... \
 *   KMS_KEYRING=... \
 *   KMS_KEY=... \
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json \
 *   node --experimental-strip-types scripts/embed-cerebro-chunks.mjs
 *
 * Procesa en lotes de 50 chunks (max input tokens del embedder permite
 * batch, pero por simplicidad lo hacemos uno por uno o en mini-batch).
 *
 * Costo aproximado: text-embedding-3-small ~$0.02/M tokens. Un cerebro
 * de ~3000 chunks con avg 800 tokens = 2.4M tokens = ~$0.05 USD total.
 */

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_REF ?? "lguhkybcrfwejaikfaze";
const AI_KEY = process.env.AI_GATEWAY_API_KEY;

if (!PAT) {
  console.error("Falta SUPABASE_PAT");
  process.exit(1);
}
if (!AI_KEY) {
  console.error("Falta AI_GATEWAY_API_KEY");
  process.exit(1);
}

const MODEL = "openai/text-embedding-3-small";
const BATCH_SIZE = 25;

async function sqlQuery(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  if (!res.ok) {
    throw new Error(`SQL failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function fetchPendingChunks(limit = BATCH_SIZE) {
  // Nota: content viene cifrado. Necesitamos un endpoint que descifre
  // o hacerlo en código. Para este script asumimos que content todavía
  // está accesible vía SQL (en realidad sí — está cifrado con KMS pero
  // el envelope decryption requiere el KMS, no podemos hacerlo desde SQL).
  //
  // Approach: el script asume que llamarás esto desde el server de la
  // app (que ya tiene el KMS configurado). En vez de eso vamos a
  // procesar VIA un endpoint de la app que descifra + embed.
  //
  // Para piloto temprano: si los chunks legacy aún están en texto plano,
  // el script funciona directo contra SQL.
  const sql = `
    select id, content
    from public.cerebro_chunks
    where embedding is null and is_active = true
    order by id
    limit ${limit};
  `;
  return sqlQuery(sql);
}

async function embedText(text) {
  const res = await fetch("https://ai-gateway.vercel.sh/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: text.slice(0, 8000),
    }),
  });
  if (!res.ok) {
    throw new Error(`Embed failed (${res.status}): ${await res.text()}`);
  }
  const json = await res.json();
  return json.data[0].embedding;
}

async function updateEmbedding(id, embedding) {
  const vecLit = JSON.stringify(embedding);
  const sql = `
    update public.cerebro_chunks
    set embedding = '${vecLit}'::vector
    where id = '${id}';
  `;
  return sqlQuery(sql);
}

let totalProcessed = 0;
let totalSkipped = 0;
const t0 = Date.now();

while (true) {
  const rows = await fetchPendingChunks();
  if (!rows || rows.length === 0) {
    console.log("✓ No quedan chunks pendientes.");
    break;
  }

  for (const row of rows) {
    if (!row.content || row.content.length < 20) {
      totalSkipped++;
      continue;
    }
    // Si content empieza con "v1:" es cifrado — saltar (no podemos
    // descifrar desde script externo sin KMS).
    if (row.content.startsWith("v1:")) {
      console.log(`Skip ${row.id.slice(0, 8)} — cifrado, requiere endpoint app`);
      totalSkipped++;
      continue;
    }
    try {
      const emb = await embedText(row.content);
      await updateEmbedding(row.id, emb);
      totalProcessed++;
      if (totalProcessed % 10 === 0) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`  ${totalProcessed} procesados · ${elapsed}s`);
      }
    } catch (e) {
      console.error(`Fail ${row.id.slice(0, 8)}: ${e.message}`);
      totalSkipped++;
    }
  }

  if (rows.length < BATCH_SIZE) break;
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n✓ Done. ${totalProcessed} processed, ${totalSkipped} skipped. ${elapsed}s total.`);
