"use client";

import { useEffect, useState } from "react";
import { Share2, Check } from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";
import { formatNumberMX } from "@/lib/utils";

const SAVINGS_FACTOR = 0.85;
const WEEKS_PER_YEAR = 48;
const MONTHS_PER_YEAR = 12;

interface Inputs {
  horasDocPorDia: number;
  diasSemana: number;
  tarifaPorHora: number;
}

function calcular({ horasDocPorDia, diasSemana, tarifaPorHora }: Inputs) {
  const horasDocSemana = horasDocPorDia * diasSemana;
  const horasRecuperadasSemana = horasDocSemana * SAVINGS_FACTOR;
  const ahorroSemanalMxn = horasRecuperadasSemana * tarifaPorHora;
  const ahorroAnualMxn = ahorroSemanalMxn * WEEKS_PER_YEAR;
  const ahorroMensualMxn = ahorroAnualMxn / MONTHS_PER_YEAR;
  const horasRecuperadasAnual = horasRecuperadasSemana * WEEKS_PER_YEAR;
  return {
    horasRecuperadasSemana,
    horasRecuperadasAnual,
    ahorroSemanalMxn,
    ahorroMensualMxn,
    ahorroAnualMxn,
  };
}

function parseQueryInt(
  value: string | null,
  min: number,
  max: number,
): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
}

export function Calculadora() {
  const [horas, setHoras] = useState(4);
  const [dias, setDias] = useState(5);
  const [tarifa, setTarifa] = useState(2400);
  const [copied, setCopied] = useState(false);

  // Read URL params on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const h = parseQueryInt(params.get("h"), 1, 12);
    const d = parseQueryInt(params.get("d"), 1, 7);
    const t = parseQueryInt(params.get("t"), 100, 50000);
    if (h !== null) setHoras(h);
    if (d !== null) setDias(d);
    if (t !== null) setTarifa(t);
  }, []);

  // Write URL params on change (no history pollution)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    params.set("h", String(horas));
    params.set("d", String(dias));
    params.set("t", String(tarifa));
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
  }, [horas, dias, tarifa]);

  const r = calcular({
    horasDocPorDia: horas,
    diasSemana: dias,
    tarifaPorHora: tarifa,
  });

  function copyShareLink() {
    if (typeof window === "undefined") return;
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Inputs */}
      <div className="space-y-7">
        <div>
          <Eyebrow>Tus números</Eyebrow>
          <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
            Ajusta a tu práctica.
          </h2>
          <p className="mt-2 text-body-sm text-ink-muted">
            Los defaults vienen de Ross/FunSalud 2026 y promedio de consulta
            privada en CDMX/MTY/GDL.
          </p>
        </div>

        <InputRow
          label="Horas al día en documentación"
          sublabel="SOAP, recetas, expediente, notas. No incluye consulta presencial."
          value={horas}
          onChange={setHoras}
          min={1}
          max={10}
          step={1}
          unit="hrs"
        />

        <InputRow
          label="Días que trabajas a la semana"
          sublabel="Cuenta solo días con consulta — no admin ni educación."
          value={dias}
          onChange={setDias}
          min={1}
          max={7}
          step={1}
          unit="días"
        />

        <InputRow
          label="Tu tarifa por hora trabajada (MXN)"
          sublabel="Tarifa por consulta × consultas/hora. Si das 3 consultas/hora a $800, son $2,400/hr."
          value={tarifa}
          onChange={setTarifa}
          min={200}
          max={10000}
          step={100}
          unit="$/hr"
        />
      </div>

      {/* Output */}
      <div className="space-y-5">
        <div>
          <Eyebrow tone="validation">Tu ahorro con LitienGuard Scribe</Eyebrow>
          <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
            Lo que recuperas.
          </h2>
        </div>

        <ResultCard
          big={`$${formatNumberMX(Math.round(r.ahorroMensualMxn))}`}
          unit="MXN al mes"
          label="Valor del tiempo que LitienGuard Scribe te regresa cada mes."
          tone="primary"
        />

        <ResultCard
          big={`$${formatNumberMX(Math.round(r.ahorroAnualMxn))}`}
          unit="MXN al año"
          label="Proyección anual con 48 semanas trabajadas."
          tone="secondary"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard
            big={`${Math.round(r.horasRecuperadasSemana)}`}
            unit="hrs/semana"
            label="Tiempo libre recuperado."
            tone="muted"
          />
          <ResultCard
            big={`${formatNumberMX(Math.round(r.horasRecuperadasAnual))}`}
            unit="hrs/año"
            label="≈ 6 semanas de vida fuera del expediente."
            tone="muted"
          />
        </div>

        <button
          type="button"
          onClick={copyShareLink}
          className="lg-cta-ghost mt-2 inline-flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" strokeWidth={2.2} />
              Liga copiada
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" strokeWidth={2.2} />
              Compartir mi cálculo
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface InputRowProps {
  label: string;
  sublabel: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

function InputRow({
  label,
  sublabel,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: InputRowProps) {
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseInt(e.target.value, 10);
    if (Number.isNaN(raw)) return;
    const clamped = Math.max(min, Math.min(max, raw));
    onChange(clamped);
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-body font-semibold text-ink-strong">
          {label}
        </label>
        <div className="flex items-baseline gap-1">
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className="w-24 rounded-md border border-line bg-canvas px-2 py-1 text-right text-body-sm font-semibold text-ink-strong focus:border-validation focus:outline-none"
          />
          <span className="text-caption text-ink-soft">{unit}</span>
        </div>
      </div>
      <p className="mt-1 text-caption text-ink-muted">{sublabel}</p>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        min={min}
        max={max}
        step={step}
        className="mt-3 w-full accent-validation"
        aria-label={label}
      />
    </div>
  );
}

interface ResultCardProps {
  big: string;
  unit: string;
  label: string;
  tone: "primary" | "secondary" | "muted";
}

function ResultCard({ big, unit, label, tone }: ResultCardProps) {
  const toneClasses = {
    primary: "border-validation bg-validation-soft",
    secondary: "border-line bg-surface",
    muted: "border-line bg-surface",
  } as const;
  const bigClasses = {
    primary: "text-validation",
    secondary: "text-ink-strong",
    muted: "text-ink-strong",
  } as const;

  return (
    <div className={`rounded-xl border p-5 ${toneClasses[tone]}`}>
      <p
        className={`text-display font-semibold leading-none tracking-tight tabular-nums ${bigClasses[tone]}`}
      >
        {big}
      </p>
      <p className="mt-1 text-caption font-medium text-ink-strong">{unit}</p>
      <p className="mt-2 text-caption text-ink-muted">{label}</p>
    </div>
  );
}
