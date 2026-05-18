/**
 * Authority Bar — estilo Oracle/Stripe "trusted by".
 *
 * En lugar de logos de clientes (que aún no tenemos públicamente), usa
 * texto/wordmarks de instituciones de referencia cuyas guías clínicas
 * se siguen en el motor. Comunica autoridad institucional sin claim
 * comercial.
 */
export function AuthorityBar() {
  const institutions = [
    "AHA",
    "ESC",
    "ADA",
    "KDIGO",
    "NCCN",
    "WHO",
    "AHRQ",
    "SCCM",
    "CENETEC",
    "IMSS",
    "ISSSTE",
    "SSA",
  ];

  return (
    <section className="border-y border-line bg-surface-alt/50 py-10">
      <div className="lg-shell">
        <p className="text-center text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          Cerebro construido sobre guías clínicas oficiales de
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
          {institutions.map((name) => (
            <span
              key={name}
              className="text-body-sm font-bold tracking-wide text-ink-quiet hover:text-ink-muted transition-colors"
              style={{ fontVariant: "small-caps" }}
            >
              {name}
            </span>
          ))}
        </div>
        <p className="mt-5 mx-auto max-w-2xl text-center text-caption text-ink-soft leading-relaxed">
          Toda recomendación se entrega con cita verbatim y número de
          página del documento fuente. Sin contenido generado por LLM sin
          fundamento clínico.
        </p>
      </div>
    </section>
  );
}
