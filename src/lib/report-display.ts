import type { ReportCategory, ReportPriority, ReportStatus } from "@/lib/api";

export const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  CRIMINAL: "Kriminal",
  TRASH: "Sampah",
  FLOOD: "Banjir",
  POLLUTION: "Pencemaran",
  ROADS_ISSUE: "Jalan Rusak",
  PUBLIC_DISTURBANCE: "Gangguan Umum",
  ACCIDENTS: "Kecelakaan",
  OTHERS: "Lainnya",
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: "Menunggu Verifikasi",
  VERIFIED: "Terverifikasi",
  IN_PROGRESS: "Sedang Ditangani",
  RESOLVED: "Selesai",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export const REPORT_PRIORITY_LABEL: Record<ReportPriority, string> = {
  LOW: "Rendah",
  NORMAL: "Normal",
  HIGH: "Tinggi",
  CRITICAL: "Kritis",
};

export const REPORT_STATUS_BADGE_CLASS: Record<ReportStatus, string> = {
  PENDING: "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
  VERIFIED: "border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200",
  IN_PROGRESS: "border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-200",
  RESOLVED: "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  REJECTED: "border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200",
  CANCELLED: "border-zinc-300 bg-zinc-200 text-zinc-900 dark:border-zinc-500/40 dark:bg-zinc-500/20 dark:text-zinc-100",
};

export const REPORT_PRIORITY_BADGE_CLASS: Record<ReportPriority, string> = {
  LOW: "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  NORMAL: "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-500/40 dark:bg-slate-500/20 dark:text-slate-100",
  HIGH: "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
  CRITICAL: "border-red-300 bg-red-100 text-red-900 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200",
};

export const REPORT_CATEGORY_OPTIONS: Array<{ value: ReportCategory; label: string }> = [
  { value: "TRASH", label: REPORT_CATEGORY_LABEL.TRASH },
  { value: "FLOOD", label: REPORT_CATEGORY_LABEL.FLOOD },
  { value: "ROADS_ISSUE", label: REPORT_CATEGORY_LABEL.ROADS_ISSUE },
  { value: "POLLUTION", label: REPORT_CATEGORY_LABEL.POLLUTION },
  { value: "PUBLIC_DISTURBANCE", label: REPORT_CATEGORY_LABEL.PUBLIC_DISTURBANCE },
  { value: "ACCIDENTS", label: REPORT_CATEGORY_LABEL.ACCIDENTS },
  { value: "CRIMINAL", label: REPORT_CATEGORY_LABEL.CRIMINAL },
  { value: "OTHERS", label: REPORT_CATEGORY_LABEL.OTHERS },
];

export const getCategoryLabel = (value: ReportCategory) => REPORT_CATEGORY_LABEL[value] ?? value;

export const getCancelledByRoleLabel = (value?: "USER" | "ADMIN" | null) => {
  if (value === "ADMIN") {
    return "Admin";
  }

  if (value === "USER") {
    return "Pengguna";
  }

  return "Tidak diketahui";
};
