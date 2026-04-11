import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsAPI, type ReportStatsPayload } from "@/lib/api";

const POLL_INTERVAL_MS = 10000;

const EMPTY_STATS: ReportStatsPayload = {
    totalCreated: 0,
    inProgress: 0,
    totalResolved: 0,
    statusBreakdown: {
        PENDING: 0,
        VERIFIED: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        REJECTED: 0,
        CANCELLED: 0,
    },
};

const numberFormatter = new Intl.NumberFormat("id-ID");

const useAnimatedNumber = (targetValue: number, duration = 900) => {
    const [displayValue, setDisplayValue] = useState(targetValue);
    const valueRef = useRef(targetValue);

    useEffect(() => {
        const startValue = valueRef.current;

        if (startValue === targetValue) {
            return;
        }

        const startTime = performance.now();
        let frameId = 0;

        const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const easedProgress = 1 - (1 - progress) ** 3;
            const nextValue = Math.round(startValue + (targetValue - startValue) * easedProgress);

            valueRef.current = nextValue;
            setDisplayValue(nextValue);

            if (progress < 1) {
                frameId = requestAnimationFrame(animate);
            }
        };

        frameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [duration, targetValue]);

    return displayValue;
};

const StatCard = ({
    label,
    value,
    emphasized,
}: {
    label: string;
    value: number;
    emphasized?: boolean;
}) => {
    const animatedValue = useAnimatedNumber(value);

    return (
        <div
            className={`text-center p-8 rounded-2xl shadow-card ${emphasized
                    ? "bg-primary-light border-2 border-primary/20 md:col-span-3 lg:col-span-1"
                    : "bg-card border border-border"
                }`}
        >
            <p className={`text-4xl lg:text-5xl font-extrabold mb-2 ${emphasized ? "text-primary" : "text-foreground"}`}>
                {numberFormatter.format(animatedValue)}
            </p>
            <p className="text-muted-foreground text-sm font-medium">{label}</p>
        </div>
    );
};

const StatCardSkeleton = ({ emphasized }: { emphasized?: boolean }) => {
    return (
        <div
            className={`text-center p-8 rounded-2xl shadow-card ${emphasized
                    ? "bg-primary-light border-2 border-primary/20 md:col-span-3 lg:col-span-1"
                    : "bg-card border border-border"
                }`}
        >
            <div className="mx-auto mb-3 h-12 w-24 animate-pulse rounded-md bg-muted/60" />
            <div className="mx-auto h-4 w-28 animate-pulse rounded bg-muted/60" />
        </div>
    );
};

const StatsSection = () => {
    const { data, isPending, isFetching } = useQuery({
        queryKey: ["landing-report-stats"],
        queryFn: async () => {
            const response = await reportsAPI.stats();
            return response.data ?? EMPTY_STATS;
        },
        refetchInterval: POLL_INTERVAL_MS,
        staleTime: 5000,
    });

    const currentData = data ?? EMPTY_STATS;

    const stats = useMemo(
        () => [
            { label: "Laporan dibuat", value: currentData.totalCreated, emphasized: true },
            { label: "Sedang diproses", value: currentData.inProgress },
            { label: "Laporan selesai", value: currentData.totalResolved },
        ],
        [currentData.inProgress, currentData.totalCreated, currentData.totalResolved],
    );

    return (
        <section className="py-16 lg:py-20">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="mb-4 flex justify-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                        <span
                            className={`h-2 w-2 rounded-full ${isPending || isFetching ? "animate-pulse bg-amber-500" : "bg-emerald-500"}`}
                        />
                        {isPending
                            ? "Memuat data realtime..."
                            : isFetching
                                ? "Memperbarui data realtime..."
                                : "Data realtime dari laporan database"}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {isPending
                        ? stats.map((s) => <StatCardSkeleton key={s.label} emphasized={s.emphasized} />)
                        : stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} emphasized={s.emphasized} />)}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
