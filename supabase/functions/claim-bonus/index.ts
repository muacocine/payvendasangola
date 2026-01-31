import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SIGNUP_BONUS = 1000; // 1000 AOA for new users
const PWA_INSTALL_BONUS = 500; // 500 AOA for PWA install

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bonus_type } = await req.json();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let bonusAmount = 0;
    let bonusMessage = "";

    if (bonus_type === "signup" && !profile.signup_bonus_claimed) {
      // Claim signup bonus
      bonusAmount = SIGNUP_BONUS;
      bonusMessage = `Bônus de boas-vindas de ${SIGNUP_BONUS} AOA creditado!`;

      await supabase
        .from("profiles")
        .update({
          signup_bonus_claimed: true,
          bonus_balance: (profile.bonus_balance || 0) + bonusAmount,
          balance: (profile.balance || 0) + bonusAmount,
        })
        .eq("user_id", user.id);

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "bonus",
        amount: bonusAmount,
        status: "completed",
        method: "BIOLOS",
        description: "Bônus de boas-vindas",
      });

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "bonus",
        title: "Bônus Recebido!",
        message: bonusMessage,
      });

    } else if (bonus_type === "pwa_install" && !profile.pwa_bonus_claimed) {
      // Claim PWA install bonus
      bonusAmount = PWA_INSTALL_BONUS;
      bonusMessage = `Bônus de instalação de ${PWA_INSTALL_BONUS} AOA creditado!`;

      await supabase
        .from("profiles")
        .update({
          pwa_installed: true,
          pwa_install_date: new Date().toISOString(),
          pwa_bonus_claimed: true,
          bonus_balance: (profile.bonus_balance || 0) + bonusAmount,
          balance: (profile.balance || 0) + bonusAmount,
        })
        .eq("user_id", user.id);

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "bonus",
        amount: bonusAmount,
        status: "completed",
        method: "BIOLOS",
        description: "Bônus de instalação do app",
      });

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "bonus",
        title: "Bônus de App!",
        message: bonusMessage,
      });

    } else {
      return new Response(JSON.stringify({ 
        error: "Bônus já foi resgatado ou tipo inválido" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      amount: bonusAmount,
      message: bonusMessage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Claim bonus error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});