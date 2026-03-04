import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, CheckCircle, Clock, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PaymentResult {
  reference: string;
  entity: string;
  transaction_id: string;
  instructions: string;
  payment_url?: string;
}

const Checkout = () => {
  const { user, profile } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (profile) {
      setClientName(profile.full_name || "");
      setPhoneNumber(profile.phone || "");
      setClientEmail(user?.email || "");
    }
  }, [profile, user]);

  useEffect(() => {
    if (items.length === 0 && !paymentResult) {
      navigate("/loja");
    }
  }, [items, paymentResult, navigate]);

  const copyReference = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    toast.success("Referência copiada!");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handlePayByReference = async () => {
    if (!user || !profile) {
      toast.error("Faça login para continuar");
      return;
    }

    if (!clientName.trim() || clientName.trim().length < 2) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!clientEmail || !clientEmail.includes("@")) {
      toast.error("E-mail válido é obrigatório");
      return;
    }
    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error("Número de telefone inválido");
      return;
    }

    setProcessing(true);

    try {
      // Create a single payment for all items
      const itemTitles = items.map(i => i.title).join(", ");

      const { data: result, error } = await supabase.functions.invoke("payment-webhook", {
        body: {
          action: "initiate",
          type: "deposit",
          amount: total,
          phone: phoneNumber,
          name: clientName.trim(),
          email: clientEmail.trim(),
          description: `Compra PDFs: ${itemTitles}`
        }
      });

      if (error) throw new Error(error.message || "Erro ao gerar referência");
      if (!result?.success) throw new Error(result?.error || "Erro ao gerar referência");

      setPaymentResult({
        reference: result.reference,
        entity: result.entity,
        transaction_id: result.transaction_id,
        instructions: result.instructions,
        payment_url: result.payment_url
      });

      // Store cart items for later fulfillment when payment is confirmed
      // Save pending purchase info
      for (const item of items) {
        await supabase.from("transactions").insert({
          user_id: user.id,
          type: "pdf_purchase",
          amount: item.price,
          status: "pending",
          method: "PliqPag Referência",
          description: `Compra pendente: ${item.title} - Ref: ${result.reference}`
        });
      }

      toast.success("Referência de pagamento gerada!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setProcessing(false);
    }
  };

  if (paymentResult) {
    return (
      <div className="min-h-screen bg-background pt-16 pb-8">
        <div className="px-4 py-6 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-primary" size={32} />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-1">Referência Gerada!</h1>
              <p className="text-sm text-muted-foreground">
                Use os dados abaixo para pagar via Multicaixa Express ou PayPay África
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Entidade</p>
                  <p className="text-lg font-bold font-mono text-foreground">{paymentResult.entity}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyReference(paymentResult.entity)}
                  className="rounded-xl"
                >
                  <Copy size={14} className="mr-1" /> Copiar
                </Button>
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Referência</p>
                  <p className="text-lg font-bold font-mono text-primary">{paymentResult.reference}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyReference(paymentResult.reference)}
                  className="rounded-xl"
                >
                  {copiedRef ? <CheckCircle size={14} className="mr-1 text-emerald-500" /> : <Copy size={14} className="mr-1" />}
                  Copiar
                </Button>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">Valor a Pagar</p>
                <p className="text-2xl font-bold text-foreground">{total.toLocaleString("pt-AO")} AOA</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-semibold text-sm">Pagamento pendente</p>
                  <p className="text-amber-700 text-xs mt-1">
                    Após o pagamento, os PDFs serão liberados automaticamente. 
                    O processamento pode levar alguns minutos.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-sm font-semibold text-foreground mb-2">Produtos:</p>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-muted-foreground" />
                      <span className="text-foreground">{item.title}</span>
                    </div>
                    <span className="font-medium text-foreground">{item.price.toLocaleString("pt-AO")} AOA</span>
                  </div>
                ))}
              </div>
            </div>

            {paymentResult.payment_url && (
              <Button
                onClick={() => window.open(paymentResult.payment_url, "_blank")}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
              >
                Pagar Online
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                clearCart();
                navigate("/loja");
              }}
              className="w-full h-11 rounded-xl"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar à Loja
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-8">
      <div className="px-4 py-6 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/loja")} className="p-2 hover:bg-secondary rounded-xl">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Checkout</h1>
              <p className="text-sm text-muted-foreground">Pagamento por referência</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-semibold text-foreground mb-3">Resumo do pedido</h3>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-primary" />
                    <span className="text-foreground">{item.title}</span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                    )}
                  </div>
                  <span className="font-medium text-foreground">
                    {(item.price * item.quantity).toLocaleString("pt-AO")} AOA
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary">{total.toLocaleString("pt-AO")} AOA</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} className="text-primary" />
              <h3 className="font-semibold text-foreground">Dados para pagamento</h3>
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">Nome Completo</label>
              <Input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Seu nome completo"
                className="bg-secondary border-border text-foreground rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">E-mail</label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-secondary border-border text-foreground rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">Número de Telefone</label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 923456789"
                className="bg-secondary border-border text-foreground rounded-xl"
              />
            </div>
          </div>

          <Button
            onClick={handlePayByReference}
            disabled={processing}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg rounded-xl"
          >
            {processing ? "Gerando referência..." : "Gerar Referência de Pagamento"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Será gerada uma referência para pagar via Multicaixa Express ou PayPay África
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
