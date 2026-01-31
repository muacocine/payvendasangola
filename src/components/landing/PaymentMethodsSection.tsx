import { motion } from "framer-motion";
import { ShoppingCart, CreditCard, Smartphone, Shield, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import paypayLogo from "@/assets/paypay-logo.webp";
import multicaixaLogo from "@/assets/multicaixa-logo.webp";
import pliqpagLogo from "@/assets/pliqpag-logo.png";

const paymentMethods = [
  {
    logo: multicaixaLogo,
    name: "Multicaixa Express",
    description: "Pagamento instantâneo via Multicaixa Express",
    color: "bg-orange-500/10"
  },
  {
    logo: paypayLogo,
    name: "PayPay África",
    description: "Transferências rápidas com PayPay",
    color: "bg-cyan-500/10"
  },
  {
    logo: pliqpagLogo,
    name: "PliqPag",
    description: "Pagamentos seguros via referência",
    color: "bg-emerald-500/10"
  },
];

export const PaymentMethodsSection = () => {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Métodos de <span className="text-primary">Pagamento</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Utilizamos os principais métodos de pagamento de Angola para sua conveniência.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {paymentMethods.map((method, index) => {
            return (
              <GlassCard
                key={index}
                hover
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center bg-white border-border"
              >
                <div className={`w-16 h-16 rounded-2xl ${method.color} flex items-center justify-center mx-auto mb-4 p-2`}>
                  <img src={method.logo} alt={method.name} className="w-full h-full object-contain" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {method.name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {method.description}
                </p>
              </GlassCard>
            );
          })}
        </div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-12"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield size={20} className="text-primary" />
            <span className="text-sm font-medium">Pagamentos 100% Seguros</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard size={20} className="text-primary" />
            <span className="text-sm font-medium">Verificação KYC</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
