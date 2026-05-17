"use client";

import { useState, useMemo, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export type DataTableColumn<T> = {
  key: string;
  label: string;
  /** Renders a cell. Defaults to (row[key] as ReactNode). */
  render?: (row: T) => ReactNode;
  /** Field for sorting; if omitted, falls back to row[key]. */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Numeric columns get tabular-nums + right alignment */
  numeric?: boolean;
  /** Column width in tailwind class (e.g., "w-24") */
  width?: string;
  /** Sticky to left edge */
  sticky?: boolean;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Row-level click handler */
  onRowClick?: (row: T) => void;
  /** Optional tone per row */
  rowTone?: (row: T) => "critical" | "warning" | "success" | "neutral" | null;
  /** Empty state message */
  emptyMessage?: string;
  /** Max height before vertical scroll */
  maxHeight?: string;
  className?: string;
  /** Key extractor for stable list rendering */
  getRowKey: (row: T, index: number) => string;
  /** Whether to enable per-column sort */
  sortable?: boolean;
};

const ROW_TONE: Record<
  "critical" | "warning" | "success" | "neutral",
  string
> = {
  critical: "bg-code-red-bg/40 hover:bg-code-red-bg/60",
  warning: "bg-code-amber-bg/30 hover:bg-code-amber-bg/50",
  success: "bg-code-green-bg/20 hover:bg-code-green-bg/40",
  neutral: "hover:bg-surface-alt/50",
};

/**
 * DataTable — tabla densa con sticky header + ordenamiento + filas
 * con tono semántico.
 *
 * Cumple HIMSS effective info presentation + AMIA visibility. Diseñada
 * para listas largas de pacientes, peticiones, resultados — patrón
 * Cerner FirstNet tracking board.
 */
export function DataTable<T>({
  data,
  columns,
  onRowClick,
  rowTone,
  emptyMessage = "Sin registros.",
  maxHeight,
  className,
  getRowKey,
  sortable = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortable || !sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    const getter = (row: T) => {
      if (col.sortValue) return col.sortValue(row);
      return (row as unknown as Record<string, unknown>)[col.key] as
        | string
        | number
        | null
        | undefined;
    };
    return [...data].sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [data, columns, sortKey, sortDir, sortable]);

  function onHeaderClick(key: string) {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div
      className={`overflow-auto rounded-xl border border-line bg-surface ${className ?? ""}`}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className="clinical-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              const Icon = !isSorted
                ? ChevronsUpDown
                : sortDir === "asc"
                  ? ChevronUp
                  : ChevronDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={`${col.width ?? ""} ${col.numeric ? "text-right tabular-nums" : "text-left"} ${col.sticky ? "sticky left-0 bg-surface-alt z-20" : ""}`}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onHeaderClick(col.key)}
                      className="inline-flex items-center gap-1 hover:text-ink-strong"
                    >
                      {col.label}
                      <Icon
                        className={`h-3 w-3 ${isSorted ? "text-ink-strong" : "text-ink-quiet"}`}
                        strokeWidth={2.2}
                      />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-caption text-ink-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => {
              const tone = rowTone ? rowTone(row) ?? "neutral" : "neutral";
              return (
                <tr
                  key={getRowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`${ROW_TONE[tone]} ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col) => {
                    const content = col.render
                      ? col.render(row)
                      : ((row as unknown as Record<string, unknown>)[
                          col.key
                        ] as ReactNode);
                    return (
                      <td
                        key={col.key}
                        className={`${col.numeric ? "text-right tabular-nums" : ""} ${col.sticky ? "sticky left-0 bg-inherit" : ""}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
