import Link from "next/link";
import { AuroraMesh } from "@/components/aurora-mesh";
import { FloatingMockup } from "@/components/floating-mockup";
import { Eyebrow } from "@/components/eyebrow";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-canvas">
      <div className="absolute inset-0">
        <AuroraMesh />
      </div>

      <div className="lg-shell relative grid gap-14 py-20 lg:grid-cols-[1.05fr_minmax(0,440px)] lg:items-center lg:py-28">
        <div>
          <Eyebrow tone="validation">
            Sistema operativo clínico — México
          </Eyebrow>
          <h1 className="mt-5 max-w-2xl text-display font-semibold tracking-tight text-ink md:text-[3rem] lg:text-[3.4rem] lg:leading-[1.05]">
            Inteligencia{" "}
            <span className="lg-serif-italic text-validation">Médica</span> para
            México.
          </h1>
          <p className="mt-6 max-w-xl text-body text-ink-muted md:text-[1.04rem]">
            Decisiones clínicas con evidencia citada, pacientes con respuestas
            claras, hospitales con cobranza limpia. Un solo cerebro curado en
            español, anclado en guías oficiales mexicanas e internacionales.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="#solicita-piloto" className="lg-cta-primary">
              Solicita acceso piloto
            </Link>
            <Link href="/medicos" className="lg-cta-ghost">
              Ver para médicos
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {[
              { dot: "validation", label: "Evidencia citada verbatim" },
              { dot: "accent", label: "Privado primero · sin PII en LLM" },
              { dot: "warn", label: "Compatible con reforma LGS 2026" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    b.dot === "validation"
                      ? "bg-validation"
                      : b.dot === "accent"
                        ? "bg-accent"
                        : "bg-warn"
                  }`}
                />
                <span className="text-caption text-ink-muted">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <FloatingMockup />
        </div>
      </div>
    </section>
  );
}
