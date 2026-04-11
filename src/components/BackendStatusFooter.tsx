import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-config";

type BackendStatus = "checking" | "online" | "offline";

type BackendStatusFooterProps = {
  className?: string;
  tone?: "default" | "inverse";
};

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

const buildProbeUrls = () => {
  const apiBase = trimTrailingSlash(API_BASE_URL);

  return Array.from(
    new Set([
      `${apiBase}/healthz`,
      `${apiBase}/readyz`,
    ]),
  );
};

const BackendStatusFooter = ({ className, tone = "default" }: BackendStatusFooterProps) => {
  const [status, setStatus] = useState<BackendStatus>("checking");

  const palette = useMemo(() => {
    if (tone === "inverse") {
      return {
        text: "text-primary-foreground/75",
        sub: "text-primary-foreground/55",
        onlineDot: "bg-emerald-300",
        offlineDot: "bg-rose-300",
        checkingDot: "bg-amber-300",
      };
    }

    return {
      text: "text-muted-foreground",
      sub: "text-muted-foreground/80",
      onlineDot: "bg-emerald-500",
      offlineDot: "bg-rose-500",
      checkingDot: "bg-amber-500",
    };
  }, [tone]);

  useEffect(() => {
    let mounted = true;

    const checkBackend = async () => {
      setStatus((prev) => (prev === "online" ? "online" : "checking"));

      const probeUrls = buildProbeUrls();

      try {
        let isReachable = false;

        for (const url of probeUrls) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          try {
            const response = await fetch(url, {
              method: "GET",
              cache: "no-store",
              signal: controller.signal,
            });

            if (response.status < 500) {
              isReachable = true;
              clearTimeout(timeoutId);
              break;
            }
          } catch {
            // Try next probe URL.
          } finally {
            clearTimeout(timeoutId);
          }
        }

        if (!mounted) {
          return;
        }

        setStatus(isReachable ? "online" : "offline");
      } catch {
        if (mounted) {
          setStatus("offline");
        }
      }
    };

    checkBackend();
    const intervalId = setInterval(checkBackend, 60000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const label =
    status === "online" ? "Online" : status === "offline" ? "Offline" : "Mengecek...";

  const dotClass =
    status === "online"
      ? palette.onlineDot
      : status === "offline"
        ? palette.offlineDot
        : palette.checkingDot;

  return (
    <div className={cn("mt-3 flex items-center justify-center gap-2 text-xs", className, palette.text)}>
      <span className={cn("h-2 w-2 rounded-full", dotClass)} />
      <span>Status server: {label}</span>
    </div>
  );
};

export default BackendStatusFooter;
