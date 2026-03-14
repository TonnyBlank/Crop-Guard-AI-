import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simulated weather data for demo/presentation (no external API key needed)
const generateWeatherData = (location: string) => {
  const baseTemp = 22 + Math.random() * 12;
  const baseHumidity = 55 + Math.random() * 30;

  return {
    location,
    current: {
      temperature: Math.round(baseTemp * 10) / 10,
      humidity: Math.round(baseHumidity),
      wind_speed: Math.round((5 + Math.random() * 15) * 10) / 10,
      rainfall_mm: Math.round(Math.random() * 20 * 10) / 10,
      uv_index: Math.round(3 + Math.random() * 8),
      condition: baseHumidity > 75 ? "Cloudy" : baseTemp > 30 ? "Sunny" : "Partly Cloudy",
    },
    disease_risk: {
      fungal_risk: baseHumidity > 80 ? "High" : baseHumidity > 65 ? "Medium" : "Low",
      pest_risk: baseTemp > 30 ? "High" : baseTemp > 25 ? "Medium" : "Low",
      recommendation:
        baseHumidity > 80
          ? "High humidity detected. Apply preventive fungicide and ensure proper ventilation."
          : baseTemp > 30
          ? "High temperatures may attract pests. Monitor fields and consider shade netting."
          : "Conditions are favorable. Continue regular monitoring.",
    },
    forecast: Array.from({ length: 5 }, (_, i) => ({
      day: new Date(Date.now() + (i + 1) * 86400000).toLocaleDateString("en", { weekday: "short" }),
      temp_high: Math.round(baseTemp + Math.random() * 5),
      temp_low: Math.round(baseTemp - 5 + Math.random() * 3),
      humidity: Math.round(baseHumidity + (Math.random() - 0.5) * 20),
      rain_chance: Math.round(Math.random() * 100),
    })),
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const location = url.searchParams.get("location") || "Default Farm";

    const weather = generateWeatherData(location);

    return new Response(JSON.stringify(weather), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("weather error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
