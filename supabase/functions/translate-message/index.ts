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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { botMessage, userMessage, detectedLanguage } = await req.json();

    if (!botMessage) {
      return new Response(
        JSON.stringify({ error: "botMessage is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If first message from user, detect language. Otherwise use provided language.
    const systemPrompt = userMessage && !detectedLanguage
      ? `You are a translation assistant. The user sent this message: "${userMessage}"
Detect their language. Then translate the following bot message into that language.
Keep all emojis. Keep the tone friendly and conversational.
Respond with ONLY a JSON object: {"language": "<detected language code like en, fr, ha, ig, yo, pcm, etc>", "translatedMessage": "<translated text>"}
If the user wrote in English, still return the JSON with language "en" and the original message as translatedMessage.`
      : `You are a translation assistant. Translate the following message into the language with code "${detectedLanguage}".
Keep all emojis. Keep the tone friendly and conversational.
Respond with ONLY the translated text, nothing else. If the language is "en", return the original message unchanged.`;

    const userContent = systemPrompt.includes("JSON")
      ? `Translate this bot message: "${botMessage}"`
      : `Translate: "${botMessage}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited", translatedMessage: botMessage }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted", translatedMessage: botMessage }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Fallback: return original message
      return new Response(
        JSON.stringify({ translatedMessage: botMessage, language: "en" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || botMessage;

    // If we asked for JSON (language detection), parse it
    if (!detectedLanguage && userMessage) {
      try {
        // Extract JSON from response (might have markdown backticks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({
              translatedMessage: parsed.translatedMessage || botMessage,
              language: parsed.language || "en",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        console.error("Failed to parse language detection JSON:", content);
      }
      // Fallback
      return new Response(
        JSON.stringify({ translatedMessage: botMessage, language: "en" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ translatedMessage: content, language: detectedLanguage || "en" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: "Translation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
