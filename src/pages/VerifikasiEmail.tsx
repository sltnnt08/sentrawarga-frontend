import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackendStatusFooter from "@/components/BackendStatusFooter";
import { useToast } from "@/hooks/use-toast";
import { authAPI, parseAuthResponse } from "@/lib/api";

const VerifikasiEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get("email") || "";
    const tokenFromUrl = searchParams.get("token") || "";

    const [token, setToken] = useState(tokenFromUrl);
    const [verified, setVerified] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !token) {
            toast({
                title: "Error",
                description: "Email dan token tidak boleh kosong",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.verifyEmail({ email, token: token.trim() });
            parseAuthResponse(response);
            setVerified(true);
            // Tidak perlu clear pending verification email
            toast({
                title: "Success",
                description: "Email berhasil diverifikasi!",
            });
        } catch (error: unknown) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Gagal memverifikasi email",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            toast({
                title: "Error",
                description: "Email tidak ditemukan",
                variant: "destructive",
            });
            return;
        }

        try {
            await authAPI.resendVerificationEmail(email);
            setCountdown(60);
            toast({
                title: "Success",
                description: "Email verifikasi telah dikirim ulang",
            });
        } catch (error: unknown) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Gagal mengirim email",
                variant: "destructive",
            });
        }
    };

    if (!email) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
                <div className="w-full max-w-md flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <img src="/icon.png" alt="SentraWarga Icon" className="w-7 h-7" />
                        </div>
                        <span className="font-bold text-xl text-foreground">SentraWarga</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-4">Email tidak ditemukan</h1>
                    <p className="text-muted-foreground text-center mb-6">
                        Silakan daftar terlebih dahulu
                    </p>
                    <Button asChild className="w-full h-12 rounded-xl text-base font-semibold gradient-primary border-0">
                        <Link to="/daftar">Kembali ke Daftar</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                        <img src="/icon.png" alt="SentraWarga Icon" className="w-7 h-7" />
                    </div>
                    <span className="font-bold text-xl text-foreground">SentraWarga</span>
                </div>

                {!verified ? (
                    <>
                        {/* Email icon */}
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <Mail className="w-10 h-10 text-primary" />
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mb-2">Verifikasi Email</h1>
                        <p className="text-muted-foreground text-center text-sm mb-8">
                            Kami telah mengirimkan kode verifikasi ke<br />
                            <span className="font-semibold text-foreground">{email}</span>
                        </p>

                        <form onSubmit={handleVerify} className="w-full space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="token" className="font-semibold text-foreground">
                                    Kode Verifikasi
                                </Label>
                                <Input
                                    id="token"
                                    type="text"
                                    placeholder="Paste kode verifikasi dari email"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className="h-12 rounded-xl bg-card border-border"
                                    disabled={loading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Masukkan 6 digit kode yang dikirim ke email Anda. Periksa spam di email anda.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl text-base font-semibold gradient-primary border-0"
                                disabled={loading}
                            >
                                {loading ? "Sedang memverifikasi..." : "Verifikasi"}
                            </Button>
                        </form>

                        <p className="text-sm text-muted-foreground mt-6">
                            Tidak menerima email?{" "}
                            {countdown > 0 ? (
                                <span className="text-muted-foreground">
                                    Kirim ulang dalam <span className="font-semibold text-foreground">{countdown}s</span>
                                </span>
                            ) : (
                                <button
                                    onClick={handleResend}
                                    className="font-semibold text-primary hover:underline"
                                    disabled={loading}
                                >
                                    Kirim ulang
                                </button>
                            )}
                        </p>
                    </>
                ) : (
                    <>
                        {/* Success state */}
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10 text-primary" />
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mb-2">Email Terverifikasi!</h1>
                        <p className="text-muted-foreground text-center text-sm mb-8">
                            Akun Anda telah berhasil diverifikasi.<br />
                            Anda sudah masuk. Lanjutkan ke beranda.
                        </p>

                        <Button asChild className="w-full h-12 rounded-xl text-base font-semibold gradient-primary border-0">
                            <Link to="/">Lanjut ke Beranda</Link>
                        </Button>
                    </>
                )}

                <p className="text-xs text-muted-foreground mt-12">
                    © 2026 SentraWarga. Semua hak dilindungi.
                </p>
                <BackendStatusFooter />
            </div>
        </div>
    );
};

export default VerifikasiEmail;
