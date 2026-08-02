import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Tratar pedidos CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      prompt,
      messages,
      systemInstruction,
      maxTokens = 2000,
      temperature = 0.7,
      jsonMode = false,
    } = await req.json();

    if (!prompt && (!messages || !Array.isArray(messages))) {
      throw new Error("Missing 'prompt' or 'messages' parameter in the request body.");
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY");

    let rawText = "";
    let tokenUsage: any = null;

    // 1. Tentar primeiro os modelos da Google Gemini (Cascata de resiliência)
    if (geminiKey) {
      const modelsToTry = [
        "models/gemini-1.5-flash",
        "models/gemini-2.0-flash-exp",
        "models/gemini-1.5-pro",
      ];

      for (const modelName of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${geminiKey}`;
        try {
          console.log(`[ai-proxy] Trying Gemini: ${modelName}`);

          const generationConfig: any = {
            temperature: temperature,
            maxOutputTokens: maxTokens,
          };

          if (jsonMode) {
            generationConfig.responseMimeType = "application/json";
          }

          let contents = [];
          if (messages && Array.isArray(messages)) {
            contents = messages.map(m => ({
              role: m.role === "assistant" || m.role === "model" ? "model" : "user",
              parts: [{ text: m.content }]
            }));
          } else {
            contents = [{ role: "user", parts: [{ text: prompt }] }];
          }

          const requestBody: any = {
            contents,
            generationConfig,
          };

          // Recebe a system instruction formatada enviada do Front-End
          if (systemInstruction) {
            requestBody.systemInstruction = {
              role: "system",
              parts: [{ text: systemInstruction }],
            };
          }

          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              rawText = data.candidates[0].content.parts[0].text.trim();
              tokenUsage = {
                provider: "gemini",
                model: modelName,
                prompt_tokens: data.usageMetadata?.promptTokenCount,
                completion_tokens: data.usageMetadata?.candidatesTokenCount,
                total_tokens: data.usageMetadata?.totalTokenCount
              };
              break; // Sucesso! Sai da cascata.
            }
          } else {
            console.warn(`[ai-proxy] Gemini ${modelName} status:`, res.status);
          }
        } catch (e: any) {
          console.warn(`[ai-proxy] Failed on model ${modelName}:`, e.message);
        }
      }
    }

    let lastGroqError = "";

    // 2. Fallback secundário para a Groq (Llama 3.3 70B) caso o Gemini falhe
    if (!rawText && groqKey) {
      try {
        console.log(`[ai-proxy] Gemini indisponível. Falling back to Groq (Llama 3.3 70B)...`);

        const groqMessages: any[] = [];
        if (systemInstruction) {
          groqMessages.push({ role: "system", content: systemInstruction });
        }
        if (messages && Array.isArray(messages)) {
          messages.forEach(m => {
            groqMessages.push({
              role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
              content: m.content
            });
          });
        } else {
          groqMessages.push({ role: "user", content: prompt });
        }

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: groqMessages,
            max_tokens: maxTokens,
            temperature: temperature,
            ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          rawText = data.choices?.[0]?.message?.content?.trim() || "";
          tokenUsage = {
            provider: "groq",
            model: "llama-3.3-70b-versatile",
            prompt_tokens: data.usage?.prompt_tokens,
            completion_tokens: data.usage?.completion_tokens,
            total_tokens: data.usage?.total_tokens
          };
          console.log(`[ai-proxy] Sucesso com a Groq!`);
        } else {
          lastGroqError = await res.text();
          console.warn(`[ai-proxy] Groq error status:`, res.status, lastGroqError);
          try {
            const errJson = JSON.parse(lastGroqError);
            if (
              errJson?.error?.code === "json_validate_failed" &&
              errJson?.error?.failed_generation
            ) {
              rawText = errJson.error.failed_generation;
              console.log(`[ai-proxy] Recovered failed_generation from Groq error`);
            }
          } catch (e) {
            /* ignorar erro de parse JSON */
          }
        }
      } catch (e: any) {
        lastGroqError = e.message;
        console.error(`[ai-proxy] Groq Exception:`, e.message);
      }
    }

    if (!rawText) {
      throw new Error(
        `Os provedores Gemini e Groq falharam em gerar uma resposta. Detalhes Groq: ${lastGroqError}`
      );
    }

    // Processamento de saída JSON (se solicitado pelo front-end)
    if (jsonMode) {
      const cleanedText = rawText.replace(/```json|```/g, "").trim();
      try {
        const parsed = JSON.parse(cleanedText);
        return new Response(
          JSON.stringify({ success: true, text: rawText, data: parsed, metadata: tokenUsage }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (parseErr) {
        console.error("JSON parse failed. Raw text:", rawText);
        throw new Error(`Falha ao converter resposta da IA para JSON.`);
      }
    }

    // Retorna a resposta ao Front-End compatível com `data?.text` e `data?.response`
    return new Response(
      JSON.stringify({
        success: true,
        text: rawText,
        response: rawText,
        advice: rawText,
        metadata: tokenUsage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[ai-proxy] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});