import { motion } from "framer-motion";
import { CreditCard, Shield } from "lucide-react";
import paypayLogo from "@/assets/paypay-logo.webp";
import multicaixaLogo from "@/assets/multicaixa-logo.webp";
import pliqpagLogo from "@/assets/pliqpag-logo.png";

const paymentMethods = [
  {
    logo: multicaixaLogo,
    name: "Multicaixa Express",
    description: "Pagamento instantâneo via Multicaixa Express",
  },
  {
    logo: paypayLogo,
    name: "PayPay África",
    description: "Transferências rápidas com PayPay",
  },
  {
    logo: pliqpagLogo,
    name: "PliqPag",
    description: "Pagamentos seguros via referência",
  },
];

export const PaymentMethodsSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/40 to-background" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="liquid-glass text-center !rounded-2xl hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4 p-2">
                <img src={method.logo} alt={method.name} className="w-full h-full object-contain" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {method.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {method.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-12"
        >
          <div className="liquid-glass !p-3 !px-5 !rounded-full flex items-center gap-2 text-muted-foreground">
            <Shield size={18} className="text-primary" />
            <span className="text-sm font-medium">Pagamentos 100% Seguros</span>
          </div>
          <div className="liquid-glass !p-3 !px-5 !rounded-full flex items-center gap-2 text-muted-foreground">
            <CreditCard size={18} className="text-primary" />
            <span className="text-sm font-medium">Verificação KYC</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
