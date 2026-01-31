import { motion } from "framer-motion";
import { ArrowRight, ShoppingCart, Shield, BookOpen, Globe, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-person.png";
import payvendasLogo from "@/assets/payvendas-logo.png";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-secondary/30 pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-8"
            >
              <ShoppingCart size={16} />
              <span>Plataforma #1 de Vendas Digitais em Angola</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            >
              Vende seus{" "}
              <span className="text-primary">e-books</span>{" "}
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
                <Button className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 w-full sm:w-auto rounded-xl font-semibold shadow-lg shadow-primary/30">
                  Começar a Vender
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link to="/loja">
                <Button className="bg-white hover:bg-secondary text-foreground border border-border text-lg px-8 py-6 w-full sm:w-auto rounded-xl font-medium shadow-sm">
                  Ver Loja
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { value: "5K+", label: "Vendedores", icon: BookOpen },
                { value: "24/7", label: "Suporte", icon: Shield },
                { value: "2", label: "Países", icon: Globe },
                { value: "85%", label: "Lucro Vendedor", icon: CreditCard },
              ].map((stat, index) => (
                <div key={index} className="bg-white/80 backdrop-blur border border-border/50 rounded-xl p-4 shadow-sm">
                  <stat.icon size={18} className="text-primary mb-2" />
                  <div className="text-2xl font-display font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
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
              {/* Person Image */}
              <img 
                src={heroImage} 
                alt="PayVendas User" 
                className="w-full"
              />

              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-1/4 -right-2 md:-right-4 bg-white/95 backdrop-blur border border-border rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CreditCard className="text-emerald-500" size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Venda</p>
                    <p className="text-sm font-bold text-emerald-500">+5.350 AOA</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute bottom-1/3 -left-2 md:-left-4 bg-white/95 backdrop-blur border border-border rounded-xl p-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-muted-foreground text-sm"
      >
        <Globe size={16} />
        <span>Disponível em Angola e Moçambique</span>
      </motion.div>
    </section>
  );
};
