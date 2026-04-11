import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BackendStatusFooter from "@/components/BackendStatusFooter";
import useAuthSession from "@/hooks/use-auth-session";

const FooterSection = () => {
    const { isAuthenticated, user } = useAuthSession();
    const isAdmin = user?.role === "ADMIN";

    return (
        <footer className="bg-[hsl(150,20%,10%)] text-white dark:bg-[hsl(150,20%,5%)]">
            {/* CTA */}
            <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20 text-center">
                <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
                    SentraWarga
                </p>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                    Dari Warga, untuk Warga
                </h2>
                <p className="text-white/70 max-w-lg mx-auto mb-8">
                    Laporkan masalah lingkungan yang Aman dan Nyaman dengan Lapor di SentraWarga.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button size="lg" className="gradient-primary border-0 text-white text-base px-8" asChild>
                        <Link to={isAuthenticated ? "/lapor" : "/masuk"}>
                            {isAuthenticated ? "Upload Laporan" : "Masuk untuk Melapor"}
                        </Link>
                    </Button>
                    {isAuthenticated ? (
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-base px-8 border-white/30 text-foreground hover:bg-white/10"
                            asChild
                        >
                            <Link to={isAdmin ? "/admin" : "/laporan-saya"}>
                                {isAdmin ? "Dashboard" : "Laporan Saya"}
                            </Link>
                        </Button>
                    ) : null}
                </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-white/10">
                <div className="container mx-auto px-4 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                                <img src="/icon.png" alt="SentraWarga Icon" className="w-5 h-6 mb-2" />
                                <p className="font-bold text-sm">SentraWarga</p>
                                <p className="text-xs text-white/60">Dari Warga, untuk Warga</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-white/40 mt-8">
                        © 2026 SentraWarga. Semua hak dilindungi.
                    </p>

                    <BackendStatusFooter tone="inverse" className="mt-2" />
                </div>
            </div>
        </footer>
    );
};

export default FooterSection;
