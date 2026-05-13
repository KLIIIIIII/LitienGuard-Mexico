"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Mic, Square, Loader2, AlertCircle } from "lucide-react";
import { generarNotaScribe } from "./actions";

type Mode = "idle" | "recording" | "uploading" | "transcribing" | "error";

export function ScribeForm({
  consultaId,
}: {
  consultaId?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number>(0);
  const formRef = useRef<HTMLFormElement | null>(null);

  function pickFile(f: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setError(null);
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
    setDuration(null);
  }

  async function startRecording() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: mime });
        const audioFile = new File(
          [blob],
          `consulta-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`,
          { type: mime },
        );
        pickFile(audioFile);
        setDuration(elapsed);
        stream.getTracks().forEach((t) => t.stop());
        setMode("idle");
      };

      rec.start();
      recorderRef.current = rec;
      setMode("recording");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Permiso denegado";
      setError(
        `No pudimos acceder al micrófono (${msg}). Sube un archivo de audio en su lugar.`,
      );
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && !f.type.startsWith("audio/")) {
      setError("El archivo debe ser de audio (mp3, wav, m4a, webm, etc.).");
      return;
    }
    pickFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f && !f.type.startsWith("audio/")) {
      setError("El archivo debe ser de audio.");
      return;
    }
    pickFile(f);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Sube o graba un audio primero.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("audio", file);
    if (consultaId) fd.set("consulta_id", consultaId);
    setError(null);
    setMode("transcribing");
    startTransition(async () => {
      const result = await generarNotaScribe(fd);
      if (result.status === "ok") {
        // Si venimos de una consulta, regresar a la ficha
        const dest = consultaId
          ? `/dashboard/consultas/${consultaId}`
          : `/dashboard/notas/${result.notaId}`;
        router.push(dest);
        router.refresh();
      } else {
        setError(result.message);
        setMode("error");
      }
    });
  }

  const busy = pending || mode === "transcribing";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="space-y-8"
      aria-busy={busy}
    >
      <section className="lg-card space-y-5">
        <div>
          <p className="lg-eyebrow-validation">Paso 1 — Audio</p>
          <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
            Graba o sube el audio de la consulta
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Máx 25 MB · español neutro · sin nombres completos del paciente.
          </p>
        </div>

        {/* Recording or upload area */}
        {file ? (
          <div className="rounded-xl border border-validation-soft bg-validation-soft px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-body-sm font-semibold text-ink-strong">
                  {file.name}
                </div>
                <div className="text-caption text-ink-muted">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                  {duration != null
                    ? ` · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")} min`
                    : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => pickFile(null)}
                disabled={busy}
                className="text-caption text-ink-muted underline hover:text-ink-strong"
              >
                Cambiar
              </button>
            </div>
            {previewUrl && (
              <audio
                src={previewUrl}
                controls
                className="mt-3 w-full"
                style={{ height: 40 }}
              />
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Record */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-canvas px-4 py-6 text-center">
              {mode === "recording" ? (
                <>
                  <span className="relative flex h-12 w-12 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-rose/40" />
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-rose text-surface">
                      <Mic className="h-5 w-5" />
                    </span>
                  </span>
                  <p className="mt-3 text-body-sm font-medium text-ink-strong">
                    Grabando…
                  </p>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="lg-cta-ghost mt-3"
                  >
                    <Square className="h-4 w-4" />
                    Detener
                  </button>
                </>
              ) : (
                <>
                  <Mic className="h-7 w-7 text-validation" />
                  <p className="mt-3 text-body-sm font-medium text-ink-strong">
                    Graba directo desde el navegador
                  </p>
                  <p className="text-caption text-ink-soft">
                    Te pediremos permiso de micrófono
                  </p>
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={busy}
                    className="lg-cta-primary mt-3"
                  >
                    Empezar grabación
                  </button>
                </>
              )}
            </div>

            {/* Upload */}
            <label
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-canvas px-4 py-6 text-center transition-colors hover:border-line-strong hover:bg-surface-alt"
            >
              <Upload className="h-7 w-7 text-accent" />
              <p className="mt-3 text-body-sm font-medium text-ink-strong">
                Sube un archivo
              </p>
              <p className="text-caption text-ink-soft">
                mp3, wav, m4a, webm · arrastra o haz click
              </p>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                disabled={busy}
                onChange={onFileInput}
              />
            </label>
          </div>
        )}
      </section>

      <section className="lg-card space-y-5">
        <div>
          <p className="lg-eyebrow-validation">Paso 2 — Datos del paciente</p>
          <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
            Identificación clínica
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Todos los campos son opcionales. Asegúrate de tener consentimiento
            del paciente para registrar datos personales (NOM-024, LFPDPPP).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label
              htmlFor="paciente_nombre"
              className="block text-caption font-medium text-ink-strong"
            >
              Nombre(s)
            </label>
            <input
              id="paciente_nombre"
              name="paciente_nombre"
              type="text"
              placeholder="Ana María"
              maxLength={80}
              className="lg-input"
              disabled={busy}
              autoComplete="off"
              suppressHydrationWarning
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="paciente_apellido_paterno"
              className="block text-caption font-medium text-ink-strong"
            >
              Apellido paterno
            </label>
            <input
              id="paciente_apellido_paterno"
              name="paciente_apellido_paterno"
              type="text"
              placeholder="Hernández"
              maxLength={80}
              className="lg-input"
              disabled={busy}
              autoComplete="off"
              suppressHydrationWarning
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="paciente_apellido_materno"
              className="block text-caption font-medium text-ink-strong"
            >
              Apellido materno
            </label>
            <input
              id="paciente_apellido_materno"
              name="paciente_apellido_materno"
              type="text"
              placeholder="López"
              maxLength={80}
              className="lg-input"
              disabled={busy}
              autoComplete="off"
              suppressHydrationWarning
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label
              htmlFor="paciente_iniciales"
              className="block text-caption font-medium text-ink-strong"
            >
              Iniciales <span className="text-ink-soft">(opcional)</span>
            </label>
            <input
              id="paciente_iniciales"
              name="paciente_iniciales"
              type="text"
              placeholder="AGN"
              maxLength={8}
              className="lg-input"
              disabled={busy}
              autoComplete="off"
              suppressHydrationWarning
            />
            <p className="text-caption text-ink-soft">
              Útil si prefieres anonimizar la nota.
            </p>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="paciente_edad"
              className="block text-caption font-medium text-ink-strong"
            >
              Edad (años)
            </label>
            <input
              id="paciente_edad"
              name="paciente_edad"
              type="number"
              min={0}
              max={130}
              placeholder="54"
              className="lg-input"
              disabled={busy}
              suppressHydrationWarning
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="paciente_sexo"
              className="block text-caption font-medium text-ink-strong"
            >
              Sexo
            </label>
            <select
              id="paciente_sexo"
              name="paciente_sexo"
              defaultValue=""
              className="lg-input appearance-none pr-10"
              disabled={busy}
            >
              <option value="">—</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="O">Otro / no especificado</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-warn-soft bg-warn-soft px-4 py-3 text-caption text-ink-strong">
          <strong>Privacidad:</strong> los datos del paciente se guardan
          encriptados y el audio se procesa por nuestro sistema de
          transcripción. El médico es responsable de obtener consentimiento y
          manejar el expediente conforme a la NOM-024-SSA3-2012 y la LFPDPPP.
        </div>
      </section>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-lg border border-rose-soft bg-rose-soft px-4 py-3 text-body-sm text-ink-strong"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 text-rose" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !file}
          className="lg-cta-primary disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "transcribing"
                ? "Transcribiendo y estructurando…"
                : "Procesando…"}
            </>
          ) : (
            <>Generar nota SOAP</>
          )}
        </button>
        <p className="text-caption text-ink-soft">
          Esto tarda ~30-60 segundos. No cierres la pestaña.
        </p>
      </div>
    </form>
  );
}
