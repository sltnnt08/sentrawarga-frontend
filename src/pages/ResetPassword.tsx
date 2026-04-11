import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackendStatusFooter from "@/components/BackendStatusFooter";
import { useToast } from "@/hooks/use-toast";
import { authAPI, logout } from "@/lib/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!email || !token) {
      toast({
        title: "Error",
        description: "Link reset password tidak valid",
        variant: "destructive",
      });
    }
  }, [email, token, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !token) {
      toast({
        title: "Error",
        description: "Email dan token tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    if (!password || !confirm) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password minimal 8 karakter",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirm) {
      toast({
        title: "Error",
        description: "Kata sandi tidak cocok",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({
        email,
        token,
        newPassword: password,
      });
      logout();
      setSuccess(true);
      toast({
        title: "Success",
        description: "Kata sandi berhasil direset!",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mereset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <img src="/icon.png" alt="SentraWarga Icon" className="w-7 h-7" />
            </div>
            <span className="font-bold text-xl text-foreground">SentraWarga</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Link tidak valid</h1>
          <p className="text-muted-foreground text-center mb-6">
            Silakan gunakan link dari email yang kami kirim
          </p>
          <Button asChild className="w-full h-12 rounded-xl text-base font-semibold gradient-primary border-0">
            <Link to="/lupa-password">Kembali ke Lupa Password</Link>
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
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <img src="/icon.png" alt="SentraWarga Icon" className="w-7 h-7" />
          </div>
          <span className="font-bold text-xl text-foreground">SentraWarga</span>
        </div>

        {!success ? (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">Kata Sandi Baru</h1>
            <p className="text-muted-foreground text-center text-sm mb-8">
              Buat kata sandi baru untuk akun Anda.<br />
              Pastikan minimal 8 karakter.
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold text-foreground">Kata sandi baru</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukan kata sandi baru"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-card border-border pr-12"
                    required
                    minLength={8}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="font-semibold text-foreground">Konfirmasi kata sandi</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Masukan ulang kata sandi"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-12 rounded-xl bg-card border-border pr-12"
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    {showConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="text-sm text-destructive">Kata sandi tidak cocok</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold gradient-primary border-0 mt-2"
                disabled={loading}
              >
                {loading ? "Sedang menyimpan..." : "Simpan Kata Sandi"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Kata Sandi Diperbarui!</h1>
            <p className="text-muted-foreground text-center text-sm mb-8">
              Kata sandi Anda berhasil diubah.<br />
              Silakan masuk dengan kata sandi baru.
            </p>
            <Button asChild className="w-full h-12 rounded-xl text-base font-semibold gradient-primary border-0">
              <Link to="/masuk">Masuk ke Akun</Link>
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

export default ResetPassword;
