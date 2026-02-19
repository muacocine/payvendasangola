 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
 const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
 // PliqPag API configuration
 const PLIQPAG_API_URL = "https://api.plinqpay.com/v1";
 const PLIQPAG_API_KEY = Deno.env.get("sk_U0dR0gO/7OIloX3jG8aNadRMFw88Ob26acETmc0zpoPmmNvvfJuwqlVJr/hup7Ku")!;
const PLIQPAG_PUBLIC_KEY = Deno.env.get("pk_83wqWNBxH7okXr6Rm6vzI2u4nSP0otn/MEKjoNxEgupk92OAuN5YyacYRaibcxFP") || "";
const PLIQPAG_ENTITY = "01055";
const PLIQPAG_REFERENCE = "503267937";
 
 interface PliqPagTransaction {
   externalId: string;
   callbackUrl: string;
   method: "REFERENCE" | "WALLET";
   client: { name: string; email: string; phone: string };
   items: { title: string; price: number; quantity: number }[];
   amount: number;
 }
 
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   const url = new URL(req.url);
   const pathParts = url.pathname.split("/");
   const action = pathParts[pathParts.length - 1];
 
   console.log("Payment webhook called:", action, url.pathname);
 
   try {
     if (action === "pliqpag-callback" && req.method === "POST") {
       return await handlePliqpagCallback(req);
     }
 
     if (action === "initiate" && req.method === "POST") {
       return await handleInitiate(req);
     }
 
     if (action === "activate-wallet" && req.method === "POST") {
       return await handleActivateWallet(req);
     }
 
     if (action === "purchase-pdf" && req.method === "POST") {
       return await handlePurchasePdf(req);
     }
 
     // Handle base path
     if (req.method === "POST") {
       const body = await req.json();
       if (body.action === "initiate") {
         return await handleInitiateWithBody(req, body);
       }
     }
 
     return jsonResponse({ error: "Not found", action }, 404);
   } catch (error) {
     console.error("Request error:", error);
     return jsonResponse({ error: "Internal server error" }, 500);
   }
 });
 
 function jsonResponse(data: any, status = 200) {
   return new Response(JSON.stringify(data), {
     status,
     headers: { ...corsHeaders, "Content-Type": "application/json" }
   });
 }
 
 async function handlePliqpagCallback(req: Request) {
   const payload = await req.json();
   console.log("PliqPag callback:", JSON.stringify(payload));
 
   const { data: transaction } = await supabase
     .from("transactions")
     .select("*")
     .eq("id", payload.externalId)
     .single();
 
   if (!transaction) return jsonResponse({ error: "Transaction not found" }, 404);
 
   const { data: profile } = await supabase
     .from("profiles")
     .select("*")
     .eq("user_id", transaction.user_id)
     .single();
 
   if (!profile) return jsonResponse({ error: "Profile not found" }, 404);
 
   if (payload.status === "PAID") {
     await supabase.from("transactions")
       .update({ status: "completed", description: `${transaction.description} - PliqPag: ${payload.id}` })
       .eq("id", transaction.id);
 
     if (transaction.type === "deposit") {
       await supabase.from("profiles")
         .update({ balance: (profile.balance || 0) + transaction.amount })
         .eq("user_id", transaction.user_id);
 
       await supabase.from("notifications").insert({
         user_id: transaction.user_id,
         type: "deposit",
         title: "Deposito Confirmado",
         message: `Deposito de ${transaction.amount.toLocaleString()} AOA confirmado!`
       });
     }
 
     return jsonResponse({ success: true, message: "Payment confirmed" });
   }
 
   if (payload.status === "EXPIRED" || payload.status === "CANCELLED") {
     await supabase.from("transactions")
       .update({ status: "failed", description: `${transaction.description} - ${payload.status}` })
       .eq("id", transaction.id);
 
     if (transaction.type === "withdrawal") {
       await supabase.from("profiles")
         .update({ balance: (profile.balance || 0) + transaction.amount })
         .eq("user_id", transaction.user_id);
     }
 
     return jsonResponse({ success: true, message: "Payment cancelled" });
   }
 
   return jsonResponse({ success: true });
 }
 
 async function handleInitiate(req: Request) {
   const body = await req.json();
   return handleInitiateWithBody(req, body);
 }
 
 async function handleInitiateWithBody(req: Request, body: any) {
   const authHeader = req.headers.get("Authorization");
   if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
 
   const { type, amount, phone } = body;
   if (!type || !amount || !phone) return jsonResponse({ error: "Missing fields" }, 400);
 
   const token = authHeader.replace("Bearer ", "");
   const { data: { user }, error: authError } = await supabase.auth.getUser(token);
   if (authError || !user) return jsonResponse({ error: "Invalid token" }, 401);
 
   const { data: profile } = await supabase
     .from("profiles")
     .select("*")
     .eq("user_id", user.id)
     .single();
 
   if (!profile) return jsonResponse({ error: "Profile not found" }, 404);
   if (profile.kyc_status !== "approved") return jsonResponse({ error: "KYC nao aprovado" }, 400);
   if (!profile.wallet_activated) return jsonResponse({ error: "Carteira nao ativada" }, 400);
 
   // Validate withdrawal limits
   if (type === "withdrawal") {
     if (amount < 50) return jsonResponse({ error: "Minimo: 50 AOA" }, 400);
     if (amount > 200000) return jsonResponse({ error: "Maximo: 200.000 AOA" }, 400);
     if ((profile.balance || 0) < amount) return jsonResponse({ error: "Saldo insuficiente" }, 400);
 
     // Deduct from balance
     await supabase.from("profiles")
       .update({ balance: (profile.balance || 0) - amount })
       .eq("user_id", user.id);
   }
 
   if (type === "deposit" && amount < 100) return jsonResponse({ error: "Minimo: 100 AOA" }, 400);
 
   // Create transaction
   const { data: transaction, error: txError } = await supabase
     .from("transactions")
     .insert({
       user_id: user.id,
       type,
       amount,
       status: "pending",
       method: "PayPay Africa",
       description: `${type === "deposit" ? "Deposito" : "Levantamento"} - ${phone}`
     })
     .select()
     .single();
 
   if (txError) {
     console.error("Transaction error:", txError);
     return jsonResponse({ error: "Erro ao criar transacao" }, 500);
   }
 
   // Call PliqPag API
   const pliqpagPayload: PliqPagTransaction = {
     externalId: transaction.id,
     callbackUrl: `${supabaseUrl}/functions/v1/payment-webhook/pliqpag-callback`,
     method: type === "deposit" ? "REFERENCE" : "WALLET",
     client: {
       name: profile.full_name || "Cliente PayVendas",
       email: user.email || "cliente@payvendas.ao",
       phone: phone.startsWith("+244") ? phone : `+244${phone}`
     },
     items: [{
       title: type === "deposit" ? "Deposito PayVendas" : "Levantamento PayVendas",
       price: amount,
       quantity: 1
     }],
     amount
   };
 
   console.log("PliqPag request:", JSON.stringify(pliqpagPayload));
 
   const pliqpagResponse = await fetch(`${PLIQPAG_API_URL}/transaction`, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "api-key": PLIQPAG_API_KEY,applicationentity-id": PLIQPAG_ENTITY,
       "x-reference": PLIQPAG_REFERENCE
     },
     body: JSON.stringify(pliqpagPayload)
   });
 
   const pliqpagResult = await pliqpagResponse.json();
   console.log("PliqPag response:", JSON.stringify(pliqpagResult));
 
   if (!pliqpagResponse.ok) {
     await supabase.from("transactions")
       .update({ status: "failed", description: `Erro PliqPag: ${JSON.stringify(pliqpagResult)}` })
       .eq("id", transaction.id);
 
     if (type === "withdrawal") {
       await supabase.from("profiles")
         .update({ balance: profile.balance || 0 })
         .eq("user_id", user.id);
     }
 
     return jsonResponse({ error: pliqpagResult.message || "Erro PliqPag" }, 400);
   }
 
   await supabase.from("transactions")
     .update({ description: `${transaction.description} - Ref: ${pliqpagResult.reference || pliqpagResult.id}` })
     .eq("id", transaction.id);
 
    return jsonResponse({
      success: true,
      transaction_id: transaction.id,
      reference: pliqpagResult.reference || pliqpagResult.id,
      entity: PLIQPAG_ENTITY,
      payment_url: pliqpagResult.paymentUrl,
      instructions: type === "deposit"
        ? `Entidade: ${PLIQPAG_ENTITY}\nReferência: ${pliqpagResult.reference || pliqpagResult.id}\nValor: ${amount} AOA\n\nUse estes dados no Multicaixa Express ou PayPay África para concluir o pagamento.`
        : `Levantamento de ${amount} AOA sera enviado para ${phone}`
    });
 }
 
 async function handleActivateWallet(req: Request) {
   const authHeader = req.headers.get("Authorization");
   if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
 
   const token = authHeader.replace("Bearer ", "");
   const { data: { user } } = await supabase.auth.getUser(token);
   if (!user) return jsonResponse({ error: "Invalid token" }, 401);
 
   const { data: profile } = await supabase
     .from("profiles")
     .select("*")
     .eq("user_id", user.id)
     .single();
 
   if (!profile) return jsonResponse({ error: "Profile not found" }, 404);
   if (profile.wallet_activated) return jsonResponse({ error: "Carteira ja ativada" }, 400);
   if (profile.kyc_status !== "approved") return jsonResponse({ error: "KYC nao aprovado" }, 400);
 
   await supabase.from("profiles")
     .update({ wallet_activated: true, wallet_activation_date: new Date().toISOString() })
     .eq("user_id", user.id);
 
   await supabase.from("notifications").insert({
     user_id: user.id,
     type: "wallet",
     title: "Carteira Ativada",
     message: "Sua carteira PayVendas foi ativada!"
   });
 
   return jsonResponse({ success: true, message: "Carteira ativada!" });
 }
 
 async function handlePurchasePdf(req: Request) {
   const authHeader = req.headers.get("Authorization");
   if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);
 
   const { product_id } = await req.json();
 
   const token = authHeader.replace("Bearer ", "");
   const { data: { user } } = await supabase.auth.getUser(token);
   if (!user) return jsonResponse({ error: "Invalid token" }, 401);
 
   const { data: profile } = await supabase
     .from("profiles")
     .select("*")
     .eq("user_id", user.id)
     .single();
 
   if (!profile) return jsonResponse({ error: "Profile not found" }, 404);
 
   const { data: product } = await supabase
     .from("pdf_products")
     .select("*")
     .eq("id", product_id)
     .eq("status", "approved")
     .single();
 
   if (!product) return jsonResponse({ error: "Produto nao encontrado" }, 404);
   if ((profile.balance || 0) < product.price) return jsonResponse({ error: "Saldo insuficiente" }, 400);
 
   // Check already purchased
   const { data: existing } = await supabase
     .from("pdf_purchases")
     .select("id")
     .eq("user_id", user.id)
     .eq("product_id", product_id)
     .single();
 
   if (existing) return jsonResponse({ error: "Ja comprou este produto" }, 400);
 
   // Process purchase
   const sellerEarnings = product.price * 0.85;
 
   await supabase.from("profiles")
     .update({ balance: (profile.balance || 0) - product.price })
     .eq("user_id", user.id);
 
   const { data: sellerProfile } = await supabase
     .from("profiles")
     .select("balance")
     .eq("user_id", product.user_id)
     .single();
 
   if (sellerProfile) {
     await supabase.from("profiles")
       .update({ balance: (sellerProfile.balance || 0) + sellerEarnings })
       .eq("user_id", product.user_id);
   }
 
   await supabase.from("pdf_purchases").insert({
     user_id: user.id,
     product_id,
     amount: product.price
   });
 
   await supabase.from("pdf_products")
     .update({ downloads_count: (product.downloads_count || 0) + 1 })
     .eq("id", product_id);
 
   await supabase.from("transactions").insert({
     user_id: user.id,
     type: "withdrawal",
     amount: product.price,
     status: "completed",
     method: "PayVendas",
     description: `Compra: ${product.title}`
   });
 
   await supabase.from("notifications").insert({
     user_id: product.user_id,
     type: "sale",
     title: "Nova Venda!",
     message: `Voce vendeu "${product.title}" por ${product.price} AOA`
   });
 
   return jsonResponse({
     success: true,
     file_url: product.file_url,
     message: "Compra realizada!"
   });
 }
