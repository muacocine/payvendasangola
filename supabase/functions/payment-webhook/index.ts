import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";

const app = new Hono();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase client with service role
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PliqPag API configuration
const PLIQPAG_API_URL = "https://pliqpag-api.onrender.com/v1";
const PLIQPAG_API_KEY = Deno.env.get("PLIQPAG_API_KEY")!;

// Admin master email
const ADMIN_MASTER_EMAIL = "isaacmuaco582@gmail.com";

// Callback URL for PliqPag webhooks
const getCallbackUrl = () => {
  return `${supabaseUrl}/functions/v1/payment-webhook/pliqpag-callback`;
};

interface PliqPagTransaction {
  externalId: string;
  callbackUrl: string;
  method: "REFERENCE" | "WALLET";
  client: {
    name: string;
    email: string;
    phone: string;
  };
  items: {
    title: string;
    price: number;
    quantity: number;
  }[];
  amount: number;
}

interface PliqPagCallback {
  id: string;
  externalId: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  amount: number;
  reference?: string;
  paidAt?: string;
}

// Get admin master user id
async function getAdminMasterUserId(): Promise<string | null> {
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users?.find(u => u.email === ADMIN_MASTER_EMAIL);
  return adminUser?.id || null;
}

// CORS preflight
app.options("*", (c) => {
  return new Response(null, { headers: corsHeaders });
});

// PliqPag webhook callback endpoint
app.post("/pliqpag-callback", async (c) => {
  try {
    const payload: PliqPagCallback = await c.req.json();
    
    console.log("PliqPag callback received:", JSON.stringify(payload));

    // Find the transaction by external ID
    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", payload.externalId)
      .single();

    if (findError || !transaction) {
      console.error("Transaction not found:", findError);
      return c.json({ error: "Transaction not found" }, 404);
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", transaction.user_id)
      .single();

    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    if (payload.status === "PAID") {
      // Update transaction status
      await supabase
        .from("transactions")
        .update({ 
          status: "completed",
          description: `${transaction.description} - Confirmado PliqPag: ${payload.id}`
        })
        .eq("id", transaction.id);

      // If deposit, add to balance
      if (transaction.type === "deposit") {
        const newBalance = (profile.balance || 0) + transaction.amount;
        
        await supabase
          .from("profiles")
          .update({ balance: newBalance })
          .eq("user_id", transaction.user_id);

        // Create notification
        await supabase
          .from("notifications")
          .insert({
            user_id: transaction.user_id,
            type: "deposit",
            title: "Depósito Confirmado",
            message: `Seu depósito de ${transaction.amount.toLocaleString()} AOA foi confirmado via PliqPag!`
          });
      }

      // If withdrawal was processed
      if (transaction.type === "withdrawal") {
        await supabase
          .from("notifications")
          .insert({
            user_id: transaction.user_id,
            type: "withdrawal",
            title: "Levantamento Processado",
            message: `Seu levantamento de ${transaction.amount.toLocaleString()} AOA foi enviado!`
          });
      }

      return c.json({ success: true, message: "Payment confirmed" }, { headers: corsHeaders });
    } else if (payload.status === "EXPIRED" || payload.status === "CANCELLED") {
      // Update transaction as failed
      await supabase
        .from("transactions")
        .update({ 
          status: "failed",
          description: `${transaction.description} - ${payload.status}`
        })
        .eq("id", transaction.id);

      // If withdrawal failed, refund the balance
      if (transaction.type === "withdrawal") {
        const newBalance = (profile.balance || 0) + transaction.amount;
        
        await supabase
          .from("profiles")
          .update({ balance: newBalance })
          .eq("user_id", transaction.user_id);

        await supabase
          .from("notifications")
          .insert({
            user_id: transaction.user_id,
            type: "withdrawal",
            title: "Levantamento Falhou",
            message: `Seu levantamento de ${transaction.amount.toLocaleString()} AOA falhou. O valor foi devolvido.`
          });
      }

      return c.json({ success: true, message: "Payment cancelled/expired" }, { headers: corsHeaders });
    }

    return c.json({ success: true, message: "Webhook received" }, { headers: corsHeaders });
  } catch (error) {
    console.error("PliqPag callback error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Endpoint to initiate payment via PliqPag
app.post("/initiate", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { type, amount, method, phone } = await c.req.json();

    if (!type || !amount || !phone) {
      return c.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: "Invalid token" }, { status: 401, headers: corsHeaders });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return c.json({ error: "Profile not found" }, { status: 404, headers: corsHeaders });
    }

    // Check KYC status
    if (profile.kyc_status !== "approved") {
      return c.json({ error: "KYC não aprovado. Complete a verificação primeiro." }, { status: 400, headers: corsHeaders });
    }

    // Check wallet activation
    if (!profile.wallet_activated) {
      return c.json({ error: "Carteira não ativada. Ative primeiro pagando 100 AOA." }, { status: 400, headers: corsHeaders });
    }

    // Validate withdrawal
    if (type === "withdrawal") {
      if (amount < 200) {
        return c.json({ error: "Valor mínimo de levantamento: 200 AOA" }, { status: 400, headers: corsHeaders });
      }

      if (amount > 200000) {
        return c.json({ error: "Valor máximo de levantamento: 200.000 AOA" }, { status: 400, headers: corsHeaders });
      }

      if ((profile.balance || 0) < amount) {
        return c.json({ error: "Saldo insuficiente" }, { status: 400, headers: corsHeaders });
      }

      // Check if user can withdraw (must have profit if using bonus)
      const bonusBalance = profile.bonus_balance || 0;
      const realBalance = (profile.balance || 0) - bonusBalance;
      const totalProfit = profile.total_profit || 0;

      if (realBalance < amount && totalProfit <= 0) {
        return c.json({ 
          error: "Você precisa ter lucro em trading para poder sacar o saldo de bônus" 
        }, { status: 400, headers: corsHeaders });
      }

      // Deduct from balance immediately for withdrawal
      await supabase
        .from("profiles")
        .update({ balance: (profile.balance || 0) - amount })
        .eq("user_id", user.id);
    }

    // Validate deposit minimum
    if (type === "deposit" && amount < 100) {
      return c.json({ error: "Valor mínimo de depósito: 100 AOA" }, { status: 400, headers: corsHeaders });
    }

    // Create transaction record first
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type,
        amount,
        status: "pending",
        method: method || "PliqPag",
        description: `${type === "deposit" ? "Depósito" : "Levantamento"} via PliqPag - ${phone}`
      })
      .select()
      .single();

    if (txError) {
      throw txError;
    }

    // Create PliqPag transaction for deposits only
    if (type === "deposit") {
      const pliqpagPayload: PliqPagTransaction = {
        externalId: transaction.id,
        callbackUrl: getCallbackUrl(),
        method: "REFERENCE",
        client: {
          name: profile.full_name || "Cliente BIOLOS",
          email: user.email || "cliente@biolos.app",
          phone: phone.startsWith("+244") ? phone : `+244${phone}`
        },
        items: [
          {
            title: "Depósito BIOLOS",
            price: amount,
            quantity: 1
          }
        ],
        amount: 1 // PliqPag uses amount as quantity multiplier
      };

      console.log("Creating PliqPag transaction:", JSON.stringify(pliqpagPayload));

      const pliqpagResponse = await fetch(`${PLIQPAG_API_URL}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': PLIQPAG_API_KEY
        },
        body: JSON.stringify(pliqpagPayload)
      });

      const pliqpagResult = await pliqpagResponse.json();
      
      console.log("PliqPag response:", JSON.stringify(pliqpagResult));

      if (!pliqpagResponse.ok) {
        // Rollback transaction
        await supabase
          .from("transactions")
          .update({ status: "failed", description: `Erro PliqPag: ${JSON.stringify(pliqpagResult)}` })
          .eq("id", transaction.id);

        return c.json({ 
          error: pliqpagResult.message || "Erro ao criar transação de pagamento" 
        }, { status: 400, headers: corsHeaders });
      }

      // Update transaction with PliqPag reference
      await supabase
        .from("transactions")
        .update({ 
          description: `${transaction.description} - Ref: ${pliqpagResult.reference || pliqpagResult.id}`
        })
        .eq("id", transaction.id);

      return c.json({
        success: true,
        transaction_id: transaction.id,
        pliqpag_id: pliqpagResult.id,
        reference: pliqpagResult.reference,
        payment_url: pliqpagResult.paymentUrl,
        instructions: `1. Pague usando a referência: ${pliqpagResult.reference || pliqpagResult.id}\n2. Valor: ${amount.toLocaleString()} AOA\n3. O saldo será creditado automaticamente após confirmação`,
        message: "Siga as instruções para completar o depósito"
      }, { headers: corsHeaders });

    } else {
      // For withdrawals, create pending transaction (admin processes)
      return c.json({
        success: true,
        transaction_id: transaction.id,
        instructions: `Seu levantamento de ${amount.toLocaleString()} AOA foi solicitado.\nSerá processado em até 24 horas úteis para o número ${phone}.`,
        message: "Seu levantamento está sendo processado"
      }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error("Initiate payment error:", error);
    return c.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
});

// Admin endpoint to manually approve/reject transactions
app.post("/admin/process", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: "Invalid token" }, { status: 401, headers: corsHeaders });
    }

    // Check if admin
    const { data: isAdmin } = await supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (!isAdmin) {
      return c.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
    }

    const { transaction_id, action } = await c.req.json();

    if (!transaction_id || !action) {
      return c.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    const { data: transaction } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transaction_id)
      .single();

    if (!transaction) {
      return c.json({ error: "Transaction not found" }, { status: 404, headers: corsHeaders });
    }

    if (action === "approve") {
      // Update status
      await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", transaction_id);

      // If deposit, add to balance
      if (transaction.type === "deposit") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("user_id", transaction.user_id)
          .single();

        await supabase
          .from("profiles")
          .update({ balance: (profile?.balance || 0) + transaction.amount })
          .eq("user_id", transaction.user_id);
      }

      await supabase
        .from("notifications")
        .insert({
          user_id: transaction.user_id,
          type: transaction.type,
          title: transaction.type === "deposit" ? "Depósito Aprovado" : "Levantamento Aprovado",
          message: `Sua transação de ${transaction.amount.toLocaleString()} AOA foi aprovada!`
        });

    } else if (action === "reject") {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transaction_id);

      // If withdrawal, refund
      if (transaction.type === "withdrawal") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("user_id", transaction.user_id)
          .single();

        await supabase
          .from("profiles")
          .update({ balance: (profile?.balance || 0) + transaction.amount })
          .eq("user_id", transaction.user_id);
      }

      await supabase
        .from("notifications")
        .insert({
          user_id: transaction.user_id,
          type: transaction.type,
          title: "Transação Rejeitada",
          message: `Sua transação de ${transaction.amount.toLocaleString()} AOA foi rejeitada.`
        });
    }

    return c.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Admin process error:", error);
    return c.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
});

// Endpoint to activate wallet (pay 100 AOA activation fee)
app.post("/activate-wallet", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: "Invalid token" }, { status: 401, headers: corsHeaders });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return c.json({ error: "Profile not found" }, { status: 404, headers: corsHeaders });
    }

    if (profile.wallet_activated) {
      return c.json({ error: "Carteira já ativada" }, { status: 400, headers: corsHeaders });
    }

    if (profile.kyc_status !== "approved") {
      return c.json({ error: "KYC não aprovado" }, { status: 400, headers: corsHeaders });
    }

    const activationFee = 100;
    const totalBalance = (profile.balance || 0) + (profile.bonus_balance || 0);

    if (totalBalance < activationFee) {
      return c.json({ error: `Saldo insuficiente. Taxa de ativação: ${activationFee} AOA` }, { status: 400, headers: corsHeaders });
    }

    // Get admin master user id to transfer the fee
    const adminMasterId = await getAdminMasterUserId();
    
    // Deduct activation fee - prefer from bonus first
    let newBalance = profile.balance || 0;
    let newBonusBalance = profile.bonus_balance || 0;

    if (newBonusBalance >= activationFee) {
      newBonusBalance -= activationFee;
    } else {
      const remainingFee = activationFee - newBonusBalance;
      newBonusBalance = 0;
      newBalance -= remainingFee;
    }

    // Update user profile
    await supabase
      .from("profiles")
      .update({ 
        wallet_activated: true,
        wallet_activation_date: new Date().toISOString(),
        balance: newBalance,
        bonus_balance: newBonusBalance
      })
      .eq("user_id", user.id);

    // Transfer fee to admin
    if (adminMasterId) {
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", adminMasterId)
        .single();

      await supabase
        .from("profiles")
        .update({ balance: (adminProfile?.balance || 0) + activationFee })
        .eq("user_id", adminMasterId);

      // Record transaction for admin
      await supabase
        .from("transactions")
        .insert({
          user_id: adminMasterId,
          type: "wallet_activation_fee",
          amount: activationFee,
          status: "completed",
          description: `Taxa de ativação de carteira - ${user.email}`
        });
    }

    // Record transaction for user
    await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "wallet_activation",
        amount: activationFee,
        status: "completed",
        description: "Ativação de carteira virtual"
      });

    // Create notification
    await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "wallet",
        title: "Carteira Ativada",
        message: "Sua carteira virtual foi ativada com sucesso! Agora você pode fazer depósitos e levantamentos."
      });

    return c.json({ 
      success: true, 
      message: "Carteira ativada com sucesso!" 
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Activate wallet error:", error);
    return c.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
});

// Legacy confirm endpoint for backward compatibility
app.post("/confirm", async (c) => {
  try {
    const payload = await c.req.json();
    
    console.log("Legacy payment webhook received:", payload);

    // Find the pending transaction
    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .ilike("description", `%${payload.phone || payload.reference}%`)
      .eq("amount", payload.amount)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (findError || !transaction) {
      console.error("Transaction not found:", findError);
      return c.json({ error: "Transaction not found" }, { status: 404, headers: corsHeaders });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", transaction.user_id)
      .single();

    if (!profile) {
      return c.json({ error: "Profile not found" }, { status: 404, headers: corsHeaders });
    }

    if (payload.status === "success" || payload.status === "PAID") {
      await supabase
        .from("transactions")
        .update({ 
          status: "completed",
          description: `${transaction.description} - Confirmado: ${payload.transaction_id || payload.id}`
        })
        .eq("id", transaction.id);

      if (transaction.type === "deposit") {
        const newBalance = (profile.balance || 0) + payload.amount;
        
        await supabase
          .from("profiles")
          .update({ balance: newBalance })
          .eq("user_id", transaction.user_id);

        await supabase
          .from("notifications")
          .insert({
            user_id: transaction.user_id,
            type: "deposit",
            title: "Depósito Confirmado",
            message: `Seu depósito de ${payload.amount.toLocaleString()} AOA foi confirmado!`
          });
      }

      return c.json({ success: true, message: "Payment confirmed" }, { headers: corsHeaders });
    } else if (payload.status === "failed" || payload.status === "EXPIRED" || payload.status === "CANCELLED") {
      await supabase
        .from("transactions")
        .update({ 
          status: "failed",
          description: `${transaction.description} - Falhou`
        })
        .eq("id", transaction.id);

      if (transaction.type === "withdrawal") {
        const newBalance = (profile.balance || 0) + payload.amount;
        
        await supabase
          .from("profiles")
          .update({ balance: newBalance })
          .eq("user_id", transaction.user_id);

        await supabase
          .from("notifications")
          .insert({
            user_id: transaction.user_id,
            type: "withdrawal",
            title: "Levantamento Falhou",
            message: `Seu levantamento de ${payload.amount.toLocaleString()} AOA falhou. O valor foi devolvido.`
          });
      }

      return c.json({ success: true, message: "Payment marked as failed" }, { headers: corsHeaders });
    }

    return c.json({ success: true, message: "Webhook processed" }, { headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return c.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
});

// Check transaction status
app.get("/status/:id", async (c) => {
  try {
    const transactionId = c.req.param("id");
    
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("id, status, amount, type, method, created_at, description")
      .eq("id", transactionId)
      .single();

    if (error || !transaction) {
      return c.json({ error: "Transaction not found" }, { status: 404, headers: corsHeaders });
    }

    return c.json(transaction, { headers: corsHeaders });
  } catch (error) {
    console.error("Status check error:", error);
    return c.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
});

export default app;
