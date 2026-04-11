import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackendStatusFooter from "@/components/BackendStatusFooter";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";

const LupaPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Email tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast({
        title: "Success",
        description: "Jika email terdaftar, tautan reset akan dikirim",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim email",
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
        description: "Email tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast({
        title: "Success",
        description: "Email reset telah dikirim ulang",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim email",
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
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <img src="/icon.png" alt="SentraWarga Icon" className="w-7 h-7" />
          </div>
          <span className="font-bold text-xl text-foreground">SentraWarga</span>
        </div>

        {!sent ? (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">Lupa Kata Sandi</h1>
            <p className="text-muted-foreground text-center text-sm mb-8">
              Masukkan email Anda dan kami akan<br />
              mengirimkan tautan untuk mengatur ulang kata sandi
            </p>

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
                  required
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold gradient-primary border-0"
                disabled={loading}
              >
                {loading ? "Sedang mengirim..." : "Kirim Tautan Reset"}
              </Button>
            </form>
          </>
        ) : (
          <>
            {/* Success state */}
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Cek Email Anda</h1>
            <p className="text-muted-foreground text-center text-sm mb-8">
              Kami telah mengirimkan tautan reset kata sandi ke<br />
              <span className="font-semibold text-foreground">{email}</span>
            </p>
            <Button
              onClick={handleResend}
              variant="outline"
              className="w-full h-12 rounded-xl border-border bg-card text-foreground font-medium"
              disabled={loading}
            >
              {loading ? "Sedang mengirim..." : "Kirim ulang email"}
            </Button>
          </>
        )}

        <Link
          to="/masuk"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mt-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke halaman Masuk
        </Link>

        <p className="text-xs text-muted-foreground mt-12">
          © 2026 SentraWarga. Semua hak dilindungi.
        </p>
        <BackendStatusFooter />
      </div>
    </div>
  );
};

export default LupaPassword;
