import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, ImageOff, MapPin, User } from "lucide-react";
import { reportsAPI, type ReportListItem, type ReportStatus } from "@/lib/api";
import { REPORT_STATUS_LABEL } from "@/lib/report-display";

const statusColor: Record<ReportStatus, string> = {
    PENDING: "bg-accent text-accent-foreground",
    VERIFIED: "bg-primary-light text-primary",
    IN_PROGRESS: "bg-primary-light text-primary",
    RESOLVED: "bg-primary text-primary-foreground",
    REJECTED: "bg-destructive/15 text-destructive",
    CANCELLED: "bg-muted text-muted-foreground",
};

const LatestReportsSection = () => {
    const { data, isPending, isError } = useQuery({
        queryKey: ["landing-latest-reports"],
        queryFn: async () => {
            const response = await reportsAPI.list({ limit: 6, includeTotal: false });
            const items = response.data?.items;

            if (!Array.isArray(items)) {
                throw new Error("Format data laporan tidak valid");
            }

            return items;
        },
        staleTime: 10000,
    });

    const reports = useMemo(
        () =>
            [...(data ?? [])]
                .filter((r) => r.status === "VERIFIED" || r.status === "RESOLVED")
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 6),
        [data],
    );

    return (
        <section id="laporan" className="py-20 lg:py-28 bg-primary-light/50">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="text-center mb-14">
                    <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
                        Laporan Terbaru
                    </p>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
                        Laporan dari Warga
                    </h2>
                </div>

                {isPending ? (
                    <p className="text-center text-muted-foreground">Memuat laporan terbaru...</p>
                ) : isError ? (
                    <p className="text-center text-muted-foreground">Data laporan belum bisa dimuat saat ini.</p>
                ) : reports.length === 0 ? (
                    <p className="text-center text-muted-foreground">Belum ada laporan.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {reports.map((r) => (
                            <div key={r.id} className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-shadow group">
                                <div className="relative h-48 overflow-hidden">
                                    {r.reportImages?.[0]?.url ? (
                                        <img
                                            src={r.reportImages[0].url}
                                            alt={r.title}
                                            loading="lazy"
                                            width={640}
                                            height={512}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                                            <span className="inline-flex items-center gap-2 text-sm font-medium">
                                                <ImageOff className="w-4 h-4" />
                                                Tanpa foto
                                            </span>
                                        </div>
                                    )}
                                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${statusColor[r.status]}`}>
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {REPORT_STATUS_LABEL[r.status]}
                                    </span>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-foreground mb-2 line-clamp-2">{r.title}</h3>
                                    <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                                        {r.address || "Lokasi tidak tersedia"}
                                    </p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                                        <User className="w-4 h-4 shrink-0 text-primary" />
                                        {r.reporter?.name || "Anonim"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default LatestReportsSection;
