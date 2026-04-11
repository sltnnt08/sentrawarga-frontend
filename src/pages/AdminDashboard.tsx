import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPinned, ShieldCheck, TriangleAlert, RefreshCw } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    APIError,
    getApiErrorDetails,
    reportsAPI,
    type ReportListItem,
    type ReportPriority,
    type ReportStatus,
} from "@/lib/api";
import {
    getCancelledByRoleLabel,
    REPORT_PRIORITY_BADGE_CLASS,
    REPORT_PRIORITY_LABEL,
    REPORT_STATUS_BADGE_CLASS,
    REPORT_STATUS_LABEL,
} from "@/lib/report-display";

type DensityLevel = "low" | "medium" | "high" | "critical";

type TileTheme = {
    id: string;
    label: string;
    url: string;
    attribution: string;
};

type ValidationErrorDetails = {
    errors?: Array<{
        path?: string;
        message?: string;
    }>;
};

const STATUS_OPTIONS: Array<{ label: string; value: ReportStatus | "ALL" }> = [
    { label: "Semua Status", value: "ALL" },
    { label: REPORT_STATUS_LABEL.PENDING, value: "PENDING" },
    { label: REPORT_STATUS_LABEL.VERIFIED, value: "VERIFIED" },
    { label: REPORT_STATUS_LABEL.IN_PROGRESS, value: "IN_PROGRESS" },
    { label: REPORT_STATUS_LABEL.RESOLVED, value: "RESOLVED" },
    { label: REPORT_STATUS_LABEL.REJECTED, value: "REJECTED" },
    { label: REPORT_STATUS_LABEL.CANCELLED, value: "CANCELLED" },
];

const PRIORITY_OPTIONS: Array<{ label: string; value: ReportPriority | "ALL" }> = [
    { label: "Semua Prioritas", value: "ALL" },
    { label: REPORT_PRIORITY_LABEL.LOW, value: "LOW" },
    { label: REPORT_PRIORITY_LABEL.NORMAL, value: "NORMAL" },
    { label: REPORT_PRIORITY_LABEL.HIGH, value: "HIGH" },
    { label: REPORT_PRIORITY_LABEL.CRITICAL, value: "CRITICAL" },
];

const TILE_THEMES: TileTheme[] = [
    {
        id: "osm-default",
        label: "OpenStreetMap",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    {
        id: "osm-humanitarian",
        label: "OSM Humanitarian",
        url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
];

const DENSITY_STYLES: Record<DensityLevel, { label: string; color: string; note: string }> = {
    low: { label: "Rendah", color: "#6BBF59", note: "1 kasus" },
    medium: { label: "Waspada", color: "#F2C14E", note: "2-3 kasus" },
    high: { label: "Tinggi", color: "#F18F01", note: "4-6 kasus" },
    critical: { label: "Kritis", color: "#D7263D", note: "7+ kasus" },
};

const toCellKey = (latitude: number, longitude: number) => `${latitude.toFixed(2)}:${longitude.toFixed(2)}`;

const getDensityLevel = (count: number): DensityLevel => {
    if (count >= 7) {
        return "critical";
    }

    if (count >= 4) {
        return "high";
    }

    if (count >= 2) {
        return "medium";
    }

    return "low";
};

const formatDate = (value: string) =>
    new Date(value).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const FitBounds = ({ points }: { points: Array<[number, number]> }) => {
    const map = useMap();

    useEffect(() => {
        if (points.length === 0) {
            return;
        }

        if (points.length === 1) {
            map.setView(points[0], 13);
            return;
        }

        map.fitBounds(points, { padding: [36, 36] });
    }, [map, points]);

    return null;
};

const AdminDashboard = () => {
    const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
    const [priorityFilter, setPriorityFilter] = useState<ReportPriority | "ALL">("ALL");
    const [tileTheme, setTileTheme] = useState<string>(TILE_THEMES[0].id);

    const { data, isLoading, isError, isFetching, refetch, error } = useQuery({
        queryKey: ["admin-reports", statusFilter, priorityFilter],
        queryFn: () =>
            reportsAPI.list({
                status: statusFilter === "ALL" ? undefined : statusFilter,
                priority: priorityFilter === "ALL" ? undefined : priorityFilter,
                limit: 50,
            }),
    });

    const errorSummary = useMemo(() => {
        if (!error) {
            return null;
        }

        if (error instanceof APIError) {
            const details = getApiErrorDetails<ValidationErrorDetails>(error);
            const validationLines = Array.isArray(details?.errors)
                ? details.errors
                    .map((issue) => {
                        const path = issue.path ? `${issue.path}: ` : "";
                        return issue.message ? `${path}${issue.message}` : null;
                    })
                    .filter((line): line is string => Boolean(line))
                : [];

            return {
                status: error.status,
                message: error.message,
                validationLines,
            };
        }

        return {
            status: null,
            message: "Terjadi kesalahan yang tidak dikenali",
            validationLines: [],
        };
    }, [error]);

    const reportItems = data?.data?.items;
    const reports = useMemo(() => reportItems ?? [], [reportItems]);

    const priorityCount = useMemo(() => {
        const initial: Record<ReportPriority, number> = {
            CRITICAL: 0,
            HIGH: 0,
            NORMAL: 0,
            LOW: 0,
        };

        for (const report of reports) {
            initial[report.priority] += 1;
        }

        return initial;
    }, [reports]);

    const cancelledByUserCount = useMemo(
        () => reports.filter((report) => report.status === "CANCELLED" && report.cancelledByRole === "USER").length,
        [reports],
    );

    const geocodedReports = useMemo(
        () =>
            reports.filter(
                (report): report is ReportListItem & { latitude: number; longitude: number } =>
                    typeof report.latitude === "number" && typeof report.longitude === "number",
            ),
        [reports],
    );

    const mapAreas = useMemo(() => {
        const areaBuckets = new Map<
            string,
            {
                key: string;
                latitude: number;
                longitude: number;
                reports: Array<ReportListItem & { latitude: number; longitude: number }>;
            }
        >();

        for (const report of geocodedReports) {
            const key = toCellKey(report.latitude, report.longitude);
            const existingArea = areaBuckets.get(key);

            if (existingArea) {
                existingArea.reports.push(report);
            } else {
                areaBuckets.set(key, {
                    key,
                    latitude: report.latitude,
                    longitude: report.longitude,
                    reports: [report],
                });
            }
        }

        return Array.from(areaBuckets.values())
            .map((area) => {
                const densityCount = area.reports.length;

                return {
                    ...area,
                    densityCount,
                    densityLevel: getDensityLevel(densityCount),
                };
            })
            .sort((a, b) => b.densityCount - a.densityCount);
    }, [geocodedReports]);

    const selectedTheme = TILE_THEMES.find((theme) => theme.id === tileTheme) || TILE_THEMES[0];

    const tableRows = useMemo(() => reports, [reports]);

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 lg:px-8 py-3 sm:h-16 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-foreground">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        <h1 className="text-lg font-bold">Dashboard Admin</h1>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                        <Link to="/" className="inline-flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Beranda
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 lg:px-8 py-8">
                <section className="space-y-4 mb-8">
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">Peta Situasi Laporan</h2>
                            <p className="text-sm text-muted-foreground">
                                Peta tampil di urutan pertama agar admin langsung melihat persebaran kasus berdasarkan kepadatan.
                            </p>
                        </div>

                        <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 sm:justify-end">
                            <select
                                value={tileTheme}
                                onChange={(event) => setTileTheme(event.target.value)}
                                className="h-9 w-full sm:w-auto rounded-md border border-input bg-background px-3 text-sm"
                                aria-label="Pilih gaya peta"
                            >
                                {TILE_THEMES.map((theme) => (
                                    <option key={theme.id} value={theme.id}>{theme.label}</option>
                                ))}
                            </select>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => refetch()} disabled={isFetching}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                                Muat Ulang
                            </Button>
                        </div>
                    </div>

                    <Card className="overflow-hidden">
                        <CardContent className="p-0 relative">
                            {isLoading ? (
                                <div className="h-[460px] flex items-center justify-center text-muted-foreground">
                                    Memuat data peta...
                                </div>
                            ) : (
                                <MapContainer center={[-6.2, 106.8]} zoom={11} className="h-[460px] w-full z-0">
                                    <TileLayer attribution={selectedTheme.attribution} url={selectedTheme.url} />

                                    {mapAreas.map((area) => {
                                        const densityStyle = DENSITY_STYLES[area.densityLevel];
                                        const latestReport = area.reports[0];
                                        const sampleTitles = area.reports.slice(0, 3).map((item) => item.title);

                                        return (
                                            <CircleMarker
                                                key={area.key}
                                                center={[area.latitude, area.longitude]}
                                                radius={Math.min(10 + area.densityCount * 2, 24)}
                                                pathOptions={{
                                                    color: densityStyle.color,
                                                    fillColor: densityStyle.color,
                                                    fillOpacity: 0.45,
                                                    weight: 2,
                                                }}
                                            >
                                                <Popup>
                                                    <div className="space-y-1">
                                                        <p className="font-semibold">{area.densityCount} laporan pada titik ini</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {latestReport?.address || "Lokasi tidak spesifik"}
                                                        </p>
                                                        <p className="text-xs">Kepadatan area: {area.densityCount} laporan</p>
                                                        <p className="text-xs">Contoh laporan:</p>
                                                        <ul className="list-disc pl-4 text-xs text-muted-foreground">
                                                            {sampleTitles.map((title) => (
                                                                <li key={`${area.key}-${title}`}>{title}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </Popup>
                                            </CircleMarker>
                                        );
                                    })}

                                    <FitBounds points={mapAreas.map((area) => [area.latitude, area.longitude])} />
                                </MapContainer>
                            )}

                            <div className="absolute top-3 left-3 bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
                                <p className="text-xs font-semibold text-foreground">Sinkronisasi Data</p>
                                <p className="text-xs text-muted-foreground mt-1">Tabel: {tableRows.length} laporan</p>
                                <p className="text-xs text-muted-foreground">Peta: {mapAreas.length} area</p>
                                <p className="text-xs text-muted-foreground">Bertitik koordinat: {geocodedReports.length} laporan</p>
                            </div>

                            <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg sm:w-56">
                                <p className="text-xs font-semibold text-foreground mb-2">Legenda</p>
                                <div className="space-y-1.5">
                                    {Object.values(DENSITY_STYLES).map((item) => (
                                        <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
                                            <span className="inline-flex items-center gap-2 text-foreground">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                {item.label}
                                            </span>
                                            <span className="text-muted-foreground">{item.note}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {isError && errorSummary && (
                        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 flex items-start gap-2">
                            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold">Gagal memuat data laporan untuk dashboard admin.</p>
                                {typeof errorSummary.status === "number" && (
                                    <p className="text-xs mt-1">HTTP Status: {errorSummary.status}</p>
                                )}
                                <p className="text-xs mt-1">Pesan API: {errorSummary.message}</p>
                                {errorSummary.validationLines.length > 0 && (
                                    <div className="mt-2 rounded-md border border-rose-200 bg-rose-100/60 dark:border-rose-500/40 dark:bg-rose-500/10 p-2">
                                        <p className="text-xs font-semibold mb-1">Detail validasi:</p>
                                        <ul className="text-xs list-disc pl-4 space-y-0.5">
                                            {errorSummary.validationLines.map((line) => (
                                                <li key={line}>{line}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Laporan Kritis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-rose-600">{priorityCount.CRITICAL}</p>
                            <p className="text-xs text-muted-foreground mt-1">Prioritas tertinggi</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Laporan Tinggi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-orange-600">{priorityCount.HIGH}</p>
                            <p className="text-xs text-muted-foreground mt-1">Perlu ditangani segera</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Laporan Menengah</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-amber-600">{priorityCount.NORMAL}</p>
                            <p className="text-xs text-muted-foreground mt-1">Butuh pemantauan berkala</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Laporan Rendah</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-emerald-600">{priorityCount.LOW}</p>
                            <p className="text-xs text-muted-foreground mt-1">Prioritas paling rendah</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Laporan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{reports.length}</p>
                            <p className="text-xs text-muted-foreground mt-1">Data sesuai filter saat ini</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Dibatalkan Pengguna</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{cancelledByUserCount}</p>
                            <p className="text-xs text-muted-foreground mt-1">Status dibatalkan oleh Pelapor</p>
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <MapPinned className="w-4 h-4 text-primary" />
                            <h3 className="text-lg font-semibold">Laporan Terbaru</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as ReportStatus | "ALL")}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                aria-label="Filter status"
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>

                            <select
                                value={priorityFilter}
                                onChange={(event) => setPriorityFilter(event.target.value as ReportPriority | "ALL")}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                aria-label="Filter prioritas"
                            >
                                {PRIORITY_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full min-w-[720px] text-sm">
                                <thead className="bg-muted/40 text-muted-foreground">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium">Judul</th>
                                        <th className="text-left px-4 py-3 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 font-medium">Prioritas</th>
                                        <th className="text-left px-4 py-3 font-medium">Lokasi</th>
                                        <th className="text-left px-4 py-3 font-medium">Dibuat</th>
                                        <th className="text-left px-4 py-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                Tidak ada laporan untuk filter saat ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        tableRows.map((report) => (
                                            <tr key={report.id} className="border-t border-border">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-foreground">{report.title}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Pelapor: {report.reporter?.name || "Anonim"}
                                                    </div>
                                                    {report.editedByReporter ? (
                                                        <Badge variant="outline" className="mt-2 border-indigo-300 text-indigo-700 dark:border-indigo-500/40 dark:text-indigo-200">
                                                            Telah diedit
                                                        </Badge>
                                                    ) : null}
                                                    {report.aiSpamFlag && (
                                                        <Badge variant="outline" className="mt-2 border-rose-300 text-rose-700 dark:border-rose-500/40 dark:text-rose-200">
                                                            Potensi Spam
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={REPORT_STATUS_BADGE_CLASS[report.status]}>
                                                        {REPORT_STATUS_LABEL[report.status]}
                                                    </Badge>
                                                    {report.status === "CANCELLED" ? (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Oleh: {getCancelledByRoleLabel(report.cancelledByRole)}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={REPORT_PRIORITY_BADGE_CLASS[report.priority]}>
                                                        {REPORT_PRIORITY_LABEL[report.priority]}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {typeof report.latitude === "number" && typeof report.longitude === "number"
                                                        ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`
                                                        : report.address || "Lokasi tidak tersedia"}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{formatDate(report.createdAt)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button size="sm" asChild>
                                                            <Link to={`/admin/laporan/${report.id}/tindak`}>Tindak</Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
