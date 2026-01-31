import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-orange-600 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/20 rounded-full" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
          <motion.img 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            src={payvendasLogo} 
            alt="PayVendas" 
            className="h-24 mb-8 brightness-0 invert" 
          />
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-display font-bold text-white mb-4"
          >
            Vende seus e-books<br />e factura mais
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-lg max-w-md"
          >
            A plataforma líder de vendas digitais em Angola e Moçambique. 
            PayPay África, dashboard completo e suporte direto.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 flex items-center gap-8"
          >
            {[
              { value: "5K+", label: "Vendedores" },
              { value: "85%", label: "Lucro" },
              { value: "24/7", label: "Suporte" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={payvendasLogo} alt="PayVendas" className="h-14 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Vende seus e-books e factura mais</p>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              Bem-vindo de volta!
            </h2>
            <p className="text-muted-foreground">
              Entre na sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary rounded-xl text-base"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary rounded-xl text-base"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-border bg-secondary w-5 h-5 text-primary focus:ring-primary" 
                />
                Lembrar-me
              </label>
              <Link to="/recuperar-senha" className="text-sm text-primary hover:underline font-medium">
                Esqueceu a senha?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-primary/30" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2" size={20} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/registro" className="text-primary hover:underline font-bold">
                Criar conta grátis
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Disponível apenas para Angola e Moçambique
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
