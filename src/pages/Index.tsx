import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Eye, Wifi, Zap, ArrowRight, TrendingUp, Shield } from "lucide-react";
import heroFarm from "@/assets/hero-farm.jpg";

const features = [
  {
    icon: Eye,
    title: "Vision Engine",
    desc: "AI-powered image recognition detects Blight, Rust, and Infestations from leaf photos in seconds.",
  },
  {
    icon: Wifi,
    title: "Sentinel Network",
    desc: "IoT sensors monitor soil moisture, temperature, and humidity to predict pathogen-friendly conditions.",
  },
  {
    icon: Zap,
    title: "Network Optimizer",
    desc: "Edge-optimized for 3G networks. Get diagnoses in under 3 seconds, even on weak signals.",
  },
];

const stats = [
  { value: "+40%", label: "Yield Recovery", icon: TrendingUp },
  { value: "-30%", label: "Chemical Use", icon: Shield },
  { value: "<5s", label: "Response Time", icon: Zap },
  { value: "100+", label: "Crop Varieties", icon: Leaf },
];

const Index = () => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroFarm} alt="Lush green farmland at sunrise" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-foreground/20" />
        </div>
        <div className="container relative z-10 py-20">
          <div className="max-w-2xl animate-fade-in">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
              <Leaf className="h-4 w-4" />
              AI-Powered Precision Agriculture
            </div>
            <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-primary-foreground md:text-6xl">
              Predict & Prevent
              <br />
              <span className="text-secondary">Crop Disease</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-primary-foreground/80">
              Transform farming from "observe and react" into a smart, AI-driven ecosystem that detects diseases before they spread — saving harvests and livelihoods.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/diagnose">
                  Start Diagnosis <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" className="gap-2 border-2 border-amber-400 bg-transparent hover:bg-amber-500 text-amber-400 hover:text-amber-50 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/50">
                <Link to="/dashboard">
                  Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">The Triple-Threat Solution</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Our system doesn't just look at a leaf — it understands the entire agricultural environment.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="group border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <CardContent className="p-8">
                <div className="mb-5 inline-flex rounded-xl bg-accent p-3 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                </div>
                <h3 className="mb-3 font-display text-xl font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-20">
        <div className="container">
          <h2 className="mb-12 text-center font-display text-2xl font-bold text-primary-foreground md:text-3xl">
            Measurable Impact, Real Results
          </h2>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="mx-auto mb-3 h-7 w-7 text-secondary" />
                <div className="font-display text-3xl font-bold text-primary-foreground md:text-5xl">{s.value}</div>
                <div className="mt-2 text-sm font-medium text-primary-foreground/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24 text-center">
        <div className="mx-auto max-w-xl">
          <Leaf className="mx-auto mb-6 h-10 w-10 text-primary" />
          <h2 className="mb-4 font-display text-3xl font-bold">Ready to protect your crops?</h2>
          <p className="mb-8 text-muted-foreground">
            Upload a leaf photo and get an instant AI diagnosis with treatment recommendations.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/diagnose">
              Try Diagnosis Now <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-display text-sm font-semibold">CropGuard AI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI-Powered Crop Disease Early Detection Ecosystem
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
