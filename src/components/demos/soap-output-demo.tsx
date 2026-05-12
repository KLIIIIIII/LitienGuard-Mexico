import { FileSignature, Sparkles, Edit3 } from "lucide-react";

/**
 * Renderizado verbatim de la nota SOAP que produce el Scribe para el
 * caso de referencia (Sra. G.R., 68 años, ICC FEVIr). Contenido clínico
 * realista, anonimizado, con citas inline a las guías que el cerebro
 * recuperó durante la consulta.
 */
export function SoapOutputDemo() {
  return (
    <div className="rounded-2xl border border-line bg-surface shadow-soft overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-alt px-5 py-3">
        <div className="flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-validation" strokeWidth={2} />
          <p className="text-caption font-semibold uppercase tracking-eyebrow text-validation">
            Nota SOAP · generada en 14 segundos
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-caption font-semibold text-warn">
          <Edit3 className="h-3 w-3" strokeWidth={2.4} />
          Borrador · pendiente firma
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Subjetivo */}
        <Section
          letter="S"
          label="Subjetivo"
          body={
            <>
              Mujer 68 años con ICC con FEVI reducida (35%) en seguimiento.
              Acude por <strong>disnea progresiva de 3 semanas</strong> de
              evolución, ortopnea de 2 almohadas (previamente 1), y edema
              pretibial bilateral. Sin DPN, sin dolor torácico, sin síncope.
              Refiere adherencia completa al tratamiento. Niega cambios
              dietéticos o consumo elevado de sodio.
            </>
          }
        />

        {/* Objetivo */}
        <Section
          letter="O"
          label="Objetivo"
          body={
            <>
              <ul className="space-y-0.5">
                <li>
                  <strong>Signos vitales:</strong> TA 142/86, FC 78 reg, FR 18,
                  SpO₂ 95% aire ambiente, peso 72 kg (+2 kg vs visita previa).
                </li>
                <li>
                  <strong>EF cardiopulmonar:</strong> Galope S3 audible.
                  Crepitantes bibasales hasta 1/3 inferior. Ingurgitación
                  yugular a 30°.
                </li>
                <li>
                  <strong>Extremidades:</strong> Edema +/4 bilateral hasta tercio
                  medio de pierna.
                </li>
                <li>
                  <strong>Eco previo (28-abr):</strong> FEVI 35%, DVI 62 mm,
                  insuficiencia mitral moderada, sin trombo intracavitario.
                </li>
                <li>
                  <strong>Lab hoy:</strong> eGFR 42, K 4.8, NT-proBNP 1240,
                  Na 138, creatinina 1.4.
                </li>
              </ul>
            </>
          }
        />

        {/* Análisis */}
        <Section
          letter="A"
          label="Análisis"
          body={
            <ol className="space-y-1.5 list-decimal pl-5">
              <li>
                <strong>ICC-FEVIr descompensada</strong>, NYHA III por congestión
                pulmonar y sistémica. Probable trigger: progresión natural por
                GDMT incompleta más que sobrecarga aguda de volumen.
              </li>
              <li>
                <strong>ERC etapa 3b</strong> (eGFR 42) sin cambio agudo. K
                normal-alto en límite superior — vigilar con cambios
                farmacológicos.
              </li>
              <li>
                <strong>Gap terapéutico GDMT:</strong> falta SGLT2i y ARNi (2
                de 4 pilares pendientes). Carvedilol a 25% de dosis target.
              </li>
            </ol>
          }
        />

        {/* Plan */}
        <Section
          letter="P"
          label="Plan"
          body={
            <ol className="space-y-2 list-decimal pl-5">
              <li>
                <strong>Iniciar dapagliflozina 10 mg/día</strong> hoy.
                <FootnoteCite>
                  Recomendación con evidencia: KDIGO 2024 §4.3.2 (pág. 81),
                  Class I, LOE A. HR 0.74 mortalidad CV/HF (DAPA-HF).
                </FootnoteCite>
              </li>
              <li>
                <strong>Aumentar carvedilol a 12.5 mg BID</strong> por 2 semanas,
                luego 25 BID si tolera (FC &gt;55, TAS &gt;100).
                <FootnoteCite>
                  AHA/ACC/HFSA 2022 §7.3.2 — uptitulación a dosis máxima
                  tolerada.
                </FootnoteCite>
              </li>
              <li>
                <strong>Diferir switch IECA → ARNi 2 semanas</strong> hasta
                confirmar trayectoria K con SGLT2i. Re-evaluar en cita
                control.
              </li>
              <li>
                <strong>Furosemida 60 mg BID</strong> hoy y mañana, luego
                reevaluar peso y congestión.
              </li>
              <li>
                Restricción sodio &lt;2 g/día. Auto-monitoreo peso diario;
                contactar si gana &gt;1 kg en 48 h.
              </li>
              <li>
                <strong>Cita control en 2 semanas</strong> con BMP, ECG, peso,
                evaluación NYHA. Telesalud si hay mejoría sintomática franca.
              </li>
            </ol>
          }
        />

        <div className="rounded-lg border border-validation-soft bg-validation-soft/40 px-4 py-3">
          <div className="flex items-start gap-2">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-validation"
              strokeWidth={2}
            />
            <p className="text-caption text-ink-strong leading-relaxed">
              <strong>Resumen audio → SOAP:</strong> 13 min 42 s de consulta →
              transcripción 3.8 s · estructuración 10.2 s · revisión médico
              90 s. <strong>Tiempo total post-consulta: 1 min 44 s.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  letter,
  label,
  body,
}: {
  letter: string;
  label: string;
  body: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 border-b border-line pb-1 mb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-validation-soft font-mono font-bold text-validation">
          {letter}
        </span>
        <p className="text-caption uppercase tracking-eyebrow font-semibold text-ink-strong">
          {label}
        </p>
      </div>
      <div className="pl-10 text-body-sm text-ink-strong leading-relaxed">
        {body}
      </div>
    </div>
  );
}

function FootnoteCite({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-caption italic text-ink-muted leading-relaxed">
      ↳ {children}
    </p>
  );
}
