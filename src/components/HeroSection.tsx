import { Button } from "@/components/ui/button";
import { MapPin, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import heroTree from "@/assets/hero-tree.png";
import useAuthSession from "@/hooks/use-auth-session";

const HeroSection = () => {
  const { isAuthenticated, user } = useAuthSession();
  const isAdmin = user?.role === "ADMIN";

  return (
    <section id="beranda" className="relative pt-16 overflow-hidden gradient-hero">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-16 lg:py-24">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
              SentraWarga
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Dari Warga,{" "}
              <span className="text-primary">untuk Warga</span>
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg max-w-lg mx-auto lg:mx-0 mb-8">
              Platform digital berbasis komunitas untuk melaporkan dan memantau masalah lingkungan secara lebih mudah, transparan, dan terstruktur.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              {isAuthenticated ? (
                <>
                  <Button size="lg" className="gradient-primary text-primary-foreground border-0 gap-2 text-base px-8" asChild>
                    <Link to="/lapor">
                      <FileText className="w-4 h-4" />
                      Upload Laporan
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8 border-primary/30 text-primary hover:bg-primary-light" asChild>
                    <Link to={isAdmin ? "/admin" : "/laporan-saya"}>
                      <FileText className="w-4 h-4" />
                      {isAdmin ? "Dashboard" : "Laporan Saya"}
                    </Link>
                  </Button>
                </>
              ) : (
                <Button size="lg" className="gradient-primary text-primary-foreground border-0 gap-2 text-base px-8" asChild>
                  <Link to="/masuk">
                    <FileText className="w-4 h-4" />
                    Masuk untuk Melapor
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Tree Image */}
          <div className="flex-1 flex justify-center order-1 lg:order-2">
            <img
              src={heroTree}
              alt="Pohon komunitas SentraWarga"
              width={800}
              height={800}
              className="w-64 md:w-80 lg:w-[28rem] drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
    </section>
  );
};

export default HeroSection;
