import { motion } from "framer-motion";
import { ArrowRight, Gift, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Glass gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-white/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-white text-sm font-semibold mb-8">
            <Sparkles size={16} />
            <span>Bônus de 1.000 Kz ao verificar conta</span>
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">
            Comece a vender seus e-books hoje
          </h2>
          
          <p className="text-white/85 text-lg md:text-xl mb-10 max-w-xl mx-auto">
            Junte-se a milhares de criadores que já estão a faturar com a PayVendas. 
            Crie sua conta grátis e receba um bônus de boas-vindas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/registro">
              <Button className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 w-full sm:w-auto rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5">
                <Gift className="mr-2" size={20} />
                Criar Conta Grátis
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
            <Link to="/loja">
              <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-xl text-lg px-8 py-6 w-full sm:w-auto rounded-2xl font-medium">
                Ver Loja de PDFs
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
