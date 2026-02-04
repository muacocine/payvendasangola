import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";

const app = new Hono();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PliqPag API configuration for PayPay Africa
const PLIQPAG_API_URL = "https://pliqpag-api.onrender.com/v1";
const PLIQPAG_API_KEY = Deno.env.get("PLIQPAG_API_KEY")!;

// Admin master accounts
const ADMIN_MASTER_ID = '4dd2713f-0d80-4644-9a44-70a0acc7e6e5'; // isaacmuaco582@gmail.com

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

// CORS preflight
app.options("*", (c) => {
  return new Response(null, { headers: corsHeaders });
});

// PliqPag webhook callback - processes payments automatically
app.post("/pliqpag-callback", async (c) => {
  try {
    const payload: PliqPagCallback = await c.req.json();
    
    console.log("PliqPag callback received:", JSON.stringify(payload));

    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", payload.externalId)
      .single();

    if (findError || !transaction) {
      console.error("Transaction not found:", findError);
      return c.json({ error: "Transaction not found" }, 404);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", transaction.user_id)
      .single();

    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    if (payload.status === "PAID") {
      // Update transaction status - automatically approved by PliqPag API
      await supabase
        .from("transactions")
        .update({ 
          status: "completed",
          description: `${transaction.description} - Confirmado PliqPag: ${payload.id}`
        })
        .eq("id", transaction.id);

      if (transaction.type === "deposit") {
        const newBalance = (profile.balance || 0) + transaction.amount;
        
        await supabase
          .from("profiles")
          .update({ balance: newBalance })
          .eq("user_id", transaction.user_id);

        await supabase
          .from("notifications")
          .insert({
            user_id: transaction.user_id,
            type: "deposit",
            title: "Deposito Confirmado",
            message: `Seu deposito de ${transaction.amount.toLocaleString()} AOA foi confirmado via PayPay Africa!`
          });
      }

      if (transaction.type === "withdrawal") {
        await supabase
          .from("notifications")
          .insert({
            user_id: transaction.user_id,
            type: "withdrawal",
            title: "Levantamento Processado",
            message: `Seu levantamento de ${transaction.amount.toLocaleString()} AOA foi enviado para sua conta PayPay!`
          });
      }

      return c.json({ success: true, message: "Payment confirmed automatically" }, { headers: corsHeaders });
    } else if (payload.status === "EXPIRED" || payload.status === "CANCELLED") {
      await supabase
        .from("transactions")
        .update({ 
          status: "failed",
          description: `${transaction.description} - ${payload.status}`
        })
        .eq("id", transaction.id);

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

// Initiate deposit or withdrawal via PliqPag/PayPay Africa
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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: "Invalid token" }, { status: 401, headers: corsHeaders });
    }

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
      return c.json({ error: "KYC nao aprovado. Complete a verificacao primeiro." }, { status: 400, headers: corsHeaders });
    }

    // Wallet is now free - just check if activated
    if (!profile.wallet_activated) {
      return c.json({ error: "Ative sua carteira primeiro (gratis)." }, { status: 400, headers: corsHeaders });
    }

    // Validate withdrawal - min 500 AOA, max 200000 AOA
    if (type === "withdrawal") {
      if (amount < 500) {
        return c.json({ error: "Valor minimo de levantamento: 500 AOA" }, { status: 400, headers: corsHeaders });
      }

      if (amount > 200000) {
        return c.json({ error: "Valor maximo de levantamento: 200.000 AOA" }, { status: 400, headers: corsHeaders });
      }

      if ((profile.balance || 0) < amount) {
        return c.json({ error: "Saldo insuficiente" }, { status: 400, headers: corsHeaders });
      }

      // Check if user has traded with real money before withdrawing bonus
      const bonusBalance = profile.bonus_balance || 0;
      const realBalance = (profile.balance || 0) - bonusBalance;

      if (bonusBalance > 0 && amount > realBalance) {
        // Check if user has done real trades
        const { data: realTrades } = await supabase
          .from("trades")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_demo", false)
          .limit(1);

        if (!realTrades || realTrades.length === 0) {
          return c.json({ 
            error: "Para sacar o bonus, voce precisa usar o saldo em trading primeiro" 
          }, { status: 400, headers: corsHeaders });
        }

        // Check if user has deposited real money
        const { data: deposits } = await supabase
          .from("transactions")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "deposit")
          .eq("status", "completed")
          .limit(1);

        if (!deposits || deposits.length === 0) {
          return c.json({ 
            error: "Voce precisa fazer um deposito real antes de poder sacar" 
          }, { status: 400, headers: corsHeaders });
        }
      }

      // Deduct from balance immediately for withdrawal
      await supabase
        .from("profiles")
        .update({ balance: (profile.balance || 0) - amount })
        .eq("user_id", user.id);
    }

    // Validate deposit minimum
    if (type === "deposit" && amount < 100) {
      return c.json({ error: "Valor minimo de deposito: 100 AOA" }, { status: 400, headers: corsHeaders });
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type,
        amount,
        status: "pending",
        method: "PayPay Africa",
        description: `${type === "deposit" ? "Deposito" : "Levantamento"} via PayPay Africa - ${phone}`
      })
      .select()
      .single();

    if (txError) {
      throw txError;
    }

    // Create PliqPag transaction
    const pliqpagPayload: PliqPagTransaction = {
      externalId: transaction.id,
      callbackUrl: getCallbackUrl(),
      method: type === "deposit" ? "REFERENCE" : "WALLET",
      client: {
        name: profile.full_name || "Cliente PayVendas",
        email: user.email || "cliente@payvendas.ao",
        phone: phone.startsWith("+244") ? phone : `+244${phone}`
      },
      items: [
        {
          title: type === "deposit" ? "Deposito PayVendas" : "Levantamento PayVendas",
          price: amount,
          quantity: 1
        }
      ],
      amount: 1
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

      // Refund if withdrawal
      if (type === "withdrawal") {
        await supabase
          .from("profiles")
          .update({ balance: (profile.balance || 0) })
          .eq("user_id", user.id);
      }

      return c.json({ 
        error: pliqpagResult.message || "Erro ao criar transacao de pagamento" 
      }, { status: 400, headers: corsHeaders });
    }

    // Update transaction with PliqPag reference
    await supabase
      .from("transactions")
      .update({ 
        description: `${transaction.description} - Ref: ${pliqpagResult.reference || pliqpagResult.id}`
      })
      .eq("id", transaction.id);

    if (type === "deposit") {
      return c.json({
        success: true,
        transaction_id: transaction.id,
        pliqpag_id: pliqpagResult.id,
        reference: pliqpagResult.reference,
        payment_url: pliqpagResult.paymentUrl,
        instructions: `1. Abra o app PayPay Africa\n2. Use a referencia: ${pliqpagResult.reference || pliqpagResult.id}\n3. Valor: ${amount.toLocaleString()} AOA\n4. Seu saldo sera creditado automaticamente`,
        message: "Siga as instrucoes para completar o deposito"
      }, { headers: corsHeaders });
    } else {
      return c.json({
        success: true,
        transaction_id: transaction.id,
        pliqpag_id: pliqpagResult.id,
        reference: pliqpagResult.reference,
        instructions: `Seu levantamento de ${amount.toLocaleString()} AOA sera enviado para ${phone} via PayPay Africa.\nProcessamento automatico em ate 5 minutos.`,
        message: "Seu levantamento esta sendo processado automaticamente"
      }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error("Initiate payment error:", error);
    return c.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
});

// Activate wallet (now free)
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return c.json({ error: "Profile not found" }, { status: 404, headers: corsHeaders });
    }

    if (profile.wallet_activated) {
      return c.json({ error: "Carteira ja ativada" }, { status: 400, headers: corsHeaders });
    }

    if (profile.kyc_status !== "approved") {
      return c.json({ error: "KYC nao aprovado" }, { status: 400, headers: corsHeaders });
    }

    // Free wallet activation
    await supabase
      .from("profiles")
      .update({
        wallet_activated: true,
        wallet_activation_date: new Date().toISOString()
      })
      .eq("user_id", user.id);

    // Record activation transaction
    await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "wallet_activation",
        amount: 0,
        status: "completed",
        method: "PayVendas",
        description: "Ativacao de carteira gratuita"
      });

    await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "wallet",
        title: "Carteira Ativada",
        message: "Sua carteira PayVendas foi ativada gratuitamente! Agora voce pode depositar e sacar."
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

// Process PDF purchase
app.post("/purchase-pdf", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { product_id } = await c.req.json();

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: "Invalid token" }, { status: 401, headers: corsHeaders });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return c.json({ error: "Profile not found" }, { status: 404, headers: corsHeaders });
    }

    const { data: product } = await supabase
      .from("pdf_products")
      .select("*")
      .eq("id", product_id)
      .eq("status", "approved")
      .single();

    if (!product) {
      return c.json({ error: "Produto nao encontrado" }, { status: 404, headers: corsHeaders });
    }

    if ((profile.balance || 0) < product.price) {
      return c.json({ error: "Saldo insuficiente" }, { status: 400, headers: corsHeaders });
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from("pdf_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .single();

    if (existingPurchase) {
      return c.json({ error: "Voce ja comprou este produto" }, { status: 400, headers: corsHeaders });
    }

    // Process purchase
    await supabase
      .from("profiles")
      .update({ balance: (profile.balance || 0) - product.price })
      .eq("user_id", user.id);

    await supabase
      .from("pdf_purchases")
      .insert({
        user_id: user.id,
        product_id: product.id,
        amount: product.price
      });

    await supabase
      .from("pdf_products")
      .update({ downloads_count: (product.downloads_count || 0) + 1 })
      .eq("id", product.id);

    // Credit seller (85%)
    const sellerAmount = product.price * 0.85;
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", product.user_id)
      .single();

    if (sellerProfile) {
      await supabase
        .from("profiles")
        .update({ balance: (sellerProfile.balance || 0) + sellerAmount })
        .eq("user_id", product.user_id);
    }

    // Platform fee to admin (15%)
    const platformFee = product.price * 0.15;
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", ADMIN_MASTER_ID)
      .single();

    if (adminProfile) {
      await supabase
        .from("profiles")
        .update({ balance: (adminProfile.balance || 0) + platformFee })
        .eq("user_id", ADMIN_MASTER_ID);
    }

    await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "pdf_purchase",
        amount: product.price,
        status: "completed",
        method: "PayVendas",
        description: `Compra: ${product.title}`
      });

    await supabase
      .from("notifications")
      .insert({
        user_id: product.user_id,
        type: "sale",
        title: "Venda Realizada",
        message: `Seu PDF "${product.title}" foi vendido por ${product.price.toLocaleString()} AOA!`
      });

    return c.json({ 
      success: true, 
      file_url: product.file_url,
      message: "Compra realizada com sucesso!" 
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Purchase PDF error:", error);
    return c.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
});

Deno.serve(app.fetch);
