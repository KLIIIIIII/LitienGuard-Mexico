"use client";

import { useState } from "react";

export type ToothState =
  | "sano"
  | "caries"
  | "restaurado"
  | "endodoncia"
  | "corona"
  | "implante"
  | "ausente";

export const TOOTH_STATES: Array<{
  value: ToothState;
  label: string;
  fill: string;
  border: string;
  textColor: string;
}> = [
  { value: "sano", label: "Sano", fill: "#FFFFFF", border: "#D8D4C8", textColor: "#2C2B27" },
  { value: "caries", label: "Caries", fill: "#FBE9C8", border: "#D49B3F", textColor: "#7A4F0F" },
  { value: "restaurado", label: "Restaurado", fill: "#D6E8DC", border: "#4A6B5B", textColor: "#274B39" },
  { value: "endodoncia", label: "Endodoncia", fill: "#D0DEED", border: "#3F6B95", textColor: "#1F3F5E" },
  { value: "corona", label: "Corona", fill: "#2C2B27", border: "#2C2B27", textColor: "#FFFFFF" },
  { value: "implante", label: "Implante", fill: "#8E8B7E", border: "#5C5A52", textColor: "#FFFFFF" },
  { value: "ausente", label: "Ausente", fill: "#F4F2EB", border: "#B8B4A8", textColor: "#8B887F" },
];

const STATE_BY_VALUE: Record<ToothState, (typeof TOOTH_STATES)[number]> =
  TOOTH_STATES.reduce(
    (acc, s) => ({ ...acc, [s.value]: s }),
    {} as Record<ToothState, (typeof TOOTH_STATES)[number]>,
  );

// FDI notation, ordered as seen when facing the patient.
const UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export type OdontogramState = Record<number, ToothState>;

export function defaultOdontogram(): OdontogramState {
  const s: OdontogramState = {};
  for (const n of [...UPPER_ROW, ...LOWER_ROW]) s[n] = "sano";
  return s;
}

interface OdontogramProps {
  state: OdontogramState;
  onChange?: (next: OdontogramState) => void;
  activeState: ToothState;
  readOnly?: boolean;
}

export function Odontogram({
  state,
  onChange,
  activeState,
  readOnly = false,
}: OdontogramProps) {
  const [hover, setHover] = useState<number | null>(null);

  function applyState(tooth: number) {
    if (readOnly || !onChange) return;
    onChange({ ...state, [tooth]: activeState });
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      {/*
       * Wrapper con scroll horizontal en mobile. Cada arcada usa un
       * min-width que fuerza piezas de ~40px (cómodas para tap con
       * dedo). En md+, el min-width se elimina y las piezas vuelven
       * a llenar el ancho disponible.
       */}
      <div className="-mx-1 overflow-x-auto md:mx-0 md:overflow-visible">
        <div className="min-w-[640px] space-y-4 px-1 md:min-w-0 md:px-0">
          <ToothRow
            teeth={UPPER_ROW}
            state={state}
            onClick={applyState}
            onHover={setHover}
            hover={hover}
            readOnly={readOnly}
            label="Superior"
          />
          <div className="h-px bg-line-soft" aria-hidden />
          <ToothRow
            teeth={LOWER_ROW}
            state={state}
            onClick={applyState}
            onHover={setHover}
            hover={hover}
            readOnly={readOnly}
            label="Inferior"
          />
        </div>
      </div>
      {hover !== null && (
        <p className="mt-3 text-caption text-ink-muted">
          Diente <strong className="font-mono">{hover}</strong> ·{" "}
          {STATE_BY_VALUE[state[hover] ?? "sano"].label}
        </p>
      )}
      <p className="mt-2 text-[0.65rem] text-ink-soft md:hidden">
        Desliza horizontalmente para ver toda la arcada. Tap en cada pieza
        para marcar su estado.
      </p>
    </div>
  );
}

function ToothRow({
  teeth,
  state,
  onClick,
  onHover,
  hover,
  readOnly,
  label,
}: {
  teeth: number[];
  state: OdontogramState;
  onClick: (tooth: number) => void;
  onHover: (tooth: number | null) => void;
  hover: number | null;
  readOnly: boolean;
  label: string;
}) {
  return (
    <div>
      <p className="text-caption uppercase tracking-eyebrow text-ink-soft mb-2">
        {label}
      </p>
      <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
        {teeth.map((n, i) => {
          const s = STATE_BY_VALUE[state[n] ?? "sano"];
          const isActive = hover === n;
          // Visual separator between right (1x/4x) and left (2x/3x) quadrants
          const showGap = i === 7;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onClick(n)}
              onMouseEnter={() => onHover(n)}
              onMouseLeave={() => onHover(null)}
              disabled={readOnly}
              className={`relative aspect-[3/4] rounded-md border-2 text-[0.6rem] font-mono font-semibold transition-all ${
                showGap ? "ml-1" : ""
              } ${isActive ? "ring-2 ring-validation ring-offset-1" : ""} ${
                readOnly ? "cursor-default" : "cursor-pointer hover:scale-105"
              }`}
              style={{
                backgroundColor: s.fill,
                borderColor: s.border,
                color: s.textColor,
                borderStyle: state[n] === "ausente" ? "dashed" : "solid",
              }}
              aria-label={`Diente ${n}, estado ${s.label}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
