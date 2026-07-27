// 1. Corrected Deno URL Imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Regras de Gamificação (Ajusta os multiplicadores conforme a tua lógica original)
const GOLD_MULTIPLIER = 0.1; // Ex: 10% do valor da transação vira ouro
const XP_PER_TRANSACTION = 50; 

serve(async (req: Request) => {
  try {
    // 1. Receber o payload do Webhook (A nova transação)
    const payload = await req.json();
    const record = payload.record;

    if (!record || !record.profile_id) {
      return new Response("No valid record found", { status: 400 });
    }

    // 2. Inicializar cliente Supabase com permissões de Admin (Service Role)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Calcular recompensas
    const earnedGold = Math.abs(record.amount) * GOLD_MULTIPLIER;
    const earnedXp = XP_PER_TRANSACTION;

    // 4. Atualizar o perfil do utilizador (Gamificação pura)
    const { error } = await supabaseClient.rpc('increment_gamification_stats', {
      user_id: record.profile_id,
      gold_add: earnedGold,
      xp_add: earnedXp
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, earnedGold, earnedXp }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Gamification error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
})