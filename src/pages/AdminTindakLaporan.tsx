import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { reportsAPI, type ReportStatus } from "@/lib/api";
import {
    getCancelledByRoleLabel,
    REPORT_PRIORITY_BADGE_CLASS,
    REPORT_PRIORITY_LABEL,
    REPORT_STATUS_BADGE_CLASS,
    REPORT_STATUS_LABEL,
    getCategoryLabel,
} from "@/lib/report-display";

const STATUS_ACTION_OPTIONS = (Object.entries(REPORT_STATUS_LABEL) as Array<[ReportStatus, string]>).map(
    ([value, label]) => ({ value, label }),
);

const formatDate = (value: string) =>
    new Date(value).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const AdminTindakLaporan = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [nextStatus, setNextStatus] = useState<ReportStatus | "">("");
    const [feedback, setFeedback] = useState("");

    const detailQuery = useQuery({
        queryKey: ["admin-report-detail", id],
        queryFn: () => reportsAPI.detail(id as string),
        enabled: Boolean(id),
    });

    const report = detailQuery.data?.data;

    const effectiveStatus = useMemo(() => {
        if (nextStatus) {
            return nextStatus;
        }

        return report?.status ?? "";
    }, [nextStatus, report?.status]);

    const submitMutation = useMutation({
        mutationFn: () =>
            reportsAPI.updateStatus(
                id as string,
                effectiveStatus as ReportStatus,
                feedback.trim().length > 0 ? feedback.trim() : undefined,
            ),
        onSuccess: () => {
            toast({
                title: "Tindakan disimpan",
                description: "Status laporan dan feedback admin berhasil dikirim.",
            });

            void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
            void queryClient.invalidateQueries({ queryKey: ["admin-report-detail", id] });
            navigate("/admin");
        },
        onError: (error) => {
            toast({
                title: "Gagal menyimpan tindakan",
                description: error instanceof Error ? error.message : "Terjadi kesalahan.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!effectiveStatus) {
            toast({
                title: "Status belum dipilih",
                description: "Pilih status laporan sebelum menyimpan.",
                variant: "destructive",
            });
            return;
        }

        if (feedback.trim().length > 0 && feedback.trim().length < 3) {
            toast({
                title: "Feedback terlalu pendek",
                description: "Feedback minimal 3 karakter atau kosongkan jika tidak diperlukan.",
                variant: "destructive",
            });
            return;
        }

        submitMutation.mutate();
    };

    if (!id) {
        return (
            <div className="min-h-screen bg-background">
                <main className="container mx-auto px-4 lg:px-8 py-8">
                    <Card>
                        <CardContent className="py-8">
                            <p className="text-sm text-muted-foreground">ID laporan tidak valid.</p>
                            <Button variant="outline" className="mt-4" asChild>
                                <Link to="/admin">Kembali ke Dashboard Admin</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 lg:px-8 py-3 sm:h-16 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Tindak Laporan</h1>
                        <p className="text-xs text-muted-foreground">Perbarui status laporan dan kirim feedback privat ke pelapor.</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                        <Link to="/admin" className="inline-flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Dashboard
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 lg:px-8 py-8 space-y-6">
                {detailQuery.isLoading ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">Memuat detail laporan...</CardContent>
                    </Card>
                ) : detailQuery.isError || !report ? (
                    <Card>
                        <CardContent className="py-8 space-y-3">
                            <p className="text-sm text-rose-700 dark:text-rose-300">Gagal memuat detail laporan.</p>
                            <Button variant="outline" asChild>
                                <Link to="/admin">Kembali ke Dashboard Admin</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>{report.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">{report.description}</p>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className={REPORT_STATUS_BADGE_CLASS[report.status]}>
                                        Status saat ini: {REPORT_STATUS_LABEL[report.status]}
                                    </Badge>
                                    <Badge variant="outline" className={REPORT_PRIORITY_BADGE_CLASS[report.priority]}>
                                        Prioritas: {REPORT_PRIORITY_LABEL[report.priority]}
                                    </Badge>
                                    {report.editedByReporter ? (
                                        <Badge variant="outline" className="border-indigo-300 text-indigo-700 dark:border-indigo-500/40 dark:text-indigo-200">
                                            Telah diedit
                                        </Badge>
                                    ) : null}
                                    {report.aiSpamFlag ? (
                                        <Badge variant="outline" className="border-rose-300 text-rose-700 dark:border-rose-500/40 dark:text-rose-200">
                                            Potensi Spam
                                        </Badge>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Kategori laporan</p>
                                    <div className="flex flex-wrap gap-2">
                                        {report.category.map((item) => (
                                            <Badge key={`tindak-${report.id}-${item}`} variant="outline">
                                                {getCategoryLabel(item)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Dibuat: {formatDate(report.createdAt)}</p>
                                    <p>Diperbarui: {formatDate(report.updatedAt)}</p>
                                    {report.status === "CANCELLED" ? (
                                        <p>Dibatalkan oleh: {getCancelledByRoleLabel(report.cancelledByRole)}</p>
                                    ) : null}
                                    {report.address ? <p>Alamat: {report.address}</p> : null}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Gambar Laporan</p>
                                    {Array.isArray(report.reportImages) && report.reportImages.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {report.reportImages.map((image) => (
                                                <img
                                                    key={image.id}
                                                    src={image.url}
                                                    alt="Gambar laporan"
                                                    className="w-full h-52 object-cover rounded-md border border-border"
                                                    loading="lazy"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Belum ada gambar pada laporan ini.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Aksi Tindakan Admin</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status baru</Label>
                                        <select
                                            id="status"
                                            value={effectiveStatus}
                                            onChange={(event) => setNextStatus(event.target.value as ReportStatus)}
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            {STATUS_ACTION_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-muted-foreground">Daftar status diambil dari enum status laporan dengan label yang ramah pengguna.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="feedback">Feedback admin untuk pelapor (opsional)</Label>
                                        <Textarea
                                            id="feedback"
                                            value={feedback}
                                            onChange={(event) => setFeedback(event.target.value)}
                                            placeholder="Tulis masukan untuk pelapor. Feedback ini bersifat privat dan hanya dikirim ke pelapor."
                                            maxLength={1000}
                                            className="min-h-[120px]"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button type="submit" disabled={submitMutation.isPending}>
                                            {submitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                            Simpan Tindakan
                                        </Button>
                                        <Button type="button" variant="outline" asChild>
                                            <Link to="/admin">Batal</Link>
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminTindakLaporan;