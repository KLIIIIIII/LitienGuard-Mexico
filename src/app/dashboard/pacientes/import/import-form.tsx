"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Check,
  AlertCircle,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import { importarPacientesBatch } from "../actions";

interface ParsedRow {
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  ultima_consulta_at?: string;
  notas_internas?: string;
  etiquetas?: string;
}

interface PreviewState {
  rows: ParsedRow[];
  errors: string[];
  filename: string;
}

interface SubmitResult {
  rows_ok: number;
  rows_error: number;
  errors: string[];
}

/**
 * Parser CSV minimalista sin dependencias. Soporta:
 *   - Delimitador , o ;
 *   - Valores entre comillas dobles "..."
 *   - Comillas dobles escapadas ""
 *   - CRLF y LF
 *
 * Suficiente para listas de pacientes (no para CSVs con multilínea).
 */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  // Detectar delimitador en la primera línea
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semiCount = (firstLine.match(/;/g) ?? []).length;
  const delim = semiCount > commaCount ? ";" : ",";

  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === delim) {
        current.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        current.push(field);
        field = "";
        if (current.some((v) => v.trim() !== "")) rows.push(current);
        current = [];
      } else {
        field += c;
      }
    }
  }
  if (field !== "" || current.length > 0) {
    current.push(field);
    if (current.some((v) => v.trim() !== "")) rows.push(current);
  }
  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return { headers, rows: rows.slice(1) };
}

const KNOWN_COLUMNS: Array<keyof ParsedRow> = [
  "nombre",
  "apellido_paterno",
  "apellido_materno",
  "email",
  "telefono",
  "fecha_nacimiento",
  "sexo",
  "ultima_consulta_at",
  "notas_internas",
  "etiquetas",
];

// Alias en español común
const ALIASES: Record<string, keyof ParsedRow> = {
  apellido: "apellido_paterno",
  "apellido paterno": "apellido_paterno",
  "apellido materno": "apellido_materno",
  correo: "email",
  "e-mail": "email",
  tel: "telefono",
  teléfono: "telefono",
  celular: "telefono",
  nacimiento: "fecha_nacimiento",
  "fecha de nacimiento": "fecha_nacimiento",
  género: "sexo",
  genero: "sexo",
  "última consulta": "ultima_consulta_at",
  "ultima consulta": "ultima_consulta_at",
  "última visita": "ultima_consulta_at",
  notas: "notas_internas",
  tags: "etiquetas",
};

function mapHeader(h: string): keyof ParsedRow | null {
  const norm = h.trim().toLowerCase();
  if (KNOWN_COLUMNS.includes(norm as keyof ParsedRow))
    return norm as keyof ParsedRow;
  if (ALIASES[norm]) return ALIASES[norm];
  return null;
}

export function ImportForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [topError, setTopError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTopError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      try {
        const { headers, rows } = parseCsv(text);
        if (headers.length === 0) {
          setTopError("El archivo está vacío.");
          return;
        }
        const headerMap: Array<keyof ParsedRow | null> = headers.map(mapHeader);
        if (!headerMap.includes("nombre")) {
          setTopError(
            "El archivo debe tener una columna llamada 'nombre' (o equivalente).",
          );
          return;
        }
        if (rows.length === 0) {
          setTopError("No hay filas de pacientes en el archivo.");
          return;
        }
        if (rows.length > 5000) {
          setTopError(
            `El archivo tiene ${rows.length} filas. El máximo es 5,000. Divide y vuelve a intentar.`,
          );
          return;
        }

        const errors: string[] = [];
        const parsed: ParsedRow[] = rows.map((r, idx) => {
          const obj: ParsedRow = {};
          headerMap.forEach((k, i) => {
            if (k) obj[k] = (r[i] ?? "").trim();
          });
          if (!obj.nombre) errors.push(`Fila ${idx + 2}: nombre vacío`);
          return obj;
        });

        setPreview({ rows: parsed, errors, filename: file.name });
      } catch (err) {
        console.error(err);
        setTopError("No pudimos leer el archivo. ¿Es CSV válido?");
      }
    };
    reader.onerror = () => setTopError("Error al leer el archivo.");
    reader.readAsText(file, "utf-8");
  }

  function confirmar() {
    if (!preview) return;
    setTopError(null);
    startTransition(async () => {
      const r = await importarPacientesBatch(preview.rows);
      if (r.status === "ok") {
        setResult({
          rows_ok: r.rows_ok,
          rows_error: r.rows_error,
          errors: r.errors,
        });
      } else {
        setTopError(r.message);
      }
    });
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setTopError(null);
  }

  if (result) {
    const totalIntentado = result.rows_ok + result.rows_error;
    return (
      <div className="rounded-2xl border border-validation bg-validation-soft/40 p-6">
        <div className="flex items-start gap-3">
          <Check className="mt-1 h-5 w-5 text-validation" strokeWidth={2.2} />
          <div className="flex-1">
            <h2 className="text-h3 font-semibold text-ink-strong">
              Import completado
            </h2>
            <p className="mt-1 text-body-sm text-ink-muted">
              {result.rows_ok} {result.rows_ok === 1 ? "paciente guardado" : "pacientes guardados"} de{" "}
              {totalIntentado} intentados
              {result.rows_error > 0
                ? ` · ${result.rows_error} con error`
                : ""}
              .
            </p>
            {result.errors.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-caption font-medium text-warn">
                  Ver errores ({result.errors.length})
                </summary>
                <ul className="mt-2 space-y-1 text-caption text-ink-muted">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/pacientes")}
                className="lg-cta-primary"
              >
                Ver mi padrón
              </button>
              <button
                type="button"
                onClick={reset}
                className="lg-cta-ghost"
              >
                <RotateCcw className="h-4 w-4" />
                Importar otro archivo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {topError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-4 py-3 text-body-sm text-ink-strong"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
          <span>{topError}</span>
        </div>
      )}

      {!preview && (
        <label
          htmlFor="csv-input"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface px-6 py-12 transition-colors hover:border-validation hover:bg-validation-soft/20"
        >
          <Upload className="h-7 w-7 text-validation" strokeWidth={1.8} />
          <p className="text-body-sm font-semibold text-ink-strong">
            Click o arrastra tu CSV aquí
          </p>
          <p className="text-caption text-ink-muted">
            Máximo 5,000 filas · UTF-8
          </p>
          <input
            id="csv-input"
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="sr-only"
          />
        </label>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-3">
            <div className="flex items-center gap-2">
              <Check
                className="h-4 w-4 text-validation"
                strokeWidth={2.2}
              />
              <p className="text-body-sm">
                <span className="font-semibold text-ink-strong">
                  {preview.filename}
                </span>
                <span className="ml-2 text-ink-muted">
                  · {preview.rows.length} filas detectadas
                  {preview.errors.length > 0
                    ? ` · ${preview.errors.length} con problemas`
                    : ""}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-ink-strong"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
          </div>

          {preview.errors.length > 0 && (
            <details className="rounded-lg border border-warn-soft bg-warn-soft/40 p-3">
              <summary className="cursor-pointer text-caption font-semibold text-warn">
                {preview.errors.length} fila
                {preview.errors.length === 1 ? "" : "s"} con advertencias
              </summary>
              <ul className="mt-2 space-y-1 text-caption text-ink-muted">
                {preview.errors.slice(0, 30).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {preview.errors.length > 30 && (
                  <li className="italic">
                    …y {preview.errors.length - 30} más.
                  </li>
                )}
              </ul>
            </details>
          )}

          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-caption">
              <thead className="bg-surface-alt text-ink-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">#</th>
                  <th className="px-3 py-2 text-left font-semibold">Nombre</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Correo
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Teléfono
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Última consulta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {preview.rows.slice(0, 20).map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-ink-quiet">{idx + 1}</td>
                    <td className="px-3 py-2 text-ink-strong">
                      {[r.nombre, r.apellido_paterno, r.apellido_materno]
                        .filter(Boolean)
                        .join(" ") || (
                        <span className="text-rose">— vacío</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      {r.email ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      {r.telefono ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      {r.ultima_consulta_at ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 20 && (
              <p className="border-t border-line bg-surface-alt px-3 py-2 text-caption text-ink-soft">
                Mostrando primeras 20 de {preview.rows.length} filas. El
                import procesa todas.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={confirmar}
              disabled={pending}
              className="lg-cta-primary disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    strokeWidth={2.2}
                  />
                  Importando…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar import de {preview.rows.length} pacientes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="lg-cta-ghost disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
