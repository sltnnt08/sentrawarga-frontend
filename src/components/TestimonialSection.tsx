import { Quote } from "lucide-react";

const TestimonialSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-primary-light">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-3xl p-8 lg:p-12 shadow-elevated relative">
            <Quote className="w-10 h-10 text-primary/20 absolute top-6 left-6" />
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
                AN
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Andin Nuraini</p>
                <p className="text-xs text-muted-foreground mb-3">Ibu Rumah Tangga</p>
                <p className="text-muted-foreground leading-relaxed">
                  "Alhamdulillah minyak sudah ada karena jalan sudah diperbaiki, pokoknya the best lah SentraWarga, terbaik bgt."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
