import { redirect } from "next/navigation";
import { FileJson, FileText, Download } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  analizarNotas,
  type NotaForAnalytics,
} from "@/lib/analytics/notas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Exportar mis datos",
  robots: { index: false, follow: false },
};

export default async function ExportarPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supa
    .from("notas_scribe")
    .select(
      "id,paciente_edad,paciente_sexo,soap_analisis,soap_plan,status,created_at",
    );
  const notas = (rows as NotaForAnalytics[] | null) ?? [];
  const a = analizarNotas(notas);

  const sexoTotal =
    a.distribucionSexo.F +
    a.distribucionSexo.M +
    a.distribucionSexo.O +
    a.distribucionSexo.sinDato;
  const sexoPct = (n: number) =>
    sexoTotal === 0 ? "0%" : `${Math.round((n / sexoTotal) * 100)}%`;

  return (
    <div>
      <div>
        <Eyebrow tone="validation">Exportar</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
          Tu práctica en datos
        </h1>
        <p className="mt-2 max-w-prose text-body text-ink-muted">
          Descarga un reporte ejecutivo (PDF) o el dump completo de tus notas
          firmadas en JSON. La detección de diagnósticos y fármacos es por
          palabras clave — auditable en el JSON.
        </p>

        {/* Stats preview */}
        <section className="mt-10 grid gap-4 sm:grid-cols-4">
          <div className="lg-card">
            <p className="text-caption text-ink-muted">Notas totales</p>
            <p className="mt-1 text-h1 font-semibold text-ink-strong">
              {a.total}
            </p>
          </div>
          <div className="lg-card">
            <p className="text-caption text-ink-muted">Firmadas</p>
            <p className="mt-1 text-h1 font-semibold text-validation">
              {a.firmadas}
            </p>
          </div>
          <div className="lg-card">
            <p className="text-caption text-ink-muted">Borradores</p>
            <p className="mt-1 text-h1 font-semibold text-warn">
              {a.borradores}
            </p>
          </div>
          <div className="lg-card">
            <p className="text-caption text-ink-muted">Descartadas</p>
            <p className="mt-1 text-h1 font-semibold text-rose">
              {a.descartadas}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="lg-card">
            <Eyebrow tone="validation">Top diagnósticos</Eyebrow>
            <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
              Lo que más manejas
            </h2>
            {a.topDiagnosticos.length === 0 ? (
              <p className="mt-4 text-body-sm text-ink-soft">
                Aún no hay suficientes notas firmadas para detectar patrones.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {a.topDiagnosticos.slice(0, 8).map((d) => {
                  const max = a.topDiagnosticos[0].count;
                  const pct = Math.round((d.count / max) * 100);
                  return (
                    <li key={d.term} className="text-body-sm">
                      <div className="flex items-baseline justify-between">
                        <span className="text-ink-strong">{d.term}</span>
                        <span className="font-semibold text-ink-muted">
                          {d.count}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full bg-validation"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="lg-card">
            <Eyebrow tone="accent">Top fármacos</Eyebrow>
            <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
              Lo que más prescribes
            </h2>
            {a.topFarmacos.length === 0 ? (
              <p className="mt-4 text-body-sm text-ink-soft">
                Aún no hay suficientes planes firmados para detectar patrones.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {a.topFarmacos.slice(0, 8).map((d) => {
                  const max = a.topFarmacos[0].count;
                  const pct = Math.round((d.count / max) * 100);
                  return (
                    <li key={d.term} className="text-body-sm">
                      <div className="flex items-baseline justify-between">
                        <span className="text-ink-strong">{d.term}</span>
                        <span className="font-semibold text-ink-muted">
                          {d.count}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="lg-card">
            <Eyebrow tone="accent">Distribución por edad</Eyebrow>
            <ul className="mt-4 space-y-1.5">
              {a.distribucionEdad.length === 0 ? (
                <li className="text-body-sm text-ink-soft">
                  Sin datos de edad registrados.
                </li>
              ) : (
                a.distribucionEdad.map((d) => (
                  <li
                    key={d.decada}
                    className="flex items-baseline justify-between text-body-sm"
                  >
                    <span className="text-ink-strong">{d.decada}</span>
                    <span className="font-semibold text-ink-muted">
                      {d.count}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="lg-card">
            <Eyebrow tone="accent">Sexo</Eyebrow>
            <ul className="mt-4 space-y-1.5 text-body-sm">
              <li className="flex items-baseline justify-between">
                <span className="text-ink-strong">Femenino</span>
                <span className="font-semibold text-ink-muted">
                  {a.distribucionSexo.F} · {sexoPct(a.distribucionSexo.F)}
                </span>
              </li>
              <li className="flex items-baseline justify-between">
                <span className="text-ink-strong">Masculino</span>
                <span className="font-semibold text-ink-muted">
                  {a.distribucionSexo.M} · {sexoPct(a.distribucionSexo.M)}
                </span>
              </li>
              <li className="flex items-baseline justify-between">
                <span className="text-ink-strong">Otro</span>
                <span className="font-semibold text-ink-muted">
                  {a.distribucionSexo.O} · {sexoPct(a.distribucionSexo.O)}
                </span>
              </li>
              <li className="flex items-baseline justify-between">
                <span className="text-ink-strong">Sin dato</span>
                <span className="font-semibold text-ink-muted">
                  {a.distribucionSexo.sinDato} ·{" "}
                  {sexoPct(a.distribucionSexo.sinDato)}
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-10 flex flex-wrap gap-3">
          <a
            href="/api/exportar/notas?format=pdf"
            target="_blank"
            rel="noopener"
            className="lg-cta-primary"
          >
            <FileText className="h-4 w-4" strokeWidth={2.2} />
            Descargar reporte PDF
          </a>
          <a
            href="/api/exportar/notas?format=json"
            target="_blank"
            rel="noopener"
            className="lg-cta-ghost"
          >
            <FileJson className="h-4 w-4" strokeWidth={2.2} />
            Descargar JSON completo
          </a>
          <p className="basis-full text-caption text-ink-soft">
            <Download className="mr-1 inline h-3 w-3" /> JSON incluye
            transcripciones completas y metadatos para auditoría o integración
            con tu sistema.
          </p>
        </section>
      </div>
    </div>
  );
}
