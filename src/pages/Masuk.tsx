import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackendStatusFooter from "@/components/BackendStatusFooter";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { useToast } from "@/hooks/use-toast";
import { APIError, authAPI, getApiErrorDetails, parseAuthResponse } from "@/lib/api";

const Masuk = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast({
                title: "Error",
                description: "Email dan password tidak boleh kosong",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.login({ email, password });
            parseAuthResponse(response);
            toast({ 
                title: "Success",
                description: "Berhasil masuk!",
            });
            navigate("/");
        } catch (error: unknown) {
            const details = getApiErrorDetails<{ code?: string; email?: string }>(error);

            if (error instanceof APIError && error.status === 403 && details?.code === "EMAIL_NOT_VERIFIED") {
                toast({
                    title: "Verifikasi Diperlukan",
                    description: "Email Anda belum diverifikasi. Silakan cek email Anda untuk kode OTP. Periksa spam di email anda.",
                });
                // Tidak perlu redirect otomatis, biarkan user login ulang setelah verifikasi
                return;
            }

            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Gagal masuk",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                        <img src="/icon.png" alt="SentraWarga Icon" className="w-6 h-7" />
                    </div>
                    <span className="font-bold text-xl text-foreground">SentraWarga</span>
                </div>

                {/* Heading */}
                <h1 className="text-2xl font-bold text-foreground mb-2">Masuk</h1>
                <p className="text-muted-foreground text-center text-sm mb-8">
                    Selamat datang kembali!<br />
                    Ayo masuk ke akun Anda
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="font-semibold text-foreground">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Masukan alamat email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 rounded-xl bg-card border-border"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="font-semibold text-foreground">Kata sandi</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Masukan kata sandi"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 rounded-xl bg-card border-border pr-12"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                disabled={loading}
                            >
                                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                        </div>
                        <Link to="/lupa-password" className="text-sm text-primary hover:underline">
                            Lupa kata sandi?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-base font-semibold gradient-primary border-0 mt-2"
                        disabled={loading}
                    >
                        {loading ? "Sedang masuk..." : "Masuk"}
                    </Button>
                </form>

                {/* Divider */}
                <p className="text-sm text-muted-foreground my-5">atau masuk menggunakan</p>

                {/* Google */}
                <GoogleAuthButton mode="login" disabled={loading} />

                {/* Footer */}
                <p className="text-sm text-muted-foreground mt-8">
                    Tidak memiliki akun?{" "}
                    <Link to="/daftar" className="text-foreground font-semibold underline hover:text-primary">
                        Daftar
                    </Link>
                </p>

                <p className="text-xs text-muted-foreground mt-12">
                    © 2026 SentraWarga. Semua hak dilindungi.
                </p>
                <BackendStatusFooter />
            </div>
        </div>
    );
};

export default Masuk;
