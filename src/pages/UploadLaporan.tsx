import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Compass, ImagePlus, Loader2, MapPinned, TriangleAlert } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import useAuthSession from "@/hooks/use-auth-session";
import { API_BASE_URL } from "@/lib/api-config";
import {
    APIError,
    getApiErrorDetails,
    reportsAPI,
    type ReportCategory,
    type ReportPriority,
} from "@/lib/api";
import { getCategoryLabel, REPORT_CATEGORY_OPTIONS } from "@/lib/report-display";

type SessionUser = {
    id?: string;
    role?: string;
};

type ValidationErrorDetails = {
    errors?: Array<{
        message?: string;
    }>;
};

type WilayahItem = {
    code: string;
    name: string;
};

type WilayahResponse = {
    data?: WilayahItem[];
};

type LocationMode = "auto" | "manual";
type AiReviewAnswer = "pending" | "accepted" | "rejected";

type AutoLocationState = {
    status: "idle" | "detecting" | "ready" | "error";
    latitude: number | null;
    longitude: number | null;
    address: string;
    errorMessage: string;
};

const PRIORITY_OPTIONS: Array<{ value: ReportPriority; label: string; description: string }> = [
    { value: "LOW", label: "Rendah", description: "Bisa ditangani berkala" },
    { value: "NORMAL", label: "Normal", description: "Masuk antrian prioritas" },
    { value: "HIGH", label: "Tinggi", description: "Perlu respon cepat" },
    { value: "CRITICAL", label: "Kritis", description: "Perlu eskalasi segera" },
];

const CATEGORY_OPTIONS: Array<{ value: ReportCategory; label: string }> = REPORT_CATEGORY_OPTIONS;

const ALLOWED_IMAGE_MIME = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
]);
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const WILAYAH_BASE_URL = `${API_BASE_URL}/wilayah`;

const defaultAutoLocation: AutoLocationState = {
    status: "idle",
    latitude: null,
    longitude: null,
    address: "",
    errorMessage: "",
};

const getAiHintMessage = (rawTitle: string, rawDescription: string) => {
    const trimmedTitle = rawTitle.trim();
    const trimmedDescription = rawDescription.trim();

    if (trimmedTitle.length < 3 || trimmedDescription.length < 10) {
        return "Isi judul minimal 3 karakter dan deskripsi minimal 10 karakter untuk mengaktifkan AI.";
    }

    return "Klik tombol klasifikasi AI saat judul dan deskripsi sudah final.";
};

const parseSessionUser = (value: unknown): SessionUser => {
    if (!value || typeof value !== "object") {
        return {};
    }

    const record = value as Record<string, unknown>;
    return {
        id: typeof record.id === "string" ? record.id : undefined,
        role: typeof record.role === "string" ? record.role : undefined,
    };
};

const isAllowedImageFile = (file: File) => {
    const normalizedType = file.type.toLowerCase();

    if (ALLOWED_IMAGE_MIME.has(normalizedType)) {
        return true;
    }

    if (normalizedType && normalizedType !== "application/octet-stream") {
        return false;
    }

    const lowerCaseName = file.name.toLowerCase();
    return ALLOWED_IMAGE_EXTENSIONS.some((extension) => lowerCaseName.endsWith(extension));
};

const UploadLaporan = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuthSession();
    const sessionUser = useMemo(() => parseSessionUser(user), [user]);
    const aiRequestRef = useRef(0);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<ReportPriority>("NORMAL");
    const [manualCategories, setManualCategories] = useState<ReportCategory[]>([]);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [locationMode, setLocationMode] = useState<LocationMode>("manual");
    const [autoLocation, setAutoLocation] = useState<AutoLocationState>(defaultAutoLocation);
    const [isLocationPermissionDialogOpen, setIsLocationPermissionDialogOpen] = useState(false);
    const [isLoadingRegion, setIsLoadingRegion] = useState(false);

    const [provinces, setProvinces] = useState<WilayahItem[]>([]);
    const [regencies, setRegencies] = useState<WilayahItem[]>([]);
    const [districts, setDistricts] = useState<WilayahItem[]>([]);
    const [villages, setVillages] = useState<WilayahItem[]>([]);

    const [provinceCode, setProvinceCode] = useState("");
    const [regencyCode, setRegencyCode] = useState("");
    const [districtCode, setDistrictCode] = useState("");
    const [villageCode, setVillageCode] = useState("");

    const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
    const [aiSuggestedCategory, setAiSuggestedCategory] = useState<ReportCategory | null>(null);
    const [aiConfidence, setAiConfidence] = useState<number | null>(null);
    const [aiReviewAnswer, setAiReviewAnswer] = useState<AiReviewAnswer>("pending");
    const [aiMessage, setAiMessage] = useState(getAiHintMessage("", ""));

    const fetchWilayahItems = async (path: string) => {
        const response = await fetch(`${WILAYAH_BASE_URL}${path}`);

        if (!response.ok) {
            throw new Error("Gagal memuat data wilayah");
        }

        const json = (await response.json()) as WilayahResponse;

        if (!Array.isArray(json.data)) {
            throw new Error("Format data wilayah tidak valid");
        }

        return json.data;
    };

    const detectAutomaticLocation = async () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setAutoLocation({
                status: "error",
                latitude: null,
                longitude: null,
                address: "",
                errorMessage: "Browser tidak mendukung geolokasi.",
            });
            return;
        }

        setAutoLocation((previous) => ({
            ...previous,
            status: "detecting",
            errorMessage: "",
        }));

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 12000,
                    maximumAge: 0,
                });
            });

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            let address = "";

            try {
                const reverseResponse = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                    { headers: { Accept: "application/json" } },
                );

                if (reverseResponse.ok) {
                    const reverseJson = (await reverseResponse.json()) as { display_name?: string };
                    address = typeof reverseJson.display_name === "string" ? reverseJson.display_name : "";
                }
            } catch {
                address = "";
            }

            setAutoLocation({
                status: "ready",
                latitude,
                longitude,
                address,
                errorMessage: "",
            });
        } catch {
            setAutoLocation({
                status: "error",
                latitude: null,
                longitude: null,
                address: "",
                errorMessage: "Gagal mendeteksi lokasi otomatis. Coba lagi atau gunakan mode manual.",
            });
        }
    };

    const handleAutoModeClick = () => {
        setLocationMode("auto");

        if (autoLocation.status === "ready" || autoLocation.status === "detecting") {
            return;
        }

        setIsLocationPermissionDialogOpen(true);
    };

    const handleAllowAutomaticLocation = () => {
        setIsLocationPermissionDialogOpen(false);
        void detectAutomaticLocation();
    };

    const handleDismissAutomaticLocation = () => {
        setIsLocationPermissionDialogOpen(false);
        setLocationMode("manual");
    };

    const resolveSelectedCategory = () => {
        if (aiSuggestedCategory && aiReviewAnswer !== "rejected") {
            return [aiSuggestedCategory];
        }

        return manualCategories;
    };

    const toggleCategory = (value: ReportCategory) => {
        setManualCategories((previous) =>
            previous.includes(value)
                ? previous.filter((item) => item !== value)
                : [...previous, value],
        );
    };

    const resetAiClassification = (nextTitle: string, nextDescription: string) => {
        aiRequestRef.current += 1;
        setAiStatus("idle");
        setAiSuggestedCategory(null);
        setAiConfidence(null);
        setAiReviewAnswer("pending");
        setAiMessage(getAiHintMessage(nextTitle, nextDescription));
    };

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextTitle = event.target.value;
        setTitle(nextTitle);
        resetAiClassification(nextTitle, description);
    };

    const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const nextDescription = event.target.value;
        setDescription(nextDescription);
        resetAiClassification(title, nextDescription);
    };

    const handleRunAiClassification = async () => {
        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();

        if (trimmedTitle.length < 3 || trimmedDescription.length < 10) {
            setAiMessage(getAiHintMessage(title, description));
            return;
        }

        const requestId = aiRequestRef.current + 1;
        aiRequestRef.current = requestId;

        setAiStatus("loading");
        setAiSuggestedCategory(null);
        setAiConfidence(null);
        setAiReviewAnswer("pending");
        setAiMessage("Menganalisis kategori laporan...");

        try {
            const response = await reportsAPI.classify({
                title: trimmedTitle,
                description: trimmedDescription,
            });

            if (aiRequestRef.current !== requestId) {
                return;
            }

            const result = response.data;

            if (!result || result.aiError || !result.category) {
                setAiStatus("error");
                setAiSuggestedCategory(null);
                setAiConfidence(result?.confidenceScore ?? null);
                setAiReviewAnswer("rejected");
                setAiMessage("AI belum bisa menentukan kategori. Silakan pilih kategori manual.");
                return;
            }

            setAiStatus("ready");
            setAiSuggestedCategory(result.category);
            setAiConfidence(result.confidenceScore ?? null);
            setAiReviewAnswer("pending");
            setAiMessage("AI menemukan kategori awal berdasarkan judul dan deskripsi laporan.");
        } catch (error) {
            if (aiRequestRef.current !== requestId) {
                return;
            }

            setAiStatus("error");
            setAiSuggestedCategory(null);
            setAiConfidence(null);
            setAiReviewAnswer("rejected");
            setAiMessage(error instanceof Error ? error.message : "AI inference error. Silakan pilih kategori manual.");
        }
    };

    useEffect(() => {
        let mounted = true;

        const loadProvinces = async () => {
            setIsLoadingRegion(true);
            try {
                const items = await fetchWilayahItems("/provinces.json");
                if (mounted) {
                    setProvinces(items);
                }
            } catch {
                if (mounted) {
                    toast({
                        title: "Data wilayah gagal dimuat",
                        description: "Anda tetap bisa pakai lokasi otomatis.",
                        variant: "destructive",
                    });
                }
            } finally {
                if (mounted) {
                    setIsLoadingRegion(false);
                }
            }
        };

        void loadProvinces();

        return () => {
            mounted = false;
        };
    }, [toast]);

    useEffect(() => {
        if (locationMode !== "manual" || !provinceCode) {
            setRegencies([]);
            setRegencyCode("");
            setDistricts([]);
            setDistrictCode("");
            setVillages([]);
            setVillageCode("");
            return;
        }

        let canceled = false;

        const loadRegencies = async () => {
            setIsLoadingRegion(true);
            try {
                const items = await fetchWilayahItems(`/regencies/${provinceCode}.json`);
                if (!canceled) {
                    setRegencies(items);
                }
            } catch {
                if (!canceled) {
                    toast({
                        title: "Kabupaten/kota gagal dimuat",
                        description: "Silakan pilih ulang provinsi.",
                        variant: "destructive",
                    });
                }
            } finally {
                if (!canceled) {
                    setIsLoadingRegion(false);
                }
            }
        };

        void loadRegencies();

        return () => {
            canceled = true;
        };
    }, [locationMode, provinceCode, toast]);

    useEffect(() => {
        if (locationMode !== "manual" || !regencyCode) {
            setDistricts([]);
            setDistrictCode("");
            setVillages([]);
            setVillageCode("");
            return;
        }

        let canceled = false;

        const loadDistricts = async () => {
            setIsLoadingRegion(true);
            try {
                const items = await fetchWilayahItems(`/districts/${regencyCode}.json`);
                if (!canceled) {
                    setDistricts(items);
                }
            } catch {
                if (!canceled) {
                    toast({
                        title: "Kecamatan gagal dimuat",
                        description: "Silakan pilih ulang kabupaten/kota.",
                        variant: "destructive",
                    });
                }
            } finally {
                if (!canceled) {
                    setIsLoadingRegion(false);
                }
            }
        };

        void loadDistricts();

        return () => {
            canceled = true;
        };
    }, [locationMode, regencyCode, toast]);

    useEffect(() => {
        if (locationMode !== "manual" || !districtCode) {
            setVillages([]);
            setVillageCode("");
            return;
        }

        let canceled = false;

        const loadVillages = async () => {
            setIsLoadingRegion(true);
            try {
                const items = await fetchWilayahItems(`/villages/${districtCode}.json`);
                if (!canceled) {
                    setVillages(items);
                }
            } catch {
                if (!canceled) {
                    toast({
                        title: "Desa/kelurahan gagal dimuat",
                        description: "Silakan pilih ulang kecamatan.",
                        variant: "destructive",
                    });
                }
            } finally {
                if (!canceled) {
                    setIsLoadingRegion(false);
                }
            }
        };

        void loadVillages();

        return () => {
            canceled = true;
        };
    }, [locationMode, districtCode, toast]);

    useEffect(() => {
        if (!selectedImage) {
            setImagePreviewUrl("");
            return;
        }

        const objectUrl = URL.createObjectURL(selectedImage);
        setImagePreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [selectedImage]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;

        if (!file) {
            setSelectedImage(null);
            return;
        }

        if (!isAllowedImageFile(file)) {
            toast({
                title: "Format gambar belum didukung",
                description: "Gunakan JPG, JPEG, PNG, WEBP, HEIC, atau HEIF.",
                variant: "destructive",
            });
            event.target.value = "";
            setSelectedImage(null);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast({
                title: "Ukuran gambar terlalu besar",
                description: "Ukuran maksimal gambar adalah 5MB.",
                variant: "destructive",
            });
            event.target.value = "";
            setSelectedImage(null);
            return;
        }

        setSelectedImage(file);
    };

    const validateForm = () => {
        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();
        const selectedCategories = resolveSelectedCategory();

        if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
            return "Judul laporan harus 3-200 karakter.";
        }

        if (trimmedDescription.length < 10 || trimmedDescription.length > 3000) {
            return "Deskripsi laporan harus 10-3000 karakter.";
        }

        if (aiStatus === "loading") {
            return "Mohon tunggu proses klasifikasi AI selesai.";
        }

        if (selectedCategories.length === 0) {
            return "Kategori laporan belum dipilih. Konfirmasi AI atau pilih manual.";
        }

        if (
            locationMode === "auto" &&
            (autoLocation.status !== "ready" || typeof autoLocation.latitude !== "number" || typeof autoLocation.longitude !== "number")
        ) {
            return "Lokasi otomatis belum tersedia. Coba deteksi ulang atau gunakan mode manual.";
        }

        if (locationMode === "manual" && (!provinceCode || !regencyCode || !districtCode || !villageCode)) {
            return "Lengkapi provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan.";
        }

        return null;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationMessage = validateForm();
        if (validationMessage) {
            toast({
                title: "Data laporan belum valid",
                description: validationMessage,
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const selectedCategories = resolveSelectedCategory();
            const selectedProvinceName = provinces.find((item) => item.code === provinceCode)?.name;
            const selectedRegencyName = regencies.find((item) => item.code === regencyCode)?.name;
            const selectedDistrictName = districts.find((item) => item.code === districtCode)?.name;
            const selectedVillageName = villages.find((item) => item.code === villageCode)?.name;

            const manualAddress = [selectedVillageName, selectedDistrictName, selectedRegencyName, selectedProvinceName]
                .filter(Boolean)
                .join(", ");

            await reportsAPI.createWithImage({
                title: title.trim(),
                description: description.trim(),
                category: selectedCategories,
                priority,
                address: locationMode === "auto" ? autoLocation.address || undefined : manualAddress || undefined,
                latitude: locationMode === "auto" ? autoLocation.latitude ?? undefined : undefined,
                longitude: locationMode === "auto" ? autoLocation.longitude ?? undefined : undefined,
                image: selectedImage,
            });

            toast({
                title: "Laporan berhasil dikirim",
                description: "Terima kasih, laporan Anda sudah masuk untuk diproses.",
            });

            if (sessionUser.role === "ADMIN") {
                navigate("/admin");
                return;
            }

            navigate("/laporan-saya");
        } catch (error: unknown) {
            if (error instanceof APIError) {
                const details = getApiErrorDetails<ValidationErrorDetails>(error);
                const firstValidationIssue = details?.errors?.find((item) => typeof item.message === "string");

                toast({
                    title: "Gagal mengirim laporan",
                    description: firstValidationIssue?.message || error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Gagal mengirim laporan",
                    description: error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal.",
                    variant: "destructive",
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const shouldAskAiReview = aiStatus === "ready" && Boolean(aiSuggestedCategory) && aiReviewAnswer === "pending";
    const shouldShowManualCategories = !aiSuggestedCategory || aiReviewAnswer === "rejected" || aiStatus === "error";
    const canRunAiClassification = title.trim().length >= 3 && description.trim().length >= 10 && !isSubmitting && aiStatus !== "loading";

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 lg:px-8 py-3 sm:h-16 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                    <h1 className="text-lg font-bold text-foreground">Upload Laporan</h1>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                        <Link to="/" className="inline-flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Beranda
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 lg:px-8 py-8">
                <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
                    <div className="mb-6">
                        <p className="text-sm text-muted-foreground">
                            Isi data laporan sesuai kondisi lapangan. Kategori dibantu AI dan tetap bisa Anda override secara manual.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Judul laporan *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={handleTitleChange}
                                placeholder="Contoh: Sampah menumpuk di pinggir jalan"
                                maxLength={200}
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi *</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={handleDescriptionChange}
                                placeholder="Ceritakan kondisi lokasi, dampak, dan kebutuhan tindak lanjut"
                                className="min-h-[140px]"
                                maxLength={3000}
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <div className="rounded-xl border border-primary/20 bg-primary-light/30 p-4 space-y-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Klasifikasi AI (Opsional)</p>
                                    <p className="text-xs text-muted-foreground">Jalankan AI setelah judul dan deskripsi final untuk menghemat request.</p>
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    {aiStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : null}
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => void handleRunAiClassification()}
                                        disabled={!canRunAiClassification}
                                    >
                                        {aiStatus === "loading" ? "Mengklasifikasi..." : "Klasifikasikan dengan AI"}
                                    </Button>
                                </div>
                            </div>

                            {aiSuggestedCategory ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className="bg-primary text-primary-foreground">AI: {getCategoryLabel(aiSuggestedCategory)}</Badge>
                                    {typeof aiConfidence === "number" ? (
                                        <Badge variant="outline">Confidence: {(aiConfidence * 100).toFixed(0)}%</Badge>
                                    ) : null}
                                </div>
                            ) : null}

                            <p className={`text-xs ${aiStatus === "error" ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground"}`}>{aiMessage}</p>

                            {shouldAskAiReview ? (
                                <div className="rounded-lg border border-border bg-background p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <p className="text-sm text-foreground">Apakah kategori sudah tepat?</p>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" size="sm" onClick={() => setAiReviewAnswer("accepted")}>Ya, sudah tepat</Button>
                                        <Button type="button" size="sm" variant="outline" onClick={() => setAiReviewAnswer("rejected")}>Belum tepat</Button>
                                    </div>
                                </div>
                            ) : null}

                            {aiReviewAnswer === "accepted" && aiSuggestedCategory ? (
                                <div className="inline-flex items-center gap-2 text-sm text-emerald-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Kategori AI disetujui. Anda bisa lanjut isi form.
                                </div>
                            ) : null}
                        </div>

                        {shouldShowManualCategories ? (
                            <div className="space-y-3">
                                <Label>Kategori manual *</Label>
                                <p className="text-xs text-muted-foreground">
                                    Gunakan ini jika kategori AI tidak sesuai atau AI inference error.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORY_OPTIONS.map((category) => {
                                        const selected = manualCategories.includes(category.value);

                                        return (
                                            <button
                                                key={category.value}
                                                type="button"
                                                onClick={() => toggleCategory(category.value)}
                                                className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${selected
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background text-foreground border-input hover:bg-muted"
                                                    }`}
                                                disabled={isSubmitting}
                                            >
                                                {category.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        <div className="space-y-3">
                            <Label>Prioritas *</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {PRIORITY_OPTIONS.map((option) => {
                                    const selected = priority === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setPriority(option.value)}
                                            className={`rounded-xl border px-4 py-3 text-left transition-all ${selected
                                                    ? "bg-primary text-primary-foreground border-primary shadow-card"
                                                    : "bg-background hover:bg-muted border-input"
                                                }`}
                                            disabled={isSubmitting}
                                        >
                                            <p className="font-semibold text-sm">{option.label}</p>
                                            <p className="text-xs opacity-80 mt-1">{option.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Lokasi Laporan *</Label>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant={locationMode === "auto" ? "default" : "outline"}
                                    onClick={handleAutoModeClick}
                                    disabled={isSubmitting}
                                >
                                    <Compass className="w-4 h-4" />
                                    Otomatis
                                </Button>
                                <Button
                                    type="button"
                                    variant={locationMode === "manual" ? "default" : "outline"}
                                    onClick={() => setLocationMode("manual")}
                                    disabled={isSubmitting}
                                >
                                    <MapPinned className="w-4 h-4" />
                                    Pilih Manual
                                </Button>
                            </div>

                            {locationMode === "auto" ? (
                                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm font-medium">Lokasi otomatis perangkat</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsLocationPermissionDialogOpen(true)}
                                            disabled={isSubmitting || autoLocation.status === "detecting"}
                                        >
                                            {autoLocation.status === "idle" ? "Aktifkan Lokasi" : autoLocation.status === "detecting" ? "Mendeteksi..." : "Deteksi Ulang"}
                                        </Button>
                                    </div>

                                    {autoLocation.status === "idle" ? (
                                        <p className="text-xs text-muted-foreground">
                                            Kami akan menampilkan konfirmasi dulu sebelum browser meminta izin lokasi.
                                        </p>
                                    ) : null}

                                    {autoLocation.status === "ready" ? (
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p>Latitude: {autoLocation.latitude?.toFixed(6)}</p>
                                            <p>Longitude: {autoLocation.longitude?.toFixed(6)}</p>
                                            {autoLocation.address ? <p className="break-words">Alamat terdeteksi: {autoLocation.address}</p> : null}
                                        </div>
                                    ) : null}

                                    {autoLocation.status === "error" ? (
                                        <p className="text-xs text-rose-700 dark:text-rose-300">{autoLocation.errorMessage}</p>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="province">Provinsi</Label>
                                        <select
                                            id="province"
                                            value={provinceCode}
                                            onChange={(event) => setProvinceCode(event.target.value)}
                                            className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
                                            disabled={isSubmitting || isLoadingRegion}
                                        >
                                            <option value="">Pilih provinsi</option>
                                            {provinces.map((item) => (
                                                <option key={item.code} value={item.code}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="regency">Kabupaten/Kota</Label>
                                        <select
                                            id="regency"
                                            value={regencyCode}
                                            onChange={(event) => setRegencyCode(event.target.value)}
                                            className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
                                            disabled={!provinceCode || isSubmitting || isLoadingRegion}
                                        >
                                            <option value="">Pilih kabupaten/kota</option>
                                            {regencies.map((item) => (
                                                <option key={item.code} value={item.code}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="district">Kecamatan</Label>
                                        <select
                                            id="district"
                                            value={districtCode}
                                            onChange={(event) => setDistrictCode(event.target.value)}
                                            className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
                                            disabled={!regencyCode || isSubmitting || isLoadingRegion}
                                        >
                                            <option value="">Pilih kecamatan</option>
                                            {districts.map((item) => (
                                                <option key={item.code} value={item.code}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="village">Desa/Kelurahan</Label>
                                        <select
                                            id="village"
                                            value={villageCode}
                                            onChange={(event) => setVillageCode(event.target.value)}
                                            className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full"
                                            disabled={!districtCode || isSubmitting || isLoadingRegion}
                                        >
                                            <option value="">Pilih desa/kelurahan</option>
                                            {villages.map((item) => (
                                                <option key={item.code} value={item.code}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image">Foto bukti (opsional)</Label>
                            <label
                                htmlFor="image"
                                className="flex w-full items-center gap-3 overflow-hidden rounded-lg border border-dashed border-input px-4 py-3 cursor-pointer hover:bg-muted/50"
                            >
                                <ImagePlus className="w-5 h-5 text-primary shrink-0" />
                                <div className="min-w-0 flex-1 text-sm">
                                    <p className="font-medium text-foreground break-all">
                                        {selectedImage ? selectedImage.name : "Pilih foto laporan"}
                                    </p>
                                    <p className="text-muted-foreground break-words">
                                        Maksimal 5MB • format JPG, PNG, WEBP, HEIC, HEIF
                                    </p>
                                </div>
                            </label>
                            <Input
                                id="image"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
                                onChange={handleImageChange}
                                disabled={isSubmitting}
                                className="sr-only"
                            />

                            {imagePreviewUrl ? (
                                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">Pratinjau gambar</p>
                                    <img
                                        src={imagePreviewUrl}
                                        alt="Pratinjau upload laporan"
                                        className="w-full max-h-72 object-contain rounded-md bg-background"
                                        loading="lazy"
                                    />
                                </div>
                            ) : null}
                        </div>

                        {aiStatus === "error" ? (
                            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 text-sm flex items-start gap-2">
                                <TriangleAlert className="w-4 h-4 mt-0.5" />
                                <span>AI inference error. Pilih kategori manual agar laporan tetap bisa dikirim.</span>
                            </div>
                        ) : null}

                        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
                            <Button type="button" variant="outline" asChild>
                                <Link to={sessionUser.role === "ADMIN" ? "/admin" : "/laporan-saya"}>Batal</Link>
                            </Button>
                            <Button
                                type="submit"
                                className="gradient-primary text-primary-foreground border-0"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Mengirim...
                                    </>
                                ) : (
                                    "Kirim Laporan"
                                )}
                            </Button>
                        </div>
                    </form>

                    <AlertDialog open={isLocationPermissionDialogOpen} onOpenChange={setIsLocationPermissionDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Izinkan akses lokasi perangkat?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Setelah Anda lanjutkan, browser akan menampilkan pop-up izin lokasi resmi. Ini normal dan diperlukan agar titik laporan lebih akurat.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={handleDismissAutomaticLocation}>Nanti saja</AlertDialogCancel>
                                <AlertDialogAction onClick={handleAllowAutomaticLocation}>Lanjutkan</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </main>
        </div>
    );
};

export default UploadLaporan;
