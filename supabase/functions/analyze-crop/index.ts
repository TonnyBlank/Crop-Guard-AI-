import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Step 1: Check if the image is a plant leaf
    const validationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a plant image validator. Your ONLY job is to determine if the image shows a plant leaf or plant foliage. Respond with ONLY a JSON object, no markdown, no code blocks.

If the image IS a plant/leaf/crop image, respond: {"isLeaf": true}
If the image is NOT a plant/leaf/crop image, respond: {"isLeaf": false, "description": "brief description of what you see instead"}`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
              {
                type: "text",
                text: "Is this image a plant leaf or crop? Respond with only JSON."
              },
            ],
          },
        ],
      }),
    });

    if (!validationResponse.ok) {
      if (validationResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (validationResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await validationResponse.text();
      console.error("Validation call failed:", validationResponse.status, errText);
      throw new Error(`AI validation failed [${validationResponse.status}]`);
    }

    const validationData = await validationResponse.json();
    const validationContent = validationData.choices?.[0]?.message?.content || "";
    
    let validationResult;
    try {
      const cleaned = validationContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      validationResult = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse validation:", validationContent);
      validationResult = { isLeaf: true }; // default to proceeding
    }

    if (!validationResult.isLeaf) {
      return new Response(
        JSON.stringify({
          isLeaf: false,
          message: `This doesn't appear to be a plant leaf. It looks like: ${validationResult.description || "a non-plant image"}. Please upload a clear photo of a crop leaf for disease analysis.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Full disease diagnosis
    const diagnosisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        tools: [
          {
            type: "function",
            function: {
              name: "crop_diagnosis",
              description: "Return a structured crop disease diagnosis from a leaf image.",
              parameters: {
                type: "object",
                properties: {
                  isHealthy: { type: "boolean", description: "Whether the plant appears healthy with no disease" },
                  disease: { type: "string", description: "Name of the detected disease, or 'Healthy' if no disease found" },
                  scientificName: { type: "string", description: "Scientific/Latin name of the pathogen if diseased, or empty string" },
                  confidence: { type: "number", description: "Confidence score 0-100" },
                  severity: { type: "string", enum: ["None", "Low", "Medium", "High", "Critical"], description: "Severity level" },
                  plantType: { type: "string", description: "Identified plant/crop type" },
                  description: { type: "string", description: "Detailed 2-3 sentence description of the condition observed" },
                  affectedArea: { type: "string", description: "Estimated percentage of leaf area affected (e.g. '15-20%')" },
                  spreadRisk: { type: "string", enum: ["Low", "Medium", "High"], description: "Risk of spreading to other plants" },
                  treatments: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-5 specific treatment recommendations"
                  },
                  prevention: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 prevention tips for the future"
                  },
                  organicAlternatives: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 organic/natural treatment options"
                  },
                },
                required: ["isHealthy", "disease", "scientificName", "confidence", "severity", "plantType", "description", "affectedArea", "spreadRisk", "treatments", "prevention", "organicAlternatives"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "crop_diagnosis" } },
        messages: [
          {
            role: "system",
            content: `You are an elite agricultural pathologist AI with expertise in over 100 crop varieties. Analyze the leaf image with extreme precision. Identify the exact disease, pathogen, severity, and provide actionable treatment plans. If the leaf appears healthy, report it as healthy with appropriate recommendations for maintaining plant health.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
              {
                type: "text",
                text: "Analyze this crop leaf image for any signs of disease, nutrient deficiency, pest damage, or stress. Provide a comprehensive diagnosis.",
              },
            ],
          },
        ],
      }),
    });

    if (!diagnosisResponse.ok) {
      if (diagnosisResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (diagnosisResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await diagnosisResponse.text();
      console.error("Diagnosis call failed:", diagnosisResponse.status, errText);
      throw new Error(`AI diagnosis failed [${diagnosisResponse.status}]`);
    }

    const diagnosisData = await diagnosisResponse.json();
    const toolCall = diagnosisData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "crop_diagnosis") {
      throw new Error("AI did not return structured diagnosis");
    }

    const diagnosis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ isLeaf: true, diagnosis }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("analyze-crop error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
