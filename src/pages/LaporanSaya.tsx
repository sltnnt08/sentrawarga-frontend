import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, FilePlus2, Loader2, MapPin, Pencil, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useAuthSession from "@/hooks/use-auth-session";
import { useToast } from "@/hooks/use-toast";
import { authAPI, reportsAPI, type ReportCategory, type ReportListItem } from "@/lib/api";
import {
    getCancelledByRoleLabel,
    REPORT_CATEGORY_OPTIONS,
    REPORT_PRIORITY_LABEL,
    REPORT_STATUS_BADGE_CLASS,
    REPORT_STATUS_LABEL,
} from "@/lib/report-display";

type SessionUser = {
    id?: string;
    role?: string;
    name?: string;
    points?: number;
};

type EditReportForm = {
    title: string;
    description: string;
    category: ReportCategory[];
};

const parseSessionUser = (value: unknown): SessionUser => {
    if (!value || typeof value !== "object") {
        return {};
    }

    const record = value as Record<string, unknown>;
    return {
        id: typeof record.id === "string" ? record.id : undefined,
        role: typeof record.role === "string" ? record.role : undefined,
        name: typeof record.name === "string" ? record.name : undefined,
        points: typeof record.points === "number" ? record.points : undefined,
    };
};

const formatDate = (value: string) =>
    new Date(value).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const LaporanSaya = () => {
    const { user } = useAuthSession();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const sessionUser = useMemo(() => parseSessionUser(user), [user]);
    const [detailReportId, setDetailReportId] = useState<string | null>(null);
    const [editReportId, setEditReportId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EditReportForm>({
        title: "",
        description: "",
        category: [],
    });

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ["my-reports", sessionUser.id],
        queryFn: () => reportsAPI.list({ limit: 50 }),
        enabled: Boolean(sessionUser.id),
    });

    const userProfileQuery = useQuery({
        queryKey: ["auth-me", sessionUser.id],
        queryFn: () => authAPI.me(),
        enabled: Boolean(sessionUser.id),
    });

    const currentUserPoints =
        typeof userProfileQuery.data?.data?.points === "number"
            ? userProfileQuery.data.data.points
            : (sessionUser.points ?? 0);

    if (sessionUser.role === "ADMIN") {
        return <Navigate to="/admin" replace />;
    }

    const allReports = data?.data?.items ?? [];
    const myReports = allReports.filter((item) => item.reporter?.id === sessionUser.id);

    const detailQuery = useQuery({
        queryKey: ["my-report-detail", detailReportId],
        queryFn: () => reportsAPI.detail(detailReportId as string),
        enabled: Boolean(detailReportId),
    });

    const cancelReportMutation = useMutation({
        mutationFn: (reportId: string) => reportsAPI.updateStatus(reportId, "CANCELLED"),
        onSuccess: () => {
            toast({
                title: "Laporan dibatalkan",
                description: "Status laporan Anda telah diubah menjadi dibatalkan.",
            });
            void queryClient.invalidateQueries({ queryKey: ["my-reports", sessionUser.id] });
        },
        onError: (error) => {
            toast({
                title: "Gagal membatalkan laporan",
                description: error instanceof Error ? error.message : "Terjadi kesalahan.",
                variant: "destructive",
            });
        },
    });

    const updateReportMutation = useMutation({
        mutationFn: () =>
            reportsAPI.update(editReportId as string, {
                title: editForm.title.trim(),
                description: editForm.description.trim(),
                category: editForm.category,
            }),
        onSuccess: () => {
            toast({
                title: "Laporan diperbarui",
                description: "Perubahan laporan berhasil disimpan.",
            });
            setEditReportId(null);
            void queryClient.invalidateQueries({ queryKey: ["my-reports", sessionUser.id] });
        },
        onError: (error) => {
            toast({
                title: "Gagal memperbarui laporan",
                description: error instanceof Error ? error.message : "Terjadi kesalahan.",
                variant: "destructive",
            });
        },
    });

    const canMutateReport = (report: ReportListItem) => {
        return report.status !== "RESOLVED" && report.status !== "REJECTED" && report.status !== "CANCELLED";
    };

    const openEditDialog = (report: ReportListItem) => {
        setEditForm({
            title: report.title,
            description: report.description,
            category: report.category,
        });
        setEditReportId(report.id);
    };

    const toggleEditCategory = (value: ReportCategory) => {
        setEditForm((current) => ({
            ...current,
            category: current.category.includes(value)
                ? current.category.filter((item) => item !== value)
                : [...current.category, value],
        }));
    };

    const handleSubmitEdit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editForm.title.trim().length < 3 || editForm.title.trim().length > 200) {
            toast({
                title: "Judul belum valid",
                description: "Judul laporan harus 3-200 karakter.",
                variant: "destructive",
            });
            return;
        }

        if (editForm.description.trim().length < 10 || editForm.description.trim().length > 3000) {
            toast({
                title: "Deskripsi belum valid",
                description: "Deskripsi laporan harus 10-3000 karakter.",
                variant: "destructive",
            });
            return;
        }

        if (editForm.category.length === 0) {
            toast({
                title: "Kategori belum dipilih",
                description: "Pilih minimal satu kategori.",
                variant: "destructive",
            });
            return;
        }

        updateReportMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 lg:px-8 py-3 sm:h-16 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Laporan Saya</h1>
                        <p className="text-xs text-muted-foreground">
                            {sessionUser.name ? `Akun: ${sessionUser.name}` : "Akun pengguna"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Total poin: <span className="font-semibold text-foreground">{currentUserPoints}</span>
                        </p>
                    </div>
                    <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 sm:justify-end">
                        <Button size="sm" className="w-full sm:w-auto gradient-primary text-primary-foreground border-0" asChild>
                            <Link to="/lapor" className="inline-flex items-center gap-2">
                                <FilePlus2 className="w-4 h-4" />
                                Upload Laporan
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                            <Link to="/" className="inline-flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Beranda
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 lg:px-8 py-8">
                {isLoading ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memuat laporan Anda...
                    </div>
                ) : null}

                {isError ? (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 flex items-start gap-2">
                        <TriangleAlert className="w-4 h-4 mt-0.5" />
                        <div>
                            <p className="font-semibold">Gagal memuat laporan Anda.</p>
                            <p className="text-sm mt-1">{error instanceof Error ? error.message : "Terjadi kesalahan."}</p>
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} disabled={isFetching}>
                                Coba lagi
                            </Button>
                        </div>
                    </div>
                ) : null}

                {!isLoading && !isError && myReports.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                        <p className="text-foreground font-semibold">Belum ada laporan yang Anda kirim.</p>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                            Kirim laporan pertama Anda agar tim dapat segera menindaklanjuti.
                        </p>
                        <Button className="gradient-primary text-primary-foreground border-0" asChild>
                            <Link to="/lapor">Buat Laporan Sekarang</Link>
                        </Button>
                    </div>
                ) : null}

                {!isLoading && !isError && myReports.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {myReports.map((report) => (
                            <article key={report.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <Badge className={REPORT_STATUS_BADGE_CLASS[report.status]}>{REPORT_STATUS_LABEL[report.status]}</Badge>
                                    <Badge variant="secondary">Prioritas: {REPORT_PRIORITY_LABEL[report.priority]}</Badge>
                                    {report.editedByReporter ? (
                                        <Badge variant="outline" className="border-indigo-300 text-indigo-700 dark:border-indigo-500/40 dark:text-indigo-200">Telah diedit</Badge>
                                    ) : null}
                                </div>

                                <h2 className="text-lg font-bold text-foreground">{report.title}</h2>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{report.description}</p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {report.category.map((item) => (
                                        <Badge key={`${report.id}-${item}`} variant="outline">{REPORT_CATEGORY_OPTIONS.find((option) => option.value === item)?.label ?? item}</Badge>
                                    ))}
                                </div>

                                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                                    <p>Dikirim: {formatDate(report.createdAt)}</p>
                                    {report.status === "CANCELLED" ? (
                                        <p>Dibatalkan oleh: {getCancelledByRoleLabel(report.cancelledByRole)}</p>
                                    ) : null}
                                    {report.address ? (
                                        <p className="inline-flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {report.address}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setDetailReportId(report.id)}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        Detail
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEditDialog(report)}
                                        disabled={!canMutateReport(report)}
                                    >
                                        <Pencil className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => cancelReportMutation.mutate(report.id)}
                                        disabled={!canMutateReport(report) || cancelReportMutation.isPending}
                                    >
                                        Tarik Laporan
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}
            </main>

            <Dialog open={Boolean(detailReportId)} onOpenChange={(open) => !open && setDetailReportId(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Laporan</DialogTitle>
                        <DialogDescription>Informasi lengkap dan dokumentasi gambar laporan.</DialogDescription>
                    </DialogHeader>

                    {detailQuery.isLoading ? (
                        <div className="py-8 text-center text-muted-foreground">Memuat detail laporan...</div>
                    ) : detailQuery.isError ? (
                        <div className="py-4 text-sm text-rose-700 dark:text-rose-300">Gagal memuat detail laporan.</div>
                    ) : detailQuery.data?.data ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg">{detailQuery.data.data.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{detailQuery.data.data.description}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Badge className={REPORT_STATUS_BADGE_CLASS[detailQuery.data.data.status]}>
                                    {REPORT_STATUS_LABEL[detailQuery.data.data.status]}
                                </Badge>
                                <Badge variant="secondary">
                                    Prioritas: {REPORT_PRIORITY_LABEL[detailQuery.data.data.priority]}
                                </Badge>
                                {detailQuery.data.data.editedByReporter ? (
                                    <Badge variant="outline" className="border-indigo-300 text-indigo-700 dark:border-indigo-500/40 dark:text-indigo-200">Telah diedit</Badge>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Kategori</p>
                                <div className="flex flex-wrap gap-2">
                                    {detailQuery.data.data.category.map((item) => (
                                        <Badge key={`detail-${detailQuery.data.data?.id}-${item}`} variant="outline">
                                            {REPORT_CATEGORY_OPTIONS.find((option) => option.value === item)?.label ?? item}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p>Dikirim: {formatDate(detailQuery.data.data.createdAt)}</p>
                                <p>Diperbarui: {formatDate(detailQuery.data.data.updatedAt)}</p>
                                {detailQuery.data.data.address ? <p>Alamat: {detailQuery.data.data.address}</p> : null}
                            </div>

                            {detailQuery.data.data.feedback ? (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">Tanggapan Admin</p>
                                    <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-100 whitespace-pre-wrap">
                                        {detailQuery.data.data.feedback}
                                    </p>
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Gambar Laporan</p>
                                {detailQuery.data.data.reportImages && detailQuery.data.data.reportImages.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {detailQuery.data.data.reportImages.map((image) => (
                                            <img
                                                key={image.id}
                                                src={image.url}
                                                alt="Gambar laporan"
                                                className="w-full h-44 object-cover rounded-md border border-border"
                                                loading="lazy"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Belum ada gambar pada laporan ini.</p>
                                )}
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(editReportId)} onOpenChange={(open) => !open && setEditReportId(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Edit Laporan</DialogTitle>
                        <DialogDescription>Perubahan akan ditandai sebagai laporan yang telah diedit.</DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleSubmitEdit}>
                        <div className="space-y-2">
                            <Label htmlFor="edit-title">Judul</Label>
                            <Input
                                id="edit-title"
                                value={editForm.title}
                                onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                                maxLength={200}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Deskripsi</Label>
                            <Textarea
                                id="edit-description"
                                value={editForm.description}
                                onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                                className="min-h-[140px]"
                                maxLength={3000}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Kategori</Label>
                            <div className="flex flex-wrap gap-2">
                                {REPORT_CATEGORY_OPTIONS.map((category) => {
                                    const selected = editForm.category.includes(category.value);
                                    return (
                                        <button
                                            key={`edit-category-${category.value}`}
                                            type="button"
                                            onClick={() => toggleEditCategory(category.value)}
                                            className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${selected
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background text-foreground border-input hover:bg-muted"
                                                }`}
                                        >
                                            {category.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditReportId(null)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={updateReportMutation.isPending}>
                                {updateReportMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LaporanSaya;
