import { Award, TrendingUp, Gift } from "lucide-react";

const benefits = [
  {
    icon: Award,
    title: "Top Reporter",
    desc: "+100 poin",
  },
  {
    icon: TrendingUp,
    title: "Contributor",
    desc: "+50 poin",
  },
  {
    icon: Gift,
    title: "Community Hero",
    desc: "Hadiah Menarik",
  },
];

const BenefitsSection = () => {
  return (
    <section id="keuntungan" className="pt-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Keuntungan
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Dapatkan <span className="italic text-primary">Point</span> dari Laporan Anda
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Laporkan masalah lingkungan di sekitar Anda dan kumpulkan Point untuk mendapatkan Hadiah Menarik!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-primary-light shadow-card hover:shadow-elevated transition-shadow"
            >
              <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-4">
                <b.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
