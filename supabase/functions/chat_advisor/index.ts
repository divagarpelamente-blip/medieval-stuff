import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contextJson, userQuery, conversationHistory } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }

    const systemPrompt = `You are The Royal Financial Advisor of Eldoria—an expert, grounded, medieval-themed Personal CFO.
Your task is to analyze the provided Context JSON Packet deterministically and give clear, actionable, and mathematically sound financial coaching.
Speak with a medieval, fantasy tone, referring to the user as 'My Lord' or 'Sire', currency as 'Gold (g)', and financial terms using lore-friendly equivalents where appropriate (e.g., Vaults, Coffers, Ledgers, Decrees).
However, DO NOT sacrifice clarity for roleplay. Your mathematical analysis and financial advice must be extremely precise, practical, and directly tied to the Context JSON Packet.

Current Context JSON Packet:
${JSON.stringify(contextJson, null, 2)}
`;

    // Construct the payload for Gemini 1.5 API (using the standard gemini-1.5-flash model)
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      {
        role: "model",
        parts: [{ text: "Understood, my Lord. I have reviewed the Kingdom's ledgers and the Context JSON Packet. I await your command." }]
      }
    ];

    // Append conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Append current user query
    contents.push({
      role: "user",
      parts: [{ text: userQuery || "Give me a summary of my kingdom's financial health based on the Context JSON Packet." }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Alas, my Lord. The scrying orb is cloudy today.";

    return new Response(
      JSON.stringify({ advice: generatedText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      },
    )
  }
})
