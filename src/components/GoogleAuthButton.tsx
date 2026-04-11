import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authAPI, parseAuthResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";

type GoogleAuthButtonProps = {
  mode: "login" | "register";
  disabled?: boolean;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Google Sign-In gagal";
};

const GoogleAuthButton = ({ mode, disabled = false }: GoogleAuthButtonProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isInvalidClientId =
    typeof googleClientId === "string" &&
    (googleClientId.startsWith("GOCSPX-") || !googleClientId.includes(".apps.googleusercontent.com"));

  if (!googleClientId || isInvalidClientId) {
    return (
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl border-border bg-card text-foreground font-medium gap-3"
        disabled
      >
        {isInvalidClientId ? "Google Client ID tidak valid" : "Google Sign-In belum dikonfigurasi"}
      </Button>
    );
  }

  return (
    <div className="relative flex w-full justify-center overflow-hidden rounded-xl [&>div]:flex [&>div]:w-full [&>div]:justify-center [&>div>div]:max-w-full">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            const idToken = credentialResponse.credential;
            if (!idToken) {
              throw new Error("Google credential tidak diterima");
            }

            const response = await authAPI.googleAuth({ idToken });
            parseAuthResponse(response);
            toast({
              title: "Success",
              description:
                mode === "login"
                  ? "Berhasil masuk dengan Google!"
                  : "Akun berhasil dibuat dengan Google!",
            });
            navigate("/");
          } catch (error: unknown) {
            toast({
              title: "Error",
              description: getErrorMessage(error),
              variant: "destructive",
            });
          }
        }}
        onError={() => {
          toast({
            title: "Error",
            description: "Google Sign-In gagal",
            variant: "destructive",
          });
        }}
        useOneTap={false}
        size="large"
        text={mode === "login" ? "signin_with" : "continue_with"}
      />
      {disabled ? <div className="absolute inset-0 cursor-not-allowed bg-transparent" /> : null}
    </div>
  );
};

export default GoogleAuthButton;
