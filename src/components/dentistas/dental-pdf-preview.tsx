import { FileText, Printer, Download } from "lucide-react";

/**
 * Preview visual del PDF firmable que exporta el dentista para que el
 * paciente firme en papel. Réplica fiel del estilo tipográfico del
 * PDF real (Helvetica, colores ink/cream, estructura SOAP + plan +
 * firmas) renderizado como hoja A4 flotante.
 */

const FINDINGS = [
  { pieza: "16", dx: "Caries clase II vestíbulo-oclusal", accion: "Resina" },
  { pieza: "36", dx: "Caries clase I oclusal", accion: "Resina" },
  { pieza: "37", dx: "Endodoncia previa con restauración temporal", accion: "Corona zirconio" },
  { pieza: "38", dx: "Tercer molar parcialmente erupcionado", accion: "Eval. quirúrgica" },
];

export function DentalPdfPreview() {
  return (
    <div className="relative">
      {/* Soft halo */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-warn-soft via-validation-soft to-transparent opacity-40 blur-3xl"
      />

      {/* Toolbar superior tipo print preview */}
      <div className="flex items-center justify-between gap-3 rounded-t-2xl border border-line bg-surface-alt px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-validation" strokeWidth={2} />
          <p className="text-caption font-semibold text-ink-strong">
            Plan de tratamiento · L.M. · 14 abr 2026
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[0.6rem] font-semibold text-ink-muted">
            <Printer className="h-2.5 w-2.5" strokeWidth={2.2} />
            A4 · 1 / 1
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-validation px-2 py-0.5 text-[0.6rem] font-semibold text-canvas">
            <Download className="h-2.5 w-2.5" strokeWidth={2.2} />
            Listo para firma
          </span>
        </div>
      </div>

      {/* Hoja A4 — proporción 1:1.41 (sqrt 2) */}
      <div className="relative border border-line bg-canvas shadow-deep">
        {/* Banda superior estilo PDF */}
        <div className="px-7 pt-7 pb-4 border-b-2 border-ink">
          <p className="text-[0.55rem] uppercase tracking-[0.16em] font-bold text-validation">
            LitienGuard · Dental
          </p>
          <h3 className="mt-1 text-[1.5rem] font-bold tracking-tight text-ink-strong leading-none">
            Plan de tratamiento
          </h3>
          <p className="mt-1 text-[0.65rem] text-ink-muted">
            Documento clínico imprimible · Notación FDI
          </p>
        </div>

        {/* Meta box paciente */}
        <div className="mx-7 mt-4 rounded bg-surface-alt px-4 py-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetaCell label="Paciente" value="López Méndez, Liliana" />
            <MetaCell label="Edad" value="38 años" />
            <MetaCell label="Fecha" value="14 de abril 2026" />
            <MetaCell label="Folio" value="DG-7842" />
          </div>
        </div>

        {/* Diagnóstico */}
        <div className="px-7 pt-5">
          <p className="text-[0.55rem] uppercase tracking-[0.16em] font-bold text-validation pb-1 border-b border-validation/30">
            Diagnóstico
          </p>
          <p className="mt-2 text-[0.78rem] text-ink-strong leading-relaxed">
            Caries oclusales en piezas 16 y 36 sin sintomatología. Tercer molar
            38 con erupción incompleta. Resto del aparato estomatognático
            asintomático.
          </p>
        </div>

        {/* Plan de tratamiento */}
        <div className="px-7 pt-5">
          <p className="text-[0.55rem] uppercase tracking-[0.16em] font-bold text-validation pb-1 border-b border-validation/30">
            Plan de tratamiento · 4 intervenciones
          </p>
          <div className="mt-3 space-y-2.5">
            {FINDINGS.map((f, idx) => (
              <div key={f.pieza} className="flex items-start gap-3">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-validation-soft font-mono text-[0.6rem] font-bold text-validation">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.78rem] font-semibold text-ink-strong leading-tight">
                    Pieza {f.pieza} · {f.dx}
                  </p>
                  <p className="mt-0.5 text-[0.7rem] text-ink-muted leading-snug">
                    Procedimiento: {f.accion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consentimiento */}
        <div className="px-7 pt-5">
          <p className="text-[0.55rem] uppercase tracking-[0.16em] font-bold text-validation pb-1 border-b border-validation/30">
            Consentimiento informado
          </p>
          <p className="mt-2 text-[0.7rem] text-ink-muted leading-relaxed">
            He sido informada de los procedimientos sugeridos, sus alternativas,
            beneficios esperados y posibles complicaciones. Comprendo que la
            firma de este documento autoriza al profesional a iniciar el
            tratamiento descrito.
          </p>
        </div>

        {/* Firmas */}
        <div className="mx-7 mt-7 grid grid-cols-2 gap-7 pt-2">
          <SignatureBlock label="Paciente" sublabel="Firma de aceptación" />
          <SignatureBlock
            label="Dra. Pamela Sandoval"
            sublabel="Cédula profesional 7842316"
          />
        </div>

        {/* Footer */}
        <div className="mx-7 mt-6 mb-5 flex items-center justify-between border-t border-line pt-2">
          <p className="text-[0.55rem] text-ink-soft tracking-tight">
            LitienGuard · Estructura conforme NOM-024-SSA3 · LFPDPPP
          </p>
          <p className="text-[0.55rem] text-ink-soft">
            Documento clínico · 1 / 1
          </p>
        </div>
      </div>
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.55rem] uppercase tracking-[0.14em] font-semibold text-ink-soft">
        {label}
      </p>
      <p className="mt-0.5 text-[0.72rem] font-bold text-ink-strong leading-tight">
        {value}
      </p>
    </div>
  );
}

function SignatureBlock({
  label,
  sublabel,
}: {
  label: string;
  sublabel: string;
}) {
  return (
    <div>
      <div className="h-8 border-b border-ink" />
      <p className="mt-1.5 text-[0.7rem] font-bold text-ink-strong text-center">
        {label}
      </p>
      <p className="text-[0.6rem] text-ink-muted text-center mt-0.5">
        {sublabel}
      </p>
    </div>
  );
}
