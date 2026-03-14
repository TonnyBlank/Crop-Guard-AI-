import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Sun, Droplets, Thermometer, Wind, Bug, Calendar, Sprout } from "lucide-react";

const seasonalTips = [
  {
    season: "Rainy Season",
    icon: Droplets,
    tips: [
      "Increase fungicide applications — moisture promotes fungal growth",
      "Ensure proper drainage to prevent root rot and waterlogging",
      "Monitor for Late Blight on potato and tomato crops daily",
      "Stake tall plants to improve air circulation near the ground",
    ],
  },
  {
    season: "Dry Season",
    icon: Sun,
    tips: [
      "Use mulching to retain soil moisture and suppress weeds",
      "Watch for spider mites and aphids — dry conditions favor them",
      "Irrigate early morning to reduce water evaporation loss",
      "Apply potassium-rich fertilizers to improve drought resistance",
    ],
  },
];

const cropGuides = [
  {
    crop: "Tomato",
    diseases: ["Early Blight", "Late Blight", "Septoria Leaf Spot"],
    bestPractices: "Rotate with non-solanaceous crops every 2-3 years. Stake plants for airflow.",
  },
  {
    crop: "Maize",
    diseases: ["Gray Leaf Spot", "Northern Corn Blight", "Common Rust"],
    bestPractices: "Use resistant hybrids. Avoid planting in previously infected fields without rotation.",
  },
  {
    crop: "Potato",
    diseases: ["Late Blight", "Early Blight", "Black Scurf"],
    bestPractices: "Plant certified disease-free seed potatoes. Monitor humidity above 80%.",
  },
  {
    crop: "Bean",
    diseases: ["Angular Leaf Spot", "Anthracnose", "Bean Rust"],
    bestPractices: "Use certified seeds. Avoid working in wet fields to prevent spread.",
  },
  {
    crop: "Wheat",
    diseases: ["Stem Rust", "Stripe Rust", "Powdery Mildew"],
    bestPractices: "Apply fungicides at early flag-leaf stage. Use resistant varieties.",
  },
  {
    crop: "Rice",
    diseases: ["Rice Blast", "Bacterial Leaf Blight", "Sheath Blight"],
    bestPractices: "Maintain balanced nitrogen fertilization. Use resistant cultivars.",
  },
];

const ipmSteps = [
  { icon: Bug, title: "Monitor", desc: "Regular field scouting and sticky traps for early pest detection" },
  { icon: Sprout, title: "Identify", desc: "Use CropGuard AI to accurately identify diseases and pests" },
  { icon: Calendar, title: "Plan", desc: "Schedule treatments based on pest lifecycle and crop growth stage" },
  { icon: Leaf, title: "Act", desc: "Start with biological controls, escalate to chemical only if needed" },
];

const CropHealth = () => {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Crop Health Guide</h1>
        <p className="text-muted-foreground">Best practices, seasonal tips, and IPM strategies for your crops</p>
      </div>

      {/* IPM Steps */}
      <div className="mb-10">
        <h2 className="mb-6 font-display text-xl font-semibold">Integrated Pest Management (IPM)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ipmSteps.map((step, i) => (
            <Card key={step.title} className="group transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-3 inline-flex rounded-full bg-accent p-3 transition-colors group-hover:bg-primary">
                  <step.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                </div>
                <div className="mb-1 font-display text-2xl font-bold text-primary">{i + 1}</div>
                <h3 className="mb-2 font-display font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Seasonal Tips */}
      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        {seasonalTips.map((s) => (
          <Card key={s.season}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <s.icon className="h-5 w-5 text-primary" /> {s.season}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {s.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Crop Disease Reference */}
      <h2 className="mb-6 font-display text-xl font-semibold">Crop Disease Reference</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cropGuides.map((c) => (
          <Card key={c.crop}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Sprout className="h-5 w-5 text-primary" /> {c.crop}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {c.diseases.map((d) => (
                  <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{c.bestPractices}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CropHealth;
