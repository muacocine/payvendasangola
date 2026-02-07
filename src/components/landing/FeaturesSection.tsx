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
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="liquid-glass !rounded-2xl hover:shadow-xl transition-shadow duration-300 cursor-default group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
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
