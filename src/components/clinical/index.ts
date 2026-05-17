/**
 * Clinical components — design system v2 (Tier 1).
 *
 * Aligned with AMIA 14 principles + HIMSS 9 attributes + FDA CDS 2026.
 * All components support light + dark mode through CSS variable tokens.
 *
 * Import from a single entry point:
 *   import { PatientHeader, ClinicalMetric, StatusBadge } from "@/components/clinical";
 */

export { PatientHeader } from "./patient-header";
export type { PatientHeaderProps } from "./patient-header";

export { ClinicalMetric } from "./clinical-metric";
export type { ClinicalMetricProps } from "./clinical-metric";

export { ClinicalAlert } from "./clinical-alert";

export { WorkflowStep } from "./workflow-step";
export type { WorkflowStepProps } from "./workflow-step";

export { DataTable } from "./data-table";
export type { DataTableColumn, DataTableProps } from "./data-table";

export { StatusBadge } from "./status-badge";
export type { StatusTone } from "./status-badge";

export { TrendChart } from "./trend-chart";
export type { TrendChartTone } from "./trend-chart";

export { CodeStatus } from "./code-status";
export type { CodeKind } from "./code-status";
