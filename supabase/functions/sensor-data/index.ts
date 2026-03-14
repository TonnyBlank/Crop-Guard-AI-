import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === "POST") {
      // Ingest sensor data from IoT devices
      const body = await req.json();
      const { device_id, temperature, humidity, soil_moisture, light_level, location } = body;

      if (!device_id) {
        return new Response(JSON.stringify({ error: "device_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase.from("sensor_readings").insert({
        device_id,
        temperature,
        humidity,
        soil_moisture,
        light_level,
        location,
        recorded_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      // Check thresholds and generate alerts
      const alerts: string[] = [];
      if (humidity && humidity > 85) alerts.push("HIGH HUMIDITY: Fungal disease risk elevated");
      if (temperature && temperature > 35) alerts.push("HIGH TEMPERATURE: Heat stress warning");
      if (soil_moisture && soil_moisture < 20) alerts.push("LOW SOIL MOISTURE: Irrigation needed");

      return new Response(JSON.stringify({ success: true, reading: data, alerts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Retrieve latest sensor readings
      const url = new URL(req.url);
      const device_id = url.searchParams.get("device_id");
      const limit = parseInt(url.searchParams.get("limit") || "50");

      let query = supabase
        .from("sensor_readings")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(limit);

      if (device_id) query = query.eq("device_id", device_id);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ readings: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("sensor-data error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
