import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="tentang" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center">
            <img src="/icon.png" alt="SentraWarga Icon" className="w-8 h-10" />
          </div>
        </div>
        <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
          SentraWarga
        </p>
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 max-w-2xl mx-auto">
          Bersama Warga, Menjaga Lingkungan Lebih Mudah.
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Platform digital berbasis komunitas yang dirancang untuk membantu masyarakat melaporkan dan memantau masalah lingkungan secara lebih mudah, transparan, dan terstruktur.
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
