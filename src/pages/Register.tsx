import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Shield, Loader2, Globe, CheckCircle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import payvendasLogo from "@/assets/payvendas-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_COUNTRIES = [
  { code: "+244", name: "Angola", flag: "🇦🇴" },
  { code: "+258", name: "Moçambique", flag: "🇲🇿" },
];

const Register = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(ALLOWED_COUNTRIES[0]);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (referralCode) {
      fetchReferrerInfo();
    }
  }, [referralCode]);

  const fetchReferrerInfo = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('referral_code', referralCode)
        .single();
      
      if (data) {
        setReferrerName(data.full_name);
      }
    } catch (error) {
      console.log('Referral code not found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Número de telefone inválido. Use o formato: 9XX XXX XXX");
      return;
    }

    setLoading(true);
    
    try {
      const fullPhone = `${selectedCountry.code}${formData.phone}`;
      await signUp(formData.email, formData.password, formData.name, fullPhone, referralCode || undefined);
      toast.success("Conta criada! Verifique seu email para ativar a conta.");
      navigate("/login");
    } catch (error) {
      // Error is handled in useAuth
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/30 flex relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
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
            Comece a Vender Hoje
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg mb-8"
          >
            Crie sua conta em minutos e comece a vender seus e-books.
          </motion.p>
          
          {/* Benefits */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 text-left"
          >
            {[
              "Conta demo gratuita com 10.000 AOA",
              "Venda PDFs e receba 85% do valor",
              "Suporte 24/7",
              "Pagamentos via Multicaixa e PayPay"
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 text-muted-foreground">
                <CheckCircle size={18} className="text-primary" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 text-center">
            <img src={payvendasLogo} alt="PayVendas" className="h-16 mx-auto" />
          </div>

          {/* Card container */}
          <div className="bg-white/90 backdrop-blur-xl border border-border/50 rounded-2xl p-6 lg:p-8 shadow-xl">
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Criar Conta
              </h1>
              <p className="text-muted-foreground text-sm">
                Junte-se à comunidade PayVendas
              </p>
            </div>

            {referralCode && referrerName && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3"
              >
                <Gift className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-primary font-medium">Indicado por {referrerName}</p>
                  <p className="text-xs text-muted-foreground">Você foi convidado para a plataforma!</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground text-sm font-medium">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="pl-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="pl-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-sm font-medium">
                  Telefone
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedCountry.code} 
                    onValueChange={(val) => setSelectedCountry(ALLOWED_COUNTRIES.find(c => c.code === val) || ALLOWED_COUNTRIES[0])}
                  >
                    <SelectTrigger className="w-28 h-11 bg-secondary border-border text-foreground rounded-xl">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span>{selectedCountry.flag}</span>
                          <span className="text-sm">{selectedCountry.code}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-border">
                      {ALLOWED_COUNTRIES.map((country) => (
                        <SelectItem 
                          key={country.code} 
                          value={country.code}
                          className="text-foreground hover:bg-secondary"
                        >
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                            <span className="text-muted-foreground">{country.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9XX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, '').slice(0, 9))}
                      className="pl-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                      required
                      disabled={loading}
                    />
                  </div>
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
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className="pl-10 pr-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground text-sm font-medium">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita sua senha"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    className="pl-10 h-11 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  className="rounded border-border bg-secondary mt-1 w-4 h-4 text-primary focus:ring-primary" 
                  required 
                />
                <span className="text-xs text-muted-foreground">
                  Li e aceito os{" "}
                  <Link to="/termos" className="text-primary hover:underline">
                    Termos e Condições
                  </Link>{" "}
                  e a{" "}
                  <Link to="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                </span>
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
                    Criar Conta
                    <ArrowRight className="ml-2" size={18} />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Shield className="text-primary" size={14} />
              <span>Verificação KYC necessária para transações</span>
            </div>

            <div className="mt-4 text-center">
              <p className="text-muted-foreground text-sm">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Entrar
                </Link>
              </p>
            </div>
          </div>

          {/* Country notice */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Globe size={12} />
            <span>Disponível apenas para Angola e Moçambique</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
