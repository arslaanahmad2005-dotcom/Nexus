// Supabase Edge Function: analyze-finances
// Deploy with: supabase functions deploy analyze-finances

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { records, metrics, profile, consents } = await req.json();

    if (!consents?.financialAnalysis) {
      return new Response(
        JSON.stringify({ error: "Consent required for financial analysis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured on Supabase Edge Function." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the AI Financial Clarity Advisor for NEXUS.
Analyze the user's financial profile and explain their habits in short, simple English.
Occupation: ${profile?.occupation || "Freelancer"}
Income: ₹${metrics?.totalIncome || 0}
Expenses: ₹${metrics?.totalExpenses || 0}
Net Remaining: ₹${metrics?.netRemaining || 0}

Output JSON:
{
  "summary": "2-3 short sentences describing money flow.",
  "positiveIndicators": ["2-3 positive indicators"],
  "areasForAttention": ["1-2 things needing care"],
  "actionableSuggestions": ["2-3 practical tips"],
  "missingInformation": ["1-2 missing data points"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response.text || "{}";
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    return new Response(text, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
