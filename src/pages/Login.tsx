import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import payvendasLogo from "@/assets/payvendas-logo.png";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signIn(email, password);
      navigate("/trading");
    } catch (error) {
      // Error is handled in useAuth
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/30 flex relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <div className="text-center max-w-md px-8">
          <motion.img 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            src={payvendasLogo} 
            alt="PayVendas" 
            className="h-20 mx-auto mb-8" 
          />
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-display font-bold text-foreground mb-4"
          >
            Vende seus e-books e factura mais
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Aceda à sua conta e comece a vender seus conteúdos digitais.
          </motion.p>
          
          {/* Trust indicators */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-6 mt-12"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield size={18} className="text-primary" />
              <span className="text-sm">Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe size={18} className="text-primary" />
              <span className="text-sm">Angola & Moçambique</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <img src={payvendasLogo} alt="PayVendas" className="h-16 mx-auto" />
          </div>

          {/* Card container */}
          <div className="bg-white/90 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Iniciar Sessão
              </h1>
              <p className="text-muted-foreground text-sm">
                Aceda à sua conta PayVendas
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input 
                    type="checkbox" 
                    className="rounded border-border bg-secondary w-4 h-4 text-primary focus:ring-primary" 
                  />
                  Lembrar-me
                </label>
                <Link to="/recuperar-senha" className="text-sm text-primary hover:underline font-medium">
                  Esqueceu?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/30" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="ml-2" size={18} />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Não tem conta?{" "}
                <Link to="/registro" className="text-primary hover:underline font-semibold">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>

          {/* Country notice */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-muted-foreground">
              Disponível apenas para Angola e Moçambique
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
