import { motion } from "framer-motion";
import { ArrowRight, ShoppingCart, Shield, BookOpen, Globe, CreditCard, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-person.png";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-32 right-16 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-primary text-sm font-semibold mb-8 liquid-glass-primary"
            >
              <Sparkles size={16} />
              <span>Plataforma #1 de Vendas Digitais em Angola</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
            >
              Vende seus{" "}
              <span className="text-primary relative">
                e-books
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C50 2 150 2 198 6" stroke="hsl(24 95% 53%)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>{" "}
              e factura mais
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0"
            >
              Publique seus conteúdos digitais, receba pagamentos via Multicaixa Express 
              e PayPay África. Tudo numa única plataforma.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              <Link to="/registro">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 w-full sm:w-auto rounded-2xl font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                  Começar a Vender
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link to="/loja">
                <Button className="liquid-glass text-foreground text-lg px-8 py-6 w-full sm:w-auto rounded-2xl font-medium hover:shadow-lg transition-all hover:-translate-y-0.5 border-0">
                  Ver Loja
                </Button>
              </Link>
            </motion.div>

            {/* Stats - Liquid Glass Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {[
                { value: "5K+", label: "Vendedores", icon: BookOpen },
                { value: "24/7", label: "Suporte", icon: Shield },
                { value: "2", label: "Países", icon: Globe },
                { value: "85%", label: "Lucro Vendedor", icon: CreditCard },
              ].map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="liquid-glass p-4 !rounded-2xl text-center"
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <stat.icon size={18} className="text-primary mb-2 mx-auto" />
                  <div className="text-2xl font-display font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="relative max-w-md mx-auto lg:max-w-lg">
              <img src={heroImage} alt="PayVendas User" className="w-full relative z-10" />

              {/* Floating Glass Cards */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 -right-2 md:-right-4 liquid-glass !p-3 !rounded-2xl z-20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <CreditCard className="text-emerald-500" size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Venda</p>
                    <p className="text-sm font-bold text-emerald-500">+5.350 AOA</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/3 -left-2 md:-left-4 liquid-glass !p-3 !rounded-2xl z-20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                    <BookOpen className="text-primary" size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">PDF Vendido</p>
                    <p className="text-sm font-bold text-primary">E-book Marketing</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Country notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 liquid-glass !p-3 !px-6 !rounded-full flex items-center gap-2 text-muted-foreground text-sm"
      >
        <Globe size={16} className="text-primary" />
        <span>Disponível em Angola e Moçambique</span>
      </motion.div>
    </section>
  );
};
