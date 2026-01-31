import { motion } from "framer-motion";
import { BookOpen, ShoppingCart, Wallet, Users, Shield, Award } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Venda PDFs",
    description: "Publique seus e-books e conteúdos digitais. Receba 85% do valor de cada venda.",
  },
  {
    icon: ShoppingCart,
    title: "Marketplace",
    description: "Aceda a uma loja de conteúdos educativos de alta qualidade criados pela comunidade.",
  },
  {
    icon: Wallet,
    title: "Carteira Digital",
    description: "Receba pagamentos e faça saques via Multicaixa Express e PayPay África.",
  },
  {
    icon: Users,
    title: "Comunidade",
    description: "Conecte-se com outros criadores e traders. Partilhe conhecimento e resultados.",
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Verificação KYC obrigatória para garantir transações seguras na plataforma.",
  },
  {
    icon: Award,
    title: "Programa de Afiliados",
    description: "Ganhe 5% de comissão sobre os lucros de trading dos usuários que você indicar.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Tudo que você precisa para{" "}
            <span className="text-primary">vender mais</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma plataforma completa para criadores de conteúdo e traders em Angola e Moçambique.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="text-primary" size={28} />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
